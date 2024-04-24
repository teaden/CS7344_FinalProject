import json
import threading
import asyncio
from typing import List
from queue import Queue
from ctransformers import AutoModelForCausalLM
from fastapi import FastAPI, WebSocket
from starlette.websockets import WebSocketDisconnect

app = FastAPI()
message_queue = Queue()

connected_clients = set()
client_lock = threading.Lock()

chat_history = []
chat_history_lock = threading.Lock()


@app.on_event("startup")
async def startup_event():
    # Load LLM model to be shared among multiple threads
    llm_model = AutoModelForCausalLM.from_pretrained(
        model_path_or_repo_id='orca-mini-3b.q4_0.gguf',
        local_files_only=True
    )

    # Start four LLM handler threads
    for _ in range(4):
        llm_thread = threading.Thread(target=asyncio.run, args=(llm_handler(llm_model),))
        llm_thread.start()


@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    with client_lock:
        connected_clients.add(websocket)
    try:
        while True:
            message = await websocket.receive_text()
            received_data = json.loads(message)
            message_queue.put({
                'websocket': websocket,
                'sender': received_data['sender'],
                'content': received_data['content'],
                'id': received_data['id']
            })
    except WebSocketDisconnect as e:
        print(f"WebSocket disconnected: {e.code}", flush=True)

        with client_lock:
            connected_clients.remove(websocket)

        if len(connected_clients) == 0:
            with chat_history_lock:
                chat_history.clear()
            print("Zero Clients Remain - Chat History Cleared", flush=True)
    except Exception as e:
        print(f"WebSocket error: {e}", flush=True)
        await websocket.close(code=1001)


# Adapted get_prompt from Udemy Course: The Local LLM Crash Course - Build an AI Chatbot in 2 hours!
# Source: https://github.com/nordquant/local-llm-crash-course/blob/main/solutions/chainlit_hello_world.py
def get_prompt(instruction: str, history: List[str]) -> str:
    system = "You are an AI assistant that gives helpful answers. You answer the questions in a short and concise way."
    prompt = f"### System:\n{system}\n\n"

    for exchange in history:
        prompt += f"### User:\n{exchange[0]}\n\n### Response:\n{exchange[1]}\n\n"

    prompt += f"### User:\n{instruction}\n\n### Response:\n"
    return prompt


async def llm_handler(llm_model):
    while True:
        data = message_queue.get()
        websocket, sender, content, message_id = data['websocket'], data['sender'], data['content'], data['id']

        # Broadcast user message
        user_message_data = {
            'type': 'user_message',
            'sender': sender,
            'content': content,
            'id': message_id
        }
        user_message_data_json = json.dumps(user_message_data)

        with client_lock:
            for client_websocket in connected_clients.copy():
                try:
                    await client_websocket.send_text(user_message_data_json)
                except Exception as e:
                    print(f"Failed to send user message: {e}", flush=True)

        # Broadcast AI response
        with chat_history_lock:
            response = llm_model(get_prompt(content, chat_history))

        ai_message_data = {
            'type': 'ai_response',
            'sender': 'AI',
            'recipient': sender,
            'content': response,
            'id': message_id
        }
        ai_message_data_json = json.dumps(ai_message_data)

        with client_lock:
            for client_websocket in connected_clients.copy():
                try:
                    await client_websocket.send_text(ai_message_data_json)
                except Exception as e:
                    print(f"Failed to send AI response: {e}", flush=True)

        with chat_history_lock:
            chat_history.append((content, response))
