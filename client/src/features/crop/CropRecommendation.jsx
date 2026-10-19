import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import apiRequest from "../../api/api";
import "./crop-recommendation.scss";

function CropRecommendation() {
    const { getToken } = useAuth();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState(null);

    const handleRecommend = async () => {
        setLoading(true);
        setError("");
        setResult(null);

        try {
            const data = await apiRequest(
                "/api/crop/recommend",
                getToken,
                {
                    method: "POST",
                    body: JSON.stringify({})
                }
            );

            setResult(data);
        } catch (err) {
            setError(err.message || "Unable to generate recommendations.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="page-container crop-page">
            <div className="page-heading">
                <p className="eyebrow">SMART FARMING</p>
                <h1>Crop Recommendation</h1>
                <p>
                    Discover crop options based on your farm profile
                    and local weather conditions.
                </p>
            </div>

            <div className="content-card crop-intro">
                <div className="crop-intro-icon">🌱</div>
                <div>
                    <h2>Find suitable crops for your farm</h2>
                    <p>
                        AGRO-AI uses your saved farmer profile, weather
                        forecast, and AI to suggest potential crops.
                    </p>
                    <button
                        className="button button-primary"
                        onClick={handleRecommend}
                        disabled={loading}
                    >
                        {loading ? "Generating recommendations..." : "Get Crop Recommendations"}
                    </button>
                </div>
            </div>

            {error && (
                <div className="alert alert-error" role="alert">
                    {error}
                </div>
            )}

            {loading && (
                <div className="content-card crop-loading" role="status">
                    <div className="loading-spinner" />
                    <p>Checking farm conditions and generating recommendations...</p>
                    <small>This may take a few seconds.</small>
                </div>
            )}

            {result && (
                <>
                    <div className="content-card crop-summary">
                        <p className="eyebrow">YOUR FARM</p>
                        <h2>
                            {result.farm.location}, {result.farm.district}
                        </h2>
                        <div className="farm-detail-chips">
                            <span>Soil: {result.farm.soilType}</span>
                            <span>Irrigation: {result.farm.irrigationMethod}</span>
                            <span>Size: {result.farm.farmSize} acres</span>
                        </div>
                        <p>{result.recommendation.season}</p>
                        <p>{result.recommendation.summary}</p>
                    </div>

                    {result.weather?.current && (
                        <div className="content-card crop-weather">
                            <h2>Current Weather</h2>
                            <div className="weather-details">
                                <div>
                                    <span>Temperature</span>
                                    <strong>
                                        {result.weather.current.temperature_2m ?? "—"}
                                        {result.weather.current_units?.temperature_2m || "°C"}
                                    </strong>
                                </div>
                                <div>
                                    <span>Humidity</span>
                                    <strong>
                                        {result.weather.current.relative_humidity_2m ?? "—"}%
                                    </strong>
                                </div>
                                <div>
                                    <span>Precipitation</span>
                                    <strong>
                                        {result.weather.current.precipitation ?? "—"} mm
                                    </strong>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="section-heading">
                        <div>
                            <h2>Recommended Crops</h2>
                            <p>Review these options before making planting decisions.</p>
                        </div>
                    </div>

                    <div className="crop-recommendation-grid">
                        {result.recommendation.recommendations.map((crop, index) => (
                            <article className="content-card crop-result-card" key={`${crop.crop}-${index}`}>
                                <div className="crop-result-top">
                                    <span className="crop-number">Option {index + 1}</span>
                                    <span className={`suitability suitability-${String(crop.suitability || "moderate").toLowerCase()}`}>
                                        {crop.suitability || "Review"}
                                    </span>
                                </div>

                                <h3>🌾 {crop.crop}</h3>
                                <p>{crop.reason}</p>

                                <div className="crop-result-detail">
                                    <span>💧 Water needs</span>
                                    <p>{crop.waterNeeds}</p>
                                </div>

                                <div className="crop-result-detail">
                                    <span>🗓️ Growing period</span>
                                    <p>{crop.growingPeriod}</p>
                                </div>

                                {Array.isArray(crop.precautions) && crop.precautions.length > 0 && (
                                    <div className="crop-result-detail">
                                        <span>⚠️ Precautions</span>
                                        <ul>
                                            {crop.precautions.map((item, itemIndex) => (
                                                <li key={itemIndex}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </article>
                        ))}
                    </div>

                    {Array.isArray(result.recommendation.additionalAdvice) &&
                        result.recommendation.additionalAdvice.length > 0 && (
                            <div className="content-card crop-advice">
                                <h2>Additional Farming Advice</h2>
                                <ul>
                                    {result.recommendation.additionalAdvice.map((item, index) => (
                                        <li key={index}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                    {Array.isArray(result.recommendation.limitations) &&
                        result.recommendation.limitations.length > 0 && (
                            <div className="content-card crop-limitations">
                                <h2>Important Notes</h2>
                                <ul>
                                    {result.recommendation.limitations.map((item, index) => (
                                        <li key={index}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                    <p className="crop-disclaimer">
                        These are preliminary AI-generated suggestions, not a guarantee
                        of yield or profit. Consider local growing seasons, soil testing,
                        and advice from an agricultural extension officer before planting.
                    </p>

                    <button
                        className="button button-outline"
                        onClick={handleRecommend}
                        disabled={loading}
                    >
                        Generate Again
                    </button>
                </>
            )}
        </section>
    );
}

export default CropRecommendation;