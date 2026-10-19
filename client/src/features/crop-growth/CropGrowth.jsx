
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import apiRequest from "../../api/api";
import "./crop-growth.scss";

const INITIAL_FORM = {
    cropName: "",
    variety: "",
    plantingDate: "",
    growthStage: "Seedling",
    fieldSize: "",
    fieldSizeUnit: "Acres",
    notes: "",
};

const CropGrowth = () => {
    const { getToken } = useAuth();
    const navigate = useNavigate();

    const [crops, setCrops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [form, setForm] = useState({ ...INITIAL_FORM });

    const loadCrops = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const data = await apiRequest(
                "/api/crop-growth",
                getToken
            );

            setCrops(data.crops || []);
        } catch (err) {
            setError(err.message || "Unable to load crops.");
        } finally {
            setLoading(false);
        }
    }, [getToken]);

    useEffect(() => {
        loadCrops();
    }, [loadCrops]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleAddCrop = async (event) => {
        event.preventDefault();

        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const payload = {
                cropName: form.cropName.trim(),
                variety: form.variety.trim(),
                plantingDate: form.plantingDate,
                growthStage: form.growthStage,
                fieldSize: Number(form.fieldSize),
                fieldSizeUnit: form.fieldSizeUnit,
                notes: form.notes.trim(),
            };

            await apiRequest("/api/crop-growth", getToken, {
                method: "POST",
                body: payload,
            });

            setForm({ ...INITIAL_FORM });
            setSuccess("Crop added successfully.");

            await loadCrops();
        } catch (err) {
            setError(err.message || "Unable to add crop.");
        } finally {
            setSaving(false);
        }
    };

    const handleStageChange = async (crop, growthStage) => {
        setError("");
        setSuccess("");

        try {
            await apiRequest(
                `/api/crop-growth/${crop._id}`,
                getToken,
                {
                    method: "PATCH",
                    body: { growthStage },
                }
            );

            setSuccess("Growth stage updated.");
            await loadCrops();
        } catch (err) {
            setError(
                err.message || "Unable to update growth stage."
            );
        }
    };

    const handleDelete = async (crop) => {
        const cropName = crop.cropName || "this crop";

        if (!window.confirm(`Delete ${cropName}?`)) {
            return;
        }

        setError("");
        setSuccess("");

        try {
            await apiRequest(
                `/api/crop-growth/${crop._id}`,
                getToken,
                { method: "DELETE" }
            );

            setCrops((previous) =>
                previous.filter((item) => item._id !== crop._id)
            );

            setSuccess("Crop deleted successfully.");
        } catch (err) {
            setError(
                err.message || "Unable to delete crop."
            );
        }
    };

    const getDate = (value) => {
        if (!value) return "Not provided";

        const date = new Date(value);

        return Number.isNaN(date.getTime())
            ? "Not provided"
            : date.toLocaleDateString();
    };

    const growingCount = crops.filter(
        (crop) =>
            crop.status !== "Harvested" &&
            crop.status !== "Failed" &&
            crop.growthStage !== "Harvested"
    ).length;

    const harvestedCount = crops.filter(
        (crop) =>
            crop.status === "Harvested" ||
            crop.growthStage === "Harvested"
    ).length;

    return (
        <main className="crop-growth">
            <header className="growth-header">
                <span className="growth-eyebrow">
                    AGRO-AI / FARM MANAGEMENT
                </span>

                <h1>Crop Growth Tracking</h1>

                <p>
                    Manage your crops, update their growth stages,
                    and open separate pages for analytics and
                    observation records.
                </p>
            </header>

            <section className="growth-stats">
                <article className="growth-stat-card">
                    <span>Total crops</span>
                    <strong>{crops.length}</strong>
                </article>

                <article className="growth-stat-card">
                    <span>Growing crops</span>
                    <strong>{growingCount}</strong>
                </article>

                <article className="growth-stat-card">
                    <span>Harvested</span>
                    <strong>{harvestedCount}</strong>
                </article>
            </section>

            {error && (
                <p
                    className="growth-message growth-error"
                    role="alert"
                >
                    {error}
                </p>
            )}

            {success && (
                <p
                    className="growth-message growth-success"
                    role="status"
                >
                    {success}
                </p>
            )}

            <div className="growth-layout">
                <section className="growth-panel">
                    <h2>Add a crop</h2>

                    <p className="growth-panel-description">
                        Enter the basic details of a crop on your farm.
                    </p>

                    <form
                        className="growth-form"
                        onSubmit={handleAddCrop}
                    >
                        <label>
                            Crop name
                            <input
                                type="text"
                                name="cropName"
                                value={form.cropName}
                                onChange={handleChange}
                                placeholder="e.g. Rice"
                                required
                            />
                        </label>

                        <label>
                            Crop variety
                            <input
                                type="text"
                                name="variety"
                                value={form.variety}
                                onChange={handleChange}
                                placeholder="e.g. BPT 5204"
                            />
                        </label>

                        <label>
                            Planting date
                            <input
                                type="date"
                                name="plantingDate"
                                value={form.plantingDate}
                                onChange={handleChange}
                                required
                            />
                        </label>

                        <label>
                            Growth stage
                            <select
                                name="growthStage"
                                value={form.growthStage}
                                onChange={handleChange}
                                required
                            >
                                <option value="Seedling">
                                    Seedling
                                </option>
                                <option value="Vegetative">
                                    Vegetative
                                </option>
                                <option value="Flowering">
                                    Flowering
                                </option>
                                <option value="Fruiting">
                                    Fruiting
                                </option>
                                <option value="Maturity">
                                    Maturity
                                </option>
                                <option value="Harvested">
                                    Harvested
                                </option>
                            </select>
                        </label>

                        <label>
                            Farm area
                            <input
                                type="number"
                                name="fieldSize"
                                min="0.01"
                                step="any"
                                value={form.fieldSize}
                                onChange={handleChange}
                                placeholder="e.g. 2.5"
                                required
                            />
                        </label>

                        <label>
                            Field size unit
                            <select
                                name="fieldSizeUnit"
                                value={form.fieldSizeUnit}
                                onChange={handleChange}
                                required
                            >
                                <option value="Acres">Acres</option>
                                <option value="Hectares">
                                    Hectares
                                </option>
                            </select>
                        </label>

                        <label>
                            Notes
                            <textarea
                                name="notes"
                                rows="3"
                                value={form.notes}
                                onChange={handleChange}
                                placeholder="Optional crop details"
                            />
                        </label>

                        <button type="submit" disabled={saving}>
                            {saving ? "Adding crop..." : "Add crop"}
                        </button>
                    </form>
                </section>

                <section className="growth-crop-list">
                    <div className="growth-list-heading">
                        <div>
                            <h2>Your crops</h2>

                            <p className="growth-panel-description">
                                Open a crop to view its records or analytics.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="growth-refresh-button"
                            onClick={loadCrops}
                            disabled={loading}
                        >
                            {loading ? "Loading..." : "Refresh"}
                        </button>
                    </div>

                    {loading ? (
                        <p className="growth-empty">
                            Loading crops...
                        </p>
                    ) : crops.length === 0 ? (
                        <p className="growth-empty">
                            No crops yet. Add your first crop using the form.
                        </p>
                    ) : (
                        <div className="growth-crop-grid">
                            {crops.map((crop) => (
                                <article
                                    className="growth-crop-card"
                                    key={crop._id}
                                >
                                    <div className="growth-crop-card-top">
                                        <div>
                                            <span className="growth-crop-label">
                                                {crop.variety || "Crop"}
                                            </span>

                                            <h3>{crop.cropName}</h3>
                                        </div>

                                        <span className="growth-stage-badge">
                                            {crop.growthStage || "Not set"}
                                        </span>
                                    </div>

                                    <div className="growth-crop-details">
                                        <p>
                                            <span>Planting date</span>
                                            <strong>
                                                {getDate(crop.plantingDate)}
                                            </strong>
                                        </p>

                                        <p>
                                            <span>Farm area</span>
                                            <strong>
                                                {crop.fieldSize != null
                                                    ? `${crop.fieldSize} ${
                                                          crop.fieldSizeUnit ||
                                                          "Acres"
                                                      }`
                                                    : "Not provided"}
                                            </strong>
                                        </p>

                                        {crop.estimatedHarvestDate && (
                                            <p>
                                                <span>Estimated harvest</span>
                                                <strong>
                                                    {getDate(
                                                        crop.estimatedHarvestDate
                                                    )}
                                                </strong>
                                            </p>
                                        )}
                                    </div>

                                    {crop.notes && (
                                        <p className="growth-crop-notes">
                                            {crop.notes}
                                        </p>
                                    )}

                                    <label className="growth-stage-control">
                                        Update growth stage

                                        <select
                                            value={
                                                crop.growthStage || "Seedling"
                                            }
                                            onChange={(event) =>
                                                handleStageChange(
                                                    crop,
                                                    event.target.value
                                                )
                                            }
                                        >
                                            <option value="Seedling">
                                                Seedling
                                            </option>
                                            <option value="Vegetative">
                                                Vegetative
                                            </option>
                                            <option value="Flowering">
                                                Flowering
                                            </option>
                                            <option value="Fruiting">
                                                Fruiting
                                            </option>
                                            <option value="Maturity">
                                                Maturity
                                            </option>
                                            <option value="Harvested">
                                                Harvested
                                            </option>
                                        </select>
                                    </label>

                                    <div className="growth-crop-actions">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                navigate(
                                                    `/crop-growth/${crop._id}/analytics`
                                                )
                                            }
                                        >
                                            Growth Analytics
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                navigate(
                                                    `/crop-growth/${crop._id}/observations`
                                                )
                                            }
                                        >
                                            Growth Observations
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        className="growth-delete-button"
                                        onClick={() => handleDelete(crop)}
                                    >
                                        Delete crop
                                    </button>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
};

export default CropGrowth;
