import React, { useState, useEffect, useCallback } from "react";

const WebSocketContext = React.createContext(null);

function WebSocketProvider({ children, username }) {
    const [messages, setMessages] = useState([]);
    const [websocket, setWebsocket] = useState(null);

    // Runs once when component is mounted to establish web socket connection with server
    useEffect(() => {
        // Tries to connect to given url but defaults to localhost server if unsuccessful
        const connectWebSocket = (backendUrl) => {
            try {
                console.log('Attempting to connect to:', backendUrl);
                const ws = new WebSocket(backendUrl + '/ws/chat');

                // Sets active web socket in state if connection is successful
                ws.onopen = () => {
                    setWebsocket(ws);
                    console.log('Connected to', backendUrl);
                };

                // Tries to connect to localhost server if connection to given url (e.g., Google VM server) fails
                ws.onerror = (error) => {
                    console.error('WebSocket error connecting to', backendUrl, error);
                    if (backendUrl.includes('35.202.61.130')) { // Check if it was the cloud server
                        connectWebSocket('ws://localhost:8080'); // Fallback to localhost
                    } else {
                        console.error('Failed to connect to both cloud server and localhost');
                    }
                };

                // Clear the websocket state when the connection is closed
                ws.onclose = () => {
                    console.log('WebSocket connection closed');
                    setWebsocket(null);
                };

                // Process messages received from the server
                ws.onmessage = (event) => {
                    const message = JSON.parse(event.data);

                    // Only add messages from other users or AI to chat box message list
                    // Frontend state shows own client messages as "You: {message content}" after send
                    // Broadcasts of client's own messages can therefore be ignored
                    if (message["sender"] !== username) {
                        // Replace 'AI: Responding...' placeholder if AI response from server intended for current user
                        if (message['type'] === 'ai_response' && message["recipient"] === username) {
                            setMessages((prevMessages) =>
                                // Unique msg ID generated after message send (ChatLog.jsx) helps to find placeholder
                                prevMessages.map((m) =>
                                    m.sender === message.sender && m.id === message.id // Check for matching ID
                                        ? {...m, content: message.content} // Update the 'text' key
                                        : m,
                                ),
                            );
                        } else {
                            // Simply add messages from other clients to the chat box
                            setMessages((prevMessages) => [...prevMessages, message]);
                        }
                    }
                };
            } catch (error) {
                console.error('Failed to create WebSocket object for URL:', backendUrl, error);
            }
        };

        // Attempt to connect to Google Compute Engine VM Server Code
        // Note: This address should absolutely be obfuscated in a real-life application
        // The address could be stored as an environment variable on the server and sent to client as a proxy
        connectWebSocket('ws://35.202.61.130:8080');
    }, []);


    // Function to send messages passed to ChatLog.jsx for use with chat box text input
    const sendMessage = useCallback(
        (message) => {
            // Only send messages if established web socket exists
            if (websocket) {
                // Show sent messages by current client with "You: {message content}" in chat box
                // Better than waiting for server broadcast and showing "{username}: message content" for own messages
                // Use "AI: Responding..." placeholder since generating LLM responses is a timely process
                setMessages((prevMessages) => [
                    ...prevMessages,
                    { sender: "You", content: message['content'], id: message['id'] },
                    { sender: "AI", content: "Responding to your message...", id: message['id'] },
                ]);

                // Send client message to server
                websocket.send(JSON.stringify(message));
            }
        },
        [websocket],
    );

    return (
        <WebSocketContext.Provider value={{ messages, sendMessage, username }}>
            {children}
        </WebSocketContext.Provider>
    );
}

export { WebSocketContext, WebSocketProvider };
