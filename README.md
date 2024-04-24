# LLMChatroom

LLMChatroom is a web-based chat application that allows human users to interact with both each other as well as a pre-trained Orca large-language model (LLM) in the same chatroom. Th project is designed to build upon the client and server socket code discussed in chapter 6 of Tanenbaum's *Computer Networks* textbook; it does so by adding a variety of functionality, including multithreading and asynchronous programming. Clients (i.e., human users) send messages to the server, which generates LLM responses to those messages. The server then broadcasts all client messages and all AI responses to those messages to all users to facilitate the shared chatroom environment. The server code is hosted on a Google Compute Engine VM, so capturing insightful network traffic via the WiFi interface in Wireshark is possible when the client code remains on localhost.

## Starting the Client Code

Users can run the code in a Node.js environment via use of the below scripts and commands. 

•	npm install: This command acquires all necessary dependencies.
•	npm run start-client: This script starts the client React code that displays the chatroom and allows clients to send messages to the server

## Starting the Server Code Locally

There are a number of important considerations when it comes to hosting the included server.py code locally. This may be necessary at some point in the future if the Google Compute Engine VM has been shut down.

### Important Note: Acquiring the LLM Chatbot Model

For generating responses to clients, the server code directly utilizes a miniaturized Orca model, which can be downloaded via this [HuggingFace Link](https://huggingface.co/zoltanctoth/orca_mini_3B-GGUF). At 1.93gb in size, the model is too large to host on Github (and too large for Git Large File Storage without subscribing to a paid plan), so it has been omitted from this repository and would need to be acquired via the aforementioned HuggingFace link.

### Scripts

For running the server code locally, it is important that the below scripts be executed in the order shown for the following reason. The client code first attempts to connect to the server hosted on the Google Compute Engine VM before defaulting to a localhost server connection. Running ‘npm run start-server’ before ‘npm run start-client’ ensures that the server is available for the client locally if the connection to the Google Compute Engine VM fails.

•	npm install: This command acquires all necessary dependencies.
•	npm run start-server: This script locally starts the ASGI FastAPI code that processes client messages and returns LLM responses.
•	npm run start-client: This script starts the client React code that displays the chatroom and allows clients to send messages to the server.

### Python Dependencies

For running the server code locally, LLMChatroom also requires an installation of Python and the following dependencies, which can be acquired via pip or through an anaconda distribution. Python version 3.8 was used for developing this project.

•	ctransformers
•	fastapi
•	starlette
•	uvicorn[standard]
