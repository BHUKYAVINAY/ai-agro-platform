
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import "./disease-detection.scss";

const API_URL =
    `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/disease/detect`;

const cropOptions = [
    "Rice",
    "Cotton",
    "Maize",
    "Chilli",
    "Wheat",
    "Pulses",
    "Groundnut",
    "Other"
];

function DiseaseDetection() {
    const { getToken, isLoaded, isSignedIn } = useAuth();

    const [crop, setCrop] = useState("");
    const [photo, setPhoto] = useState(null);
    const [preview, setPreview] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [analyzing, setAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState(null);

    useEffect(() => {
        if (!photo) {
            setPreview("");
            return undefined;
        }

        const imageUrl = URL.createObjectURL(photo);
        setPreview(imageUrl);

        return () => URL.revokeObjectURL(imageUrl);
    }, [photo]);

    const resetMessages = () => {
        setError("");
        setMessage("");
    };

    const handleCropChange = (event) => {
        setCrop(event.target.value);
        setAnalysis(null);
        resetMessages();
    };

    const handlePhotoChange = (event) => {
        const file = event.target.files?.[0];

        setPhoto(null);
        setAnalysis(null);
        resetMessages();

        if (!file) return;

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(file.type)) {
            setError("Please select a JPG, PNG, or WebP image.");
            event.target.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError("Image must be 5 MB or smaller.");
            event.target.value = "";
            return;
        }

        setPhoto(file);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        resetMessages();
        setAnalysis(null);

        if (!isLoaded || !isSignedIn) {
            setError("Please sign in before analysing a crop.");
            return;
        }

        if (!crop) {
            setError("Please select a crop.");
            return;
        }

        if (!photo) {
            setError("Please upload a crop photo.");
            return;
        }

        setAnalyzing(true);

        try {
            const token = await getToken();

            if (!token) {
                throw new Error("Your session has expired. Please sign in again.");
            }

            const formData = new FormData();
            formData.append("crop", crop);
            formData.append("photo", photo);

            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });

            const contentType =
                response.headers.get("content-type") || "";

            const data = contentType.includes("application/json")
                ? await response.json()
                : {};

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    `Photo analysis failed (${response.status}).`
                );
            }

            if (!data.analysis) {
                throw new Error("The server did not return an analysis.");
            }

            setAnalysis(data.analysis);
            setMessage("Photo analysis completed successfully.");
        } catch (err) {
            console.error("Disease detection error:", err);
            setError(err.message || "Unable to analyse this photo.");
        } finally {
            setAnalyzing(false);
        }
    };

    if (!isLoaded) {
        return (
            <section className="disease-detection">
                <p>Checking your session...</p>
            </section>
        );
    }

    if (!isSignedIn) {
        return (
            <section className="disease-detection">
                <p>Please sign in to use Crop Disease Doctor.</p>
            </section>
        );
    }

    const renderList = (items) => {
        if (!Array.isArray(items) || items.length === 0) {
            return <p>No information provided.</p>;
        }

        return (
            <ul>
                {items.map((item, index) => (
                    <li key={`${index}-${item}`}>{item}</li>
                ))}
            </ul>
        );
    };

    return (
        <section className="disease-detection">
            <div className="disease-heading">
                <span className="disease-icon" aria-hidden="true">🌿</span>
                <div>
                    <h2>Crop Disease &amp; Pest Doctor</h2>
                    <p className="disease-description">
                        Upload a photo to investigate possible crop diseases
                        or pests and explore management options.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <label className="disease-field">
                    <span>Select Crop</span>

                    <select
                        value={crop}
                        onChange={handleCropChange}
                        required
                    >
                        <option value="">Choose your crop</option>

                        {cropOptions.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="disease-field">
                    <span>Upload Crop Photo</span>

                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handlePhotoChange}
                        required
                    />

                    <small>
                        Choose a clear photo of an affected leaf, stem,
                        fruit, or visible pest. JPG, PNG, or WebP;
                        maximum 5 MB.
                    </small>
                </label>

                {preview && (
                    <div className="disease-preview">
                        <p>Selected photo</p>
                        <img
                            src={preview}
                            alt="Preview of the selected crop"
                        />
                        <span>{photo?.name}</span>
                    </div>
                )}

                {error && (
                    <p className="disease-error" role="alert">
                        {error}
                    </p>
                )}

                {message && (
                    <p className="disease-message" role="status">
                        {message}
                    </p>
                )}

                <button
                    type="submit"
                    className="disease-submit"
                    disabled={analyzing || !isLoaded || !isSignedIn}
                >
                    {analyzing
                        ? "Analysing photo..."
                        : "Analyse Crop Photo"}
                </button>

                {analyzing && (
                    <p className="disease-progress" role="status">
                        AI is examining the image. This may take a little time.
                    </p>
                )}
            </form>

            {analysis && (
                <div className="disease-results" aria-live="polite">
                    <h3>Analysis Results</h3>

                    <div className="disease-result-summary">
                        <p>
                            <strong>Crop:</strong>{" "}
                            {analysis.crop || crop}
                        </p>

                        <p>
                            <strong>Possible problem:</strong>{" "}
                            {analysis.likelyProblem || "Not specified"}
                        </p>

                        <p>
                            <strong>Confidence:</strong>{" "}
                            {analysis.confidence || "Not specified"}
                        </p>
                    </div>

                    <h4>Visible observations</h4>
                    {renderList(analysis.observations)}

                    <h4>Organic management options</h4>
                    {renderList(analysis.organicOptions)}

                    <h4>Conventional management options</h4>
                    {renderList(analysis.conventionalOptions)}

                    <h4>Recommended next steps</h4>
                    {renderList(analysis.nextSteps)}

                    {Array.isArray(analysis.warnings) &&
                        analysis.warnings.length > 0 && (
                            <>
                                <h4>Important precautions</h4>
                                {renderList(analysis.warnings)}
                            </>
                        )}

                    <p className="disease-disclaimer">
                        <strong>Important:</strong> This is an AI-generated
                        assessment, not a confirmed diagnosis. Verify the
                        result with a qualified agricultural expert before
                        applying treatments or pesticides. Always follow
                        product labels and local agricultural guidance.
                    </p>
                </div>
            )}
        </section>
    );
}

export default DiseaseDetection;
