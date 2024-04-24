import React, { useState } from "react";
import { WebSocketProvider } from "./WebSocketProvider";
import UsernameInput from "./UsernameInput";
import ChatLog from "./ChatLog";
import './App.css'

function App() {
    const [username, setUsername] = useState(null);
    const [showChatLog, setShowChatLog] = useState(false);

    const handleUsernameSubmit = (name) => {
        setUsername(name);
        setShowChatLog(true);
    };

    return (
        <div className="outer-div">
            <div>
                <h1 className="h1-title">LLMChatroom</h1>
            </div>
            {showChatLog ? (
                <WebSocketProvider username={username}>
                    <ChatLog />
                </WebSocketProvider>
            ) : (
                <UsernameInput onUsernameSubmit={handleUsernameSubmit} />
            )}
        </div>
    );
}

export default App;
