
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { apiRequest } from "../../api/api";
import "./alerts.scss";

const alertIcons = {
    warning: "⚠️",
    info: "💡",
    success: "✅"
};

function Alerts() {
    const { getToken } = useAuth();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadAlerts = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const result = await apiRequest("/api/alerts", getToken);
            setData(result);
        } catch (err) {
            setError(err.message || "Unable to load weather alerts.");
        } finally {
            setLoading(false);
        }
    }, [getToken]);

    useEffect(() => {
        loadAlerts();
    }, [loadAlerts]);

    const formatDate = (date) =>
        new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "short"
        });

    return (
        <main className="alerts-page">
            <header className="alerts-header">
                <div>
                    <p className="alerts-eyebrow">AGRO-AI FARM TOOLS</p>
                    <h1>Weather-Based Farming Alerts</h1>
                    <p>
                        Practical weather advisories to help plan your farm
                        activities.
                    </p>
                    {data?.location && (
                        <p className="alerts-location">
                            📍 {data.location.name}
                            {data.location.district
                                ? `, ${data.location.district}`
                                : ""}
                            {data.location.state
                                ? `, ${data.location.state}`
                                : ""}
                        </p>
                    )}
                </div>

                <button
                    className="alerts-refresh"
                    onClick={loadAlerts}
                    disabled={loading}
                >
                    {loading ? "Checking..." : "↻ Refresh alerts"}
                </button>
            </header>

            {loading && (
                <div className="alerts-status">
                    Checking current conditions and the forecast...
                </div>
            )}

            {!loading && error && (
                <div className="alerts-error">
                    <h2>Unable to load alerts</h2>
                    <p>{error}</p>
                    <button onClick={loadAlerts}>Try again</button>
                </div>
            )}

            {!loading && !error && data && (
                <>
                    <section className="alerts-summary">
                        <div>
                            <span className="alerts-summary-icon">🌦️</span>
                            <div>
                                <h2>{data.alerts.length} advisories</h2>
                                <p>Based on the available 7-day weather forecast</p>
                            </div>
                        </div>

                        <p className="alerts-updated">
                            Updated{" "}
                            {data.generatedAt
                                ? new Date(data.generatedAt).toLocaleString("en-IN")
                                : "just now"}
                        </p>
                    </section>

                    <section className="alerts-list">
                        {data.alerts.map((alert, index) => (
                            <article
                                className={`alert-card alert-${alert.type}`}
                                key={`${alert.title}-${alert.date || "today"}-${index}`}
                            >
                                <span className="alert-icon">
                                    {alertIcons[alert.type] || "🌱"}
                                </span>

                                <div className="alert-content">
                                    <div className="alert-title-row">
                                        <h3>{alert.title}</h3>

                                        {alert.date && (
                                            <span className="alert-date">
                                                {formatDate(alert.date)}
                                            </span>
                                        )}
                                    </div>

                                    <p>{alert.message}</p>
                                </div>
                            </article>
                        ))}
                    </section>

                    <aside className="alerts-disclaimer">
                        <strong>Important:</strong> These are general
                        weather-based advisories, not official severe-weather
                        warnings or a substitute for local agricultural advice.
                        Check local conditions before making farm decisions.
                    </aside>
                </>
            )}
        </main>
    );
}

export default Alerts;
