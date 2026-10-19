
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate, useParams } from "react-router-dom";
import apiRequest from "../../api/api";
import CropObservations from "./CropObservations";
import "./crop-growth-pages.scss";

const CropObservationsPage = () => {
    const { cropId } = useParams();
    const { getToken } = useAuth();
    const navigate = useNavigate();

    const [crop, setCrop] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadCrop = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const data = await apiRequest(
                "/api/crop-growth",
                getToken
            );

            const selectedCrop = (data.crops || []).find(
                (item) => item._id === cropId
            );

            if (!selectedCrop) {
                setCrop(null);
                setError(
                    "Crop not found. Return to Crop Growth Tracking and try again."
                );
                return;
            }

            setCrop(selectedCrop);
        } catch (err) {
            setError(
                err.message || "Unable to load crop details."
            );
        } finally {
            setLoading(false);
        }
    }, [cropId, getToken]);

    useEffect(() => {
        loadCrop();
    }, [loadCrop]);

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
                    AGRO-AI CROP RECORDS
                </span>

                <h1>Growth Observations</h1>

                <p>
                    Record plant height, leaf condition, notes, and
                    crop photos for each observation.
                </p>
            </header>

            {loading && <p>Loading crop details...</p>}

            {error && (
                <p className="growth-page-error" role="alert">
                    {error}
                </p>
            )}

            {!loading && crop && !error && (
                <CropObservations crop={crop} />
            )}
        </main>
    );
};

export default CropObservationsPage;
