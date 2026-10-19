
import { useState } from "react";
import "./mandi.scss";

function ProfitCalculator() {
    const [form, setForm] = useState({
        cropName: "",
        quantity: "",
        sellingPrice: "",
        seedCost: "",
        fertilizerCost: "",
        laborCost: "",
        irrigationCost: "",
        transportCost: "",
        otherCost: "",
    });

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const quantity = Number(form.quantity) || 0;
    const sellingPrice = Number(form.sellingPrice) || 0;

    const expenses = [
        form.seedCost,
        form.fertilizerCost,
        form.laborCost,
        form.irrigationCost,
        form.transportCost,
        form.otherCost,
    ].reduce((total, value) => total + (Number(value) || 0), 0);

    // Quantity is entered in quintals.
    const revenue = quantity * sellingPrice;
    const profit = revenue - expenses;
    const profitMargin = revenue > 0
        ? (profit / revenue) * 100
        : 0;

    const formatCurrency = (value) =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2,
        }).format(value);

    const resetForm = () => {
        setForm({
            cropName: "",
            quantity: "",
            sellingPrice: "",
            seedCost: "",
            fertilizerCost: "",
            laborCost: "",
            irrigationCost: "",
            transportCost: "",
            otherCost: "",
        });
    };

    return (
        <section className="mandi-panel profit-calculator">
            <div className="profit-heading">
                <div>
                    <p className="mandi-eyebrow">FARM FINANCIAL TOOLS</p>
                    <h2>Crop Profit Calculator</h2>
                    <p>
                        Estimate your revenue and expenses before selling
                        your harvest.
                    </p>
                </div>

                <button
                    type="button"
                    className="mandi-secondary-button"
                    onClick={resetForm}
                >
                    Reset
                </button>
            </div>

            <form
                className="mandi-form"
                onSubmit={(event) => event.preventDefault()}
            >
                <label>
                    Crop name
                    <input
                        name="cropName"
                        value={form.cropName}
                        onChange={handleChange}
                        placeholder="e.g. Rice"
                    />
                </label>

                <label>
                    Harvest quantity (quintals)
                    <input
                        type="number"
                        name="quantity"
                        value={form.quantity}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        placeholder="e.g. 25"
                    />
                </label>

                <label>
                    Selling price (₹ per quintal)
                    <input
                        type="number"
                        name="sellingPrice"
                        value={form.sellingPrice}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        placeholder="e.g. 2200"
                    />
                </label>
            </form>

            <h3 className="profit-section-title">Cultivation and selling costs</h3>

            <div className="mandi-form">
                {[
                    ["seedCost", "Seeds cost (₹)"],
                    ["fertilizerCost", "Fertilizers and pesticides (₹)"],
                    ["laborCost", "Labor cost (₹)"],
                    ["irrigationCost", "Irrigation cost (₹)"],
                    ["transportCost", "Transport and market charges (₹)"],
                    ["otherCost", "Other expenses (₹)"],
                ].map(([name, label]) => (
                    <label key={name}>
                        {label}
                        <input
                            type="number"
                            name={name}
                            value={form[name]}
                            onChange={handleChange}
                            min="0"
                            step="0.01"
                            placeholder="0"
                        />
                    </label>
                ))}
            </div>

            <div className="profit-results">
                <article className="profit-result-card">
                    <span>Estimated revenue</span>
                    <strong>{formatCurrency(revenue)}</strong>
                    <small>
                        {quantity} quintals × {formatCurrency(sellingPrice)}
                    </small>
                </article>

                <article className="profit-result-card">
                    <span>Total expenses</span>
                    <strong>{formatCurrency(expenses)}</strong>
                </article>

                <article
                    className={`profit-result-card ${
                        profit >= 0 ? "is-profit" : "is-loss"
                    }`}
                >
                    <span>{profit >= 0 ? "Estimated net profit" : "Estimated net loss"}</span>
                    <strong>{formatCurrency(Math.abs(profit))}</strong>
                    <small>
                        {revenue > 0
                            ? `Profit margin: ${profitMargin.toFixed(2)}%`
                            : "Enter a selling quantity and price"}
                    </small>
                </article>
            </div>

            <p className="profit-disclaimer">
                This is an estimate based on the values you enter. Include
                all relevant expenses for a more realistic result.
            </p>
        </section>
    );
}

export default ProfitCalculator;
