import React, { useState } from "react";
import { WebSocketProvider } from "./WebSocketProvider";
import UsernameInput from "./UsernameInput";
import ChatLog from "./ChatLog";
import './App.css'

function App() {
    const [username, setUsername] = useState(null);
    const [showChatLog, setShowChatLog] = useState(false);

    // Handler passed to UserNameInputForm
    // Only displays the chat box and allows user to enter the chat if a username has been entered
    const handleUsernameSubmit = (name) => {
        setUsername(name);
        setShowChatLog(true);
    };

    return (
        <div className="outer-div">
            <div>
                <h1 className="h1-title">LLMChatroom</h1>
            </div>
            {/*
                Passes user identifier to WebSocketProvider so server knows who certain messages are from
                Helps other clients know how to link usernames and messages sent by those users in the chat box
            */}
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
