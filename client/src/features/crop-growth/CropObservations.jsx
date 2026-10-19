
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import apiRequest from "../../api/api";
import "./crop-observations.scss";

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
];

const CropObservations = ({ crop }) => {
    const { getToken } = useAuth();
    const fileInputRef = useRef(null);

    const [observations, setObservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState("");

    const [form, setForm] = useState({
        observedAt: new Date().toISOString().slice(0, 10),
        plantHeightCm: "",
        leafCondition: "Healthy",
        notes: "",
    });

    const cropId = crop?._id;
    const cropName = crop?.cropName || "Selected crop";

    const loadObservations = useCallback(async () => {
        if (!cropId) return;

        setLoading(true);
        setError("");

        try {
            const data = await apiRequest(
                `/api/crop-observations/${cropId}`,
                getToken
            );

            setObservations(data.observations || []);
        } catch (err) {
            setError(
                err.message || "Unable to load observations."
            );
        } finally {
            setLoading(false);
        }
    }, [cropId, getToken]);

    useEffect(() => {
        loadObservations();
    }, [loadObservations]);

    useEffect(() => {
        if (!photo) {
            setPhotoPreview("");
            return undefined;
        }

        const previewUrl = URL.createObjectURL(photo);
        setPhotoPreview(previewUrl);

        return () => URL.revokeObjectURL(previewUrl);
    }, [photo]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handlePhotoChange = (event) => {
        const file = event.target.files?.[0];

        setError("");
        setSuccess("");

        if (!file) {
            setPhoto(null);
            return;
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            setError("Choose a JPG, PNG, or WEBP image.");
            event.target.value = "";
            setPhoto(null);
            return;
        }

        if (file.size > MAX_PHOTO_SIZE) {
            setError("The photo must be 5 MB or smaller.");
            event.target.value = "";
            setPhoto(null);
            return;
        }

        setPhoto(file);
    };

    const resetForm = () => {
        setForm({
            observedAt: new Date().toISOString().slice(0, 10),
            plantHeightCm: "",
            leafCondition: "Healthy",
            notes: "",
        });

        setPhoto(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!cropId) {
            setError("Crop information is missing.");
            return;
        }

        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const formData = new FormData();

            formData.append("observedAt", form.observedAt);

            if (form.plantHeightCm !== "") {
                formData.append(
                    "plantHeightCm",
                    String(Number(form.plantHeightCm))
                );
            }

            formData.append("leafCondition", form.leafCondition);
            formData.append("notes", form.notes);

            if (photo) {
                formData.append("photo", photo);
            }

            await apiRequest(
                `/api/crop-observations/${cropId}`,
                getToken,
                {
                    method: "POST",
                    body: formData,
                }
            );

            resetForm();
            setSuccess("Observation saved successfully.");

            await loadObservations();
        } catch (err) {
            setError(
                err.message || "Unable to save observation."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (observation) => {
        if (!window.confirm("Delete this observation?")) {
            return;
        }

        setDeletingId(observation._id);
        setError("");
        setSuccess("");

        try {
            await apiRequest(
                `/api/crop-observations/${cropId}/${observation._id}`,
                getToken,
                { method: "DELETE" }
            );

            setObservations((previous) =>
                previous.filter(
                    (item) => item._id !== observation._id
                )
            );

            setSuccess("Observation deleted.");
        } catch (err) {
            setError(
                err.message || "Unable to delete observation."
            );
        } finally {
            setDeletingId("");
        }
    };

    return (
        <section className="crop-observations">
            <div className="observations-intro">
                <span className="observations-eyebrow">
                    CROP RECORDS
                </span>

                <h2>{cropName}: observations</h2>

                <p>
                    Record plant height, leaf condition, notes, and
                    an optional photo to track changes over time.
                </p>
            </div>

            {error && (
                <p
                    className="observations-message observations-error"
                    role="alert"
                >
                    {error}
                </p>
            )}

            {success && (
                <p
                    className="observations-message observations-success"
                    role="status"
                >
                    {success}
                </p>
            )}

            <div className="observations-layout">
                <section className="observations-panel">
                    <h3>Add observation</h3>

                    <form
                        className="observations-form"
                        onSubmit={handleSubmit}
                    >
                        <label>
                            Observation date
                            <input
                                type="date"
                                name="observedAt"
                                value={form.observedAt}
                                onChange={handleChange}
                                required
                            />
                        </label>

                        <label>
                            Plant height (cm)
                            <input
                                type="number"
                                name="plantHeightCm"
                                min="0"
                                step="0.1"
                                value={form.plantHeightCm}
                                onChange={handleChange}
                                placeholder="e.g. 24.5"
                            />
                        </label>

                        <label>
                            Leaf condition
                            <select
                                name="leafCondition"
                                value={form.leafCondition}
                                onChange={handleChange}
                            >
                                <option value="Healthy">Healthy</option>
                                <option value="Yellowing">Yellowing</option>
                                <option value="Spotted">Spotted</option>
                                <option value="Wilting">Wilting</option>
                                <option value="Damaged">Damaged</option>
                                <option value="Other">Other</option>
                            </select>
                        </label>

                        <label>
                            Notes
                            <textarea
                                name="notes"
                                rows="4"
                                value={form.notes}
                                onChange={handleChange}
                                placeholder="Describe what you observed..."
                            />
                        </label>

                        <label>
                            Crop photo (optional)
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handlePhotoChange}
                            />

                            <span className="observations-help">
                                JPG, PNG, or WEBP. Maximum size: 5 MB.
                            </span>
                        </label>

                        {photoPreview && (
                            <div className="observation-photo-preview">
                                <img
                                    src={photoPreview}
                                    alt="Selected crop preview"
                                />

                                <button
                                    type="button"
                                    onClick={() => {
                                        setPhoto(null);

                                        if (fileInputRef.current) {
                                            fileInputRef.current.value = "";
                                        }
                                    }}
                                >
                                    Remove photo
                                </button>
                            </div>
                        )}

                        <button type="submit" disabled={saving}>
                            {saving ? "Saving..." : "Save observation"}
                        </button>
                    </form>
                </section>

                <section className="observations-panel">
                    <div className="observations-history-heading">
                        <div>
                            <h3>Observation history</h3>
                            <p>{observations.length} saved record(s)</p>
                        </div>

                        <button
                            type="button"
                            className="observations-refresh"
                            onClick={loadObservations}
                            disabled={loading}
                        >
                            Refresh
                        </button>
                    </div>

                    {loading ? (
                        <p className="observations-empty">
                            Loading observations...
                        </p>
                    ) : observations.length === 0 ? (
                        <p className="observations-empty">
                            No observations yet. Add your first record.
                        </p>
                    ) : (
                        <div className="observations-list">
                            {[...observations]
                                .sort(
                                    (a, b) =>
                                        new Date(
                                            b.observedAt || b.createdAt
                                        ) -
                                        new Date(
                                            a.observedAt || a.createdAt
                                        )
                                )
                                .map((item) => (
                                    <article
                                        className="observation-card"
                                        key={item._id}
                                    >
                                        <div className="observation-card-heading">
                                            <div>
                                                <span className="observation-date">
                                                    {item.observedAt
                                                        ? new Date(
                                                              item.observedAt
                                                          ).toLocaleDateString()
                                                        : "Date not provided"}
                                                </span>

                                                <h4>
                                                    {item.plantHeightCm != null
                                                        ? `${item.plantHeightCm} cm`
                                                        : "Height not recorded"}
                                                </h4>
                                            </div>

                                            <span className="observation-condition">
                                                {item.leafCondition ||
                                                    "Not specified"}
                                            </span>
                                        </div>

                                        {item.photoUrl && (
                                            <a
                                                className="observation-photo-link"
                                                href={item.photoUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                <img
                                                    src={item.photoUrl}
                                                    alt="Crop observation"
                                                    loading="lazy"
                                                />

                                                <span>Open photo</span>
                                            </a>
                                        )}

                                        {item.notes && (
                                            <p className="observation-notes">
                                                {item.notes}
                                            </p>
                                        )}

                                        <button
                                            type="button"
                                            className="observation-delete"
                                            disabled={
                                                deletingId === item._id
                                            }
                                            onClick={() =>
                                                handleDelete(item)
                                            }
                                        >
                                            {deletingId === item._id
                                                ? "Deleting..."
                                                : "Delete observation"}
                                        </button>
                                    </article>
                                ))}
                        </div>
                    )}
                </section>
            </div>
        </section>
    );
};

export default CropObservations;
