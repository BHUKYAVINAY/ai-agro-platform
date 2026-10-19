

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import "./farmer-profile.scss";

const API_URL =
    `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/farmer/profile`;

const initialForm = {
    name: "",
    location: "",
    district: "",
    state: "Telangana",
    farmSize: "",
    soilType: "",
    waterSource: "",
    irrigationMethod: "",
    crops: []
};

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

const waterSourceOptions = [
    "Borewell",
    "Open Well",
    "Canal",
    "River",
    "Rainwater",
    "Other"
];

const irrigationOptions = [
    "Drip Irrigation",
    "Sprinkler Irrigation",
    "Flood Irrigation",
    "Furrow Irrigation",
    "Rainfed",
    "Other"
];

const soilOptions = [
    "Black Soil",
    "Red Soil",
    "Sandy Soil",
    "Clay Soil",
    "Loamy Soil",
    "Alluvial Soil",
    "Other"
];

// Normalize older profile records without assuming
// that every borewell or canal user uses drip irrigation.
const normalizeFarmer = (farmer = {}) => {
    const oldMethod = farmer.irrigationMethod || "";

    let waterSource = farmer.waterSource || "";

    if (!waterSource && oldMethod === "Borewell") {
        waterSource = "Borewell";
    } else if (!waterSource && oldMethod === "Canal") {
        waterSource = "Canal";
    }

    let irrigationMethod = oldMethod;

    if (oldMethod === "Borewell" || oldMethod === "Canal") {
        irrigationMethod = "";
    } else if (oldMethod === "Sprinkler") {
        irrigationMethod = "Sprinkler Irrigation";
    }

    return {
        ...initialForm,
        ...farmer,
        farmSize: String(farmer.farmSize ?? ""),
        waterSource,
        irrigationMethod,
        crops: Array.isArray(farmer.crops)
            ? farmer.crops
            : []
    };
};

