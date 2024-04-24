import json
import threading
import asyncio
from typing import List
from queue import Queue
from ctransformers import AutoModelForCausalLM
from fastapi import FastAPI, WebSocket
from starlette.websockets import WebSocketDisconnect

app = FastAPI()                         # Start uvicorn server that serves requests with Fast

# Instantiate global message queue for all clients
# Python queue is naturally thread safe and does not need a lock
message_queue = Queue()

connected_clients = set()               # Use set for collecting non-duplicates of client sockets for broadcasting
client_lock = threading.Lock()          # Create connected clients set lock for thread safety

chat_history = []                       # Allocate storage for chat history that LLM uses to generate better respones
chat_history_lock = threading.Lock()    # Create chat history lock for thread safety


# This code is run once when the uvicorn server starts
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


# This endpoint is for processing client messages
@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    # Process connection request from client
    await websocket.accept()

    # Add client socket to collection of those needed for broadcasting messages
    # Set ensures multiple requests from same client does not result in unnecessary broadcasts
    with client_lock:
        # Add client socket to collection in thread safe manner
        connected_clients.add(websocket)
    try:
        while True:
            # Await for new and parse new client messages
            message = await websocket.receive_text()
            received_data = json.loads(message)

            # Safely add message contents to input queue for processing by LLM threads
            message_queue.put({
                'websocket': websocket,
                'sender': received_data['sender'],
                'content': received_data['content'],
                'id': received_data['id']
            })
    except WebSocketDisconnect as e:
        print(f"WebSocket disconnected: {e.code}", flush=True)

        # Safely remove disconnected client socket from socket collection used for broadcasts
        with client_lock:
            connected_clients.remove(websocket)

        # The chat history can be cleared if not more clients remain
        if len(connected_clients) == 0:
            with chat_history_lock:
                chat_history.clear()
            print("Zero Clients Remain - Chat History Cleared", flush=True)
    except Exception as e:

        # Catch any other socket errors and close socket as safeguard
        print(f"WebSocket error: {e}", flush=True)
        await websocket.close(code=1001)


# Adapted get_prompt from Udemy Course: The Local LLM Crash Course - Build an AI Chatbot in 2 hours!
# Source: https://github.com/nordquant/local-llm-crash-course/blob/main/solutions/chainlit_hello_world.py
# Constructs prompts to Orca in a manner that aligns with its training data
def get_prompt(instruction: str, history: List[str]) -> str:
    system = "You are an AI assistant that gives helpful answers. You answer the questions in a short and concise way."
    prompt = f"### System:\n{system}\n\n"

    for exchange in history:
        prompt += f"### User:\n{exchange[0]}\n\n### Response:\n{exchange[1]}\n\n"

    prompt += f"### User:\n{instruction}\n\n### Response:\n"
    return prompt


async def llm_handler(llm_model):
    while True:
        # Grab top message from input queue
        data = message_queue.get()
        websocket, sender, content, message_id = data['websocket'], data['sender'], data['content'], data['id']

        # Construct user message content with information necessary for front-end
        # E.g., Ensures client that sent a message will not doubly render its own message
        user_message_data = {
            'type': 'user_message',
            'sender': sender,
            'content': content,
            'id': message_id
        }

        # Convert user message to JSON for socket transmission
        user_message_data_json = json.dumps(user_message_data)

        # Safely broadcast user message to all clients in the connected clients set
        with client_lock:
            for client_websocket in connected_clients.copy():
                try:
                    await client_websocket.send_text(user_message_data_json)
                except Exception as e:
                    print(f"Failed to send user message: {e}", flush=True)

        # Broadcast AI response
        # Safely lock chat history will LLM builds prompt from it
        with chat_history_lock:
            response = llm_model(get_prompt(content, chat_history))

        # Construct AI response object with information necessary for front-end
        # e.g., so UI assigns message a sender of 'AI' (e.g., AI: How are you?) in the chatbox
        ai_message_data = {
            'type': 'ai_response',
            'sender': 'AI',
            'recipient': sender,
            'content': response,
            'id': message_id
        }

        # Convert AI message to JSON for socket transmission
        ai_message_data_json = json.dumps(ai_message_data)

        # Safely broadcast AI message to all clients in the connected clients set
        with client_lock:
            for client_websocket in connected_clients.copy():
                try:
                    await client_websocket.send_text(ai_message_data_json)
                except Exception as e:
                    print(f"Failed to send AI response: {e}", flush=True)

        # Safely update chat history with client message content and AI response
        # Allows LLM model to build more informed responses in the future
        with chat_history_lock:
            chat_history.append((content, response))
