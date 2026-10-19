
import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";

function ChatBox() {
    const { getToken } = useAuth();

    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const sendMessage = async (event) => {
        event.preventDefault();

        const question = message.trim();

        if (!question || loading) return;

        setMessages((previous) => [
            ...previous,
            { role: "user", content: question }
        ]);

        setMessage("");
        setError("");
        setLoading(true);

        try {
            const token = await getToken();

            if (!token) {
                throw new Error("Please sign in again.");
            }

            const response = await fetch(
                "http://localhost:5000/api/assistant/chat",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        message: question
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to get AI response."
                );
            }

            setMessages((previous) => [
                ...previous,
                {
                    role: "assistant",
                    content: data.reply
                }
            ]);
        } catch (err) {
            setError(err.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section style={{ maxWidth: "700px", margin: "30px auto" }}>
            <h2>🌾 AgroAI Agriculture Assistant</h2>

            <div
                style={{
                    minHeight: "250px",
                    padding: "16px",
                    border: "1px solid #ccc",
                    borderRadius: "10px",
                    marginBottom: "16px"
                }}
            >
                {messages.length === 0 && (
                    <p>
                        Ask me about crops, soil, irrigation
                        or farming practices.
                    </p>
                )}

                {messages.map((item, index) => (
                    <div key={index} style={{ marginBottom: "16px" }}>
                        <strong>
                            {item.role === "user" ? "You" : "AgroAI"}:
                        </strong>

                        <p style={{ whiteSpace: "pre-wrap" }}>
                            {item.content}
                        </p>
                    </div>
                ))}

                {loading && <p>AgroAI is thinking...</p>}
            </div>

            {error && (
                <p style={{ color: "red" }}>{error}</p>
            )}

            <form onSubmit={sendMessage}>
                <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Ask your agriculture question..."
                    rows={3}
                    maxLength={4000}
                    required
                    style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "12px",
                        marginBottom: "10px"
                    }}
                />

                <button
                    type="submit"
                    disabled={loading || !message.trim()}
                >
                    {loading ? "Generating..." : "Ask AgroAI"}
                </button>
            </form>
        </section>
    );
}

export default ChatBox;
