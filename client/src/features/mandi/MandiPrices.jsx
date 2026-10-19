
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import apiRequest from "../../api/api";
import "./mandi.scss";
import ProfitCalculator from "./ProfitCalculator";

const initialForm = {
    cropName: "",
    marketName: "",
    district: "",
    state: "",
    minPrice: "",
    maxPrice: "",
    modalPrice: "",
    priceDate: new Date().toISOString().slice(0, 10),
};

function MandiPrices() {
    const { getToken } = useAuth();

    const [form, setForm] = useState(initialForm);
    const [prices, setPrices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const loadPrices = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const data = await apiRequest(
                "/api/mandi-prices",
                getToken
            );

            setPrices(data.mandiPrices || []);
        } catch (err) {
            setError(err.message || "Could not load mandi prices.");
        } finally {
            setLoading(false);
        }
    }, [getToken]);

    useEffect(() => {
        loadPrices();
    }, [loadPrices]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setMessage("");

        const min = Number(form.minPrice);
        const max = Number(form.maxPrice);
        const modal = Number(form.modalPrice);

        if (
            form.minPrice === "" ||
            form.maxPrice === "" ||
            form.modalPrice === "" ||
            min < 0 ||
            max < min ||
            modal < min ||
            modal > max
        ) {
            setError(
                "Prices must satisfy minimum ≤ modal ≤ maximum."
            );
            return;
        }

        setSaving(true);

        try {
            const data = await apiRequest(
                "/api/mandi-prices",
                getToken,
                {
                    method: "POST",
                    body: JSON.stringify(form),
                }
            );

            setMessage(data.message || "Price saved successfully.");
            setForm(initialForm);
            await loadPrices();
        } catch (err) {
            setError(err.message || "Could not save the price.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this price record?"
        );

        if (!confirmed) return;

        setError("");
        setMessage("");

        try {
            const data = await apiRequest(
                `/api/mandi-prices/${id}`,
                getToken,
                { method: "DELETE" }
            );

            setPrices((previous) =>
                previous.filter((item) => item._id !== id)
            );

            setMessage(data.message || "Price deleted successfully.");
        } catch (err) {
            setError(err.message || "Could not delete the price.");
        }
    };

    const formatPrice = (price) =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2,
        }).format(price);

    return (
        <main className="mandi-page">
            <header className="mandi-header">
                <div>
                    <p className="mandi-eyebrow">AGRO-AI MARKET TOOLS</p>
                    <h1>Mandi Prices</h1>
                    <p>
                        Save and manage market prices provided by you.
                        Prices are recorded per quintal.
                    </p>
                </div>
            </header>

            {error && (
                <div className="mandi-message mandi-error" role="alert">
                    {error}
                </div>
            )}

            {message && (
                <div className="mandi-message mandi-success" role="status">
                    {message}
                </div>
            )}

            <section className="mandi-panel">
                <h2>Add a Mandi Price</h2>

                <form onSubmit={handleSubmit} className="mandi-form">
                    <label>
                        Crop name
                        <input
                            name="cropName"
                            value={form.cropName}
                            onChange={handleChange}
                            placeholder="e.g. Rice"
                            required
                        />
                    </label>

                    <label>
                        Mandi name
                        <input
                            name="marketName"
                            value={form.marketName}
                            onChange={handleChange}
                            placeholder="e.g. Warangal Market"
                            required
                        />
                    </label>

                    <label>
                        District
                        <input
                            name="district"
                            value={form.district}
                            onChange={handleChange}
                            placeholder="e.g. Warangal"
                            required
                        />
                    </label>

                    <label>
                        State
                        <input
                            name="state"
                            value={form.state}
                            onChange={handleChange}
                            placeholder="e.g. Telangana"
                            required
                        />
                    </label>

                    <label>
                        Minimum price (₹/quintal)
                        <input
                            type="number"
                            name="minPrice"
                            value={form.minPrice}
                            onChange={handleChange}
                            min="0"
                            step="0.01"
                            required
                        />
                    </label>

                    <label>
                        Maximum price (₹/quintal)
                        <input
                            type="number"
                            name="maxPrice"
                            value={form.maxPrice}
                            onChange={handleChange}
                            min="0"
                            step="0.01"
                            required
                        />
                    </label>

                    <label>
                        Modal price (₹/quintal)
                        <input
                            type="number"
                            name="modalPrice"
                            value={form.modalPrice}
                            onChange={handleChange}
                            min="0"
                            step="0.01"
                            required
                        />
                    </label>

                    <label>
                        Price date
                        <input
                            type="date"
                            name="priceDate"
                            value={form.priceDate}
                            onChange={handleChange}
                            required
                        />
                    </label>

                    <button
                        className="mandi-primary-button"
                        type="submit"
                        disabled={saving}
                    >
                        {saving ? "Saving..." : "Save Mandi Price"}
                    </button>
                </form>
            </section>

            <section className="mandi-panel">
                <div className="mandi-list-heading">
                    <h2>Saved Prices</h2>
                    <button
                        type="button"
                        className="mandi-secondary-button"
                        onClick={loadPrices}
                        disabled={loading}
                    >
                        Refresh
                    </button>
                </div>

                {loading ? (
                    <p>Loading mandi prices...</p>
                ) : prices.length === 0 ? (
                    <p className="mandi-empty">
                        No saved prices yet. Add your first record above.
                    </p>
                ) : (
                    <div className="mandi-table-wrapper">
                        <table className="mandi-table">
                            <thead>
                                <tr>
                                    <th>Crop / Market</th>
                                    <th>Date</th>
                                    <th>Min</th>
                                    <th>Modal</th>
                                    <th>Max</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {prices.map((item) => (
                                    <tr key={item._id}>
                                        <td>
                                            <strong>{item.cropName}</strong>
                                            <small>
                                                {item.marketName},{" "}
                                                {item.district}
                                            </small>
                                        </td>

                                        <td>
                                            {new Date(
                                                item.priceDate
                                            ).toLocaleDateString("en-IN")}
                                        </td>

                                        <td>{formatPrice(item.minPrice)}</td>
                                        <td>{formatPrice(item.modalPrice)}</td>
                                        <td>{formatPrice(item.maxPrice)}</td>

                                        <td>
                                            <button
                                                type="button"
                                                className="mandi-delete-button"
                                                onClick={() =>
                                                    handleDelete(item._id)
                                                }
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
            
            <ProfitCalculator />
        </main>
    );
}

export default MandiPrices;
