import React, { useState, useContext } from "react";
import { WebSocketContext } from "./WebSocketProvider.jsx";
import "./ChatLog.css";
import { v4 as uuidv4 } from "uuid";

function ChatLog() {
    const { messages, sendMessage, username } = useContext(WebSocketContext);
    const [newMessage, setNewMessage] = useState("");

    const handleSend = () => {
        const messageId = uuidv4();
        sendMessage({ sender: username, content: newMessage, id: messageId, });
        setNewMessage("");
    };

    return (
        <div className="chat-container">
            <div className="chat-messages">
                {messages.map((msg, index) => (
                    <div key={index} className="message">
                        {msg.sender}: &nbsp; {msg.content}
                    </div>
                ))}
            </div>
            <div className="message-input">
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
