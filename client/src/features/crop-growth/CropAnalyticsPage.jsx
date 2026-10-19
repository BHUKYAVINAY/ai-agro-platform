
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate, useParams } from "react-router-dom";
import apiRequest from "../../api/api";
import CropAnalytics from "./CropAnalytics";
import "./crop-growth-pages.scss";

const CropAnalyticsPage = () => {
    const { cropId } = useParams();
    const { getToken } = useAuth();
    const navigate = useNavigate();

    const [crop, setCrop] = useState(null);
    const [observations, setObservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadAnalytics = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const cropData = await apiRequest(
                "/api/crop-growth",
                getToken
            );

            const selectedCrop = (cropData.crops || []).find(
                (item) => item._id === cropId
            );

            if (!selectedCrop) {
                setCrop(null);
                setObservations([]);
                setError(
                    "Crop not found. Return to Crop Growth Tracking and try again."
                );
                return;
            }

            setCrop(selectedCrop);

            const observationData = await apiRequest(
                `/api/crop-observations/${cropId}`,
                getToken
            );

            setObservations(
                observationData.observations || []
            );
        } catch (err) {
            setError(
                err.message || "Unable to load growth analytics."
            );
        } finally {
            setLoading(false);
        }
    }, [cropId, getToken]);

    useEffect(() => {
        loadAnalytics();
    }, [loadAnalytics]);

    return (
        <main className="crop-growth-page">
            <button
                type="button"
                className="growth-back-button"
                onClick={() => navigate("/crop-growth")}
            >
                ← Back to Crop Growth
            </button>

            <header className="growth-page-header">
                <span className="growth-eyebrow">
                    AGRO-AI ANALYTICS
                </span>

                <h1>Growth Analytics</h1>

                <p>
                    Review plant-height measurements and observation
                    history for your selected crop.
                </p>
            </header>

            {loading && <p>Loading growth analytics...</p>}

            {error && (
                <p className="growth-page-error" role="alert">
                    {error}
                </p>
            )}

            {!loading && crop && !error && (
                <CropAnalytics
                    crop={crop}
                    observations={observations}
                />
            )}
        </main>
    );
};

export default CropAnalyticsPage;
