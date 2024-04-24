import React, { useState, useEffect, useCallback } from "react";

const WebSocketContext = React.createContext(null);

function WebSocketProvider({ children, username }) {
    const [messages, setMessages] = useState([]);
    const [websocket, setWebsocket] = useState(null);

    useEffect(() => {
        const connectWebSocket = (backendUrl) => {
            try {
                console.log('Attempting to connect to:', backendUrl);
                const ws = new WebSocket(backendUrl + '/ws/chat');

                ws.onopen = () => {
                    setWebsocket(ws);
                    console.log('Connected to', backendUrl);
                };

                ws.onerror = (error) => {
                    console.error('WebSocket error connecting to', backendUrl, error);
                    if (backendUrl.includes('35.202.61.130')) { // Check if it was the cloud server
                        connectWebSocket('ws://localhost:8080'); // Fallback to localhost
                    } else {
                        console.error('Failed to connect to both cloud server and localhost');
                    }
                };

                ws.onclose = () => {
                    console.log('WebSocket connection closed');
                    setWebsocket(null); // Clear the websocket state when the connection is closed
                };

                ws.onmessage = (event) => {
                    const message = JSON.parse(event.data);

                    if (message["sender"] !== username) {
                        if (message['type'] === 'ai_response' && message["recipient"] === username) {
                            setMessages((prevMessages) =>
                                prevMessages.map((m) =>
                                    m.sender === message.sender && m.id === message.id // Check for matching ID
                                        ? {...m, content: message.content} // Update the 'text' key
                                        : m,
                                ),
                            );
                        } else {
                            setMessages((prevMessages) => [...prevMessages, message]);
                        }
                    }
                };
            } catch (error) {
                console.error('Failed to create WebSocket object for URL:', backendUrl, error);
            }
        };

        connectWebSocket('ws://35.202.61.130:8080');
    }, []);


    // Function to send messages
    const sendMessage = useCallback(
        (message) => {
            if (websocket) {
                setMessages((prevMessages) => [
                    ...prevMessages,
                    { sender: "You", content: message['content'], id: message['id'] },
                    { sender: "AI", content: "Responding to your message...", id: message['id'] },
                ]);
                websocket.send(JSON.stringify(message));
            }
        },
        [websocket],
    );

        // Function to send messages
    const addMessage = useCallback(
        (message) => {
                setMessages((prevMessages) => [...prevMessages, message]);
        },
        [messages],
    );

    return (
        <WebSocketContext.Provider value={{ messages, sendMessage, addMessage, username }}>
            {children}
        </WebSocketContext.Provider>
    );
}

export { WebSocketContext, WebSocketProvider };
