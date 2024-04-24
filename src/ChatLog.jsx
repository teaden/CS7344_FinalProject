import React, { useState, useContext } from "react";
import { WebSocketContext } from "./WebSocketProvider.jsx";
import "./ChatLog.css";
import { v4 as uuidv4 } from "uuid";

function ChatLog() {
    // Uses context to inherit list of current messages for chat box and ability to send messages over web socket
    const { messages, sendMessage, username } = useContext(WebSocketContext);
    const [newMessage, setNewMessage] = useState("");

    // Sends message to server with unique message ID value
    // ID helps for when to replace 'AI: Responding...' placeholder with actual AI response for right message in chat
    // Clear form text box for sending messages after message has been sent
    const handleSend = () => {
        const messageId = uuidv4();
        sendMessage({ sender: username, content: newMessage, id: messageId, });
        setNewMessage("");
    };

    return (
        <div className="chat-container">
            <div className="chat-messages">
                {/* Maps over list of current messages for display in chat box */}
                {messages.map((msg, index) => (
                    <div key={index} className="message">
                        {msg.sender}: &nbsp; {msg.content}
                    </div>
                ))}
            </div>
            <div className="message-input">
                {/* Input field that allows users to type new messages to the chat*/}
                <input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) =>
                        e.key === "Enter" ? handleSend() : null
                    }
                />
                <button onClick={handleSend}>Send</button>
            </div>
        </div>
    );
}

export default ChatLog;
