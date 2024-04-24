import React, { useState } from "react";
import "./UsernameInput.css";

function UsernameInput({ onUsernameSubmit }) {
    const [username, setUsername] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        onUsernameSubmit(username);
        setUsername("");
    };

    return (
        <form onSubmit={handleSubmit} className="user-input">
          <label htmlFor="username" className="user-label"><h2>Enter your username:</h2></label>
          <input type="text" id="username" className="user-text" value={username} onChange={(e) => setUsername(e.target.value)} />
          <button type="submit" className="submit-btn">Join Chat</button>
        </form>
    );
}

export default UsernameInput;