function FarmerProfile() {
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({ ...initialForm });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isLoaded) return undefined;

        let cancelled = false;

        const loadProfile = async () => {
            setLoading(true);
            setError("");
            setMessage("");

            if (!isSignedIn) {
                setForm({ ...initialForm });
                setLoading(false);
                return;
            }

            try {
                const token = await getToken();

                if (!token) {
                    throw new Error("Please sign in again.");
                }

                const response = await fetch(API_URL, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                const contentType =
                    response.headers.get("content-type") || "";

                const data = contentType.includes("application/json")
                    ? await response.json()
                    : {};

                if (cancelled) return;

                if (response.status === 404) {
                    setForm({ ...initialForm });
                    setMessage(
                        "No farmer profile found. Please create your profile."
                    );
                    return;
                }

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        `Failed to load profile (${response.status}).`
                    );
                }

                setForm(normalizeFarmer(data.farmer));
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.message || "Failed to load farmer profile."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadProfile();

        return () => {
            cancelled = true;
        };
    }, [isLoaded, isSignedIn, getToken]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value
        }));

        setMessage("");
        setError("");
    };

    const handleCropChange = (event) => {
        const { value, checked } = event.target;

        setForm((previous) => ({
            ...previous,
            crops: checked
                ? previous.crops.includes(value)
                    ? previous.crops
                    : [...previous.crops, value]
                : previous.crops.filter((crop) => crop !== value)
        }));

        setMessage("");
        setError("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setMessage("");
        setError("");

        if (!form.waterSource || !form.irrigationMethod) {
            setError(
                "Please select both your water source and irrigation method."
            );
            return;
        }

        if (form.crops.length === 0) {
            setError("Please select at least one primary crop.");
            return;
        }

        const farmSize = Number(form.farmSize);

        if (!Number.isFinite(farmSize) || farmSize <= 0) {
            setError("Farm size must be greater than zero.");
            return;
        }

        setSaving(true);

        try {
            const token = await getToken();

            if (!token) {
                throw new Error("Please sign in again.");
            }

            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...form,
                    farmSize
                })
            });

            const contentType =
                response.headers.get("content-type") || "";

            const data = contentType.includes("application/json")
                ? await response.json()
                : {};

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    `Failed to save profile (${response.status}).`
                );
            }

            setForm(normalizeFarmer(data.farmer));

            navigate("/dashboard", {
                replace: true,
                state: { profileSaved: true }
            });
        } catch (err) {
            setError(
                err.message || "Something went wrong while saving."
            );
        } finally {
            setSaving(false);
        }
    };

    if (!isLoaded || loading) {
        return (
            <div className="profile-loading" role="status">
                <span className="profile-spinner" />
                <p>Loading farmer profile...</p>
            </div>
        );
    }

    if (!isSignedIn) {
        return (
            <section className="farmer-profile">
                <h2>🌾 Farmer Profile</h2>
                <p>Please sign in to create your farmer profile.</p>
            </section>
        );
    }

    return (
        <main className="farmer-profile">
            <div className="profile-heading">
                <span className="profile-icon" aria-hidden="true">
                    🌾
                </span>

                <div>
                    <h2>Farmer Profile</h2>
                    <p className="profile-description">
                        Enter your farm details to personalize your AGRO-AI advice.
                    </p>
                </div>
            </div>

            {message && (
                <p className="profile-message" role="status">
                    {message}
                </p>
            )}

            {error && (
                <p className="profile-error" role="alert">
                    {error}
                </p>
            )}

            <form onSubmit={handleSubmit}>
                <div className="profile-form-grid">
                    <label className="profile-field">
                        <span>Full Name</span>
                        <input
                            name="name"
                            type="text"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Enter your full name"
                            maxLength={100}
                            required
                        />
                    </label>

                    <label className="profile-field">
                        <span>Village / Farm Location</span>
                        <input
                            name="location"
                            type="text"
                            value={form.location}
                            onChange={handleChange}
                            placeholder="Enter village or farm location"
                            maxLength={150}
                            required
                        />
                    </label>

                    <label className="profile-field">
                        <span>District</span>
                        <input
                            name="district"
                            type="text"
                            value={form.district}
                            onChange={handleChange}
                            placeholder="Enter district"
                            maxLength={100}
                            required
                        />
                    </label>

                    <label className="profile-field">
                        <span>State</span>
                        <input
                            name="state"
                            type="text"
                            value={form.state}
                            onChange={handleChange}
                            placeholder="Enter state"
                            maxLength={100}
                            required
                        />
                    </label>

                    <label className="profile-field">
                        <span>Farm Size (acres)</span>
                        <input
                            name="farmSize"
                            type="number"
                            min="0.01"
                            step="any"
                            value={form.farmSize}
                            onChange={handleChange}
                            placeholder="e.g. 2.5"
                            required
                        />
                    </label>

                    <label className="profile-field">
                        <span>Soil Type</span>
                        <select
                            name="soilType"
                            value={form.soilType}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select soil type</option>
                            {soilOptions.map((soil) => (
                                <option key={soil} value={soil}>
                                    {soil}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="profile-field">
                        <span>Water Source</span>
                        <select
                            name="waterSource"
                            value={form.waterSource}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select water source</option>
                            {waterSourceOptions.map((source) => (
                                <option key={source} value={source}>
                                    {source}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="profile-field">
                        <span>Irrigation Method</span>
                        <select
                            name="irrigationMethod"
                            value={form.irrigationMethod}
                            onChange={handleChange}
                            required
                        >
                            <option value="">
                                Select irrigation method
                            </option>
                            {irrigationOptions.map((method) => (
                                <option key={method} value={method}>
                                    {method}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                <fieldset className="crop-options">
                    <legend>Primary Crops</legend>

                    <p className="crop-help">
                        Select all crops that you currently grow.
                    </p>

                    <div className="crop-checkbox-grid">
                        {cropOptions.map((crop) => (
                            <label
                                className="crop-checkbox"
                                key={crop}
                            >
                                <input
                                    type="checkbox"
                                    value={crop}
                                    checked={form.crops.includes(crop)}
                                    onChange={handleCropChange}
                                />
                                <span>{crop}</span>
                            </label>
                        ))}
                    </div>
                </fieldset>

                <button
                    className="profile-submit"
                    type="submit"
                    disabled={saving}
                >
                    {saving ? "Saving profile..." : "Save Farmer Profile"}
                </button>
            </form>
        </main>
    );
}

export default FarmerProfile;