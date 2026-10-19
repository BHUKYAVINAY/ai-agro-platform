
import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import apiRequest from "../../api/api";

function Assistant() {
    const { getToken } = useAuth();

    const [question, setQuestion] = useState("");
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();

        const message = question.trim();

        if (!message || loading) return;

        setError("");
        setQuestion("");
        setMessages((previous) => [
            ...previous,
            { role: "user", content: message }
        ]);
        setLoading(true);

        try {
            const data = await apiRequest(
                "/api/assistant/chat",
                getToken,
                {
                    method: "POST",
                    body: JSON.stringify({ message })
                }
            );

            setMessages((previous) => [
                ...previous,
                { role: "assistant", content: data.reply }
            ]);
        } catch (err) {
            setError(err.message);
            setQuestion(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="page-container">
            <div className="page-heading">
                <p className="eyebrow">YOUR FARMING COMPANION</p>
                <h1>AI Farming Assistant</h1>
                <p>
                    Ask questions about cultivation, soil, irrigation,
                    and general farming practices.
                </p>
            </div>

            <section className="content-card chat-card">
                <div className="chat-messages" aria-live="polite">
                    {messages.length === 0 && (
                        <div className="chat-empty">
                            <span>🌱</span>
                            <h2>How can I help with your farm?</h2>
                            <p>
                                Try asking: "How should I manage weeds
                                in my rice field?"
                            </p>
                        </div>
                    )}

                    {messages.map((item, index) => (
                        <div
                            key={`${index}-${item.role}`}
                            className={`chat-message ${item.role}`}
                        >
                            <strong>
                                {item.role === "user" ? "You" : "AgroAI"}
                            </strong>
                            <p>{item.content}</p>
                        </div>
                    ))}

                    {loading && (
                        <p className="chat-loading">
                            AgroAI is preparing an answer...
                        </p>
                    )}
                </div>

                {error && (
                    <p className="alert alert-error" role="alert">
                        {error}
                    </p>
                )}

                <form className="chat-form" onSubmit={handleSubmit}>
                    <label className="sr-only" htmlFor="assistant-question">
                        Your farming question
                    </label>

                    <textarea
                        id="assistant-question"
                        value={question}
                        onChange={(event) => setQuestion(event.target.value)}
                        placeholder="Ask your farming question..."
                        maxLength={4000}
                        rows={3}
                        required
                    />

                    <button
                        className="button button-primary"
                        type="submit"
                        disabled={loading || !question.trim()}
                    >
                        {loading ? "Thinking..." : "Send question"}
                    </button>
                </form>

                <p className="disclaimer">
                    AI answers may be inaccurate. Confirm important crop
                    treatment decisions with a qualified agricultural expert.
                </p>
            </section>
        </section>
    );
}

export default Assistant;
