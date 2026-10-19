
import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { Navigate, Link } from "react-router-dom";
import apiRequest from "../../api/api";
import Loading from "../../components/Loading";

const features = [
    {
        icon: "🩺",
        title: "Crop Disease Doctor",
        description: "Upload a crop photo to investigate visible symptoms.",
        path: "/disease"
    },
    {
        icon: "🌱",
        title: "Crop Recommendation",
        description: "Get crop suggestions based on your farm conditions and local weather.",
        path: "/crop"
    },
    {
        icon: "🌱",
        title: "Farmer Activity Planner",
        description: "Schedule irrigation, fertilizer application, crop inspections, and other farm activities.",
        path: "/planner"
    },
    {
        icon: "🌱",
        title: "Crop Growth Tracking",
        description:
            "Record planting dates, track crop growth stages, and manage crop records.",
        path: "/crop-growth"
    },
    {
        icon: "💬",
        title: "AI Farming Assistant",
        description: "Ask questions about crops, soil, and farming practices.",
        path: "/assistant"
    },
    {
        icon: "🌦️",
        title: "Weather Forecast",
        description:
            "Check current weather and the 7-day forecast for your farm.",
        path: "/weather"
    },
    {
        icon: "⚠️",
        title: "Weather Alerts",
        description:
            "Get weather-based advisories for rain, heat, wind, and farm activities.",
        path: "/alerts"
    }

];

function Dashboard() {
    const { getToken } = useAuth();
    const { user } = useUser();

    const [farmer, setFarmer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [profileMissing, setProfileMissing] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        async function loadFarmer() {
            try {
                const data = await apiRequest(
                    "/api/farmer/profile",
                    getToken
                );

                if (active) setFarmer(data.farmer);
            } catch (err) {
                if (!active) return;

                if (err.status === 404) {
                    setProfileMissing(true);
                } else {
                    setError(err.message);
                }
            } finally {
                if (active) setLoading(false);
            }
        }

        loadFarmer();

        return () => {
            active = false;
        };
    }, [getToken]);

    if (loading) {
        return <Loading message="Preparing your farm dashboard..." />;
    }

    if (profileMissing) {
        return <Navigate to="/profile" replace />;
    }

    if (error) {
        return (
            <section className="page-container">
                <p className="alert alert-error">{error}</p>
                <button
                    className="button button-primary"
                    onClick={() => window.location.reload()}
                >
                    Try again
                </button>
            </section>
        );
    }

    return (
        <section className="page-container">
            <div className="welcome-banner">
                <div>
                    <p className="eyebrow">YOUR SMART FARMING COMPANION</p>
                    <h1>
                        Welcome, {farmer?.name || user?.firstName || "Farmer"}!
                    </h1>
                    <p>
                        Get practical farming guidance tailored to your farm.
                    </p>
                </div>
                <div className="welcome-illustration">🌾</div>
            </div>

            {farmer && (
                <section className="farm-summary">
                    <div>
                        <span className="summary-label">Farm location</span>
                        <strong>
                            {farmer.location}, {farmer.district}
                        </strong>
                    </div>
                    <div>
                        <span className="summary-label">Farm size</span>
                        <strong>{farmer.farmSize} acres</strong>
                    </div>
                    <div>
                        <span className="summary-label">Soil type</span>
                        <strong>{farmer.soilType}</strong>
                    </div>
                    <div>
                        <span className="summary-label">Crops</span>
                        <strong>
                            {Array.isArray(farmer.crops) && farmer.crops.length > 0
                                ? farmer.crops.join(", ")
                                : "No crops added"}
                        </strong>
                    </div>
                    <Link to="/profile" className="text-link">
                        Edit farm profile →
                    </Link>
                </section>
            )}

            <div className="section-heading">
                <div>
                    <h2>Your farming tools</h2>
                    <p>Choose a feature to get started.</p>
                </div>
            </div>

            <div className="feature-grid">
                {features.map((feature) => (
                    <article className="feature-card" key={feature.title}>
                        <div className="feature-icon">{feature.icon}</div>
                        <h3>{feature.title}</h3>
                        <p>{feature.description}</p>

                        {feature.comingSoon ? (
                            <span className="coming-soon">
                                Coming soon
                            </span>
                        ) : (
                            <Link
                                to={feature.path}
                                className="feature-link"
                            >
                                Open feature →
                            </Link>
                        )}
                    </article>
                ))}
            </div>
        </section>
    );
}

export default Dashboard;
