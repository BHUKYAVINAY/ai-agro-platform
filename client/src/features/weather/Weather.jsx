
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { apiRequest } from "../../api/api";
import "./weather.scss";

const weatherDescriptions = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Rime fog",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Heavy drizzle",
    61: "Light rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Light snowfall",
    73: "Snowfall",
    75: "Heavy snowfall",
    80: "Rain showers",
    81: "Moderate rain showers",
    82: "Heavy rain showers",
    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Heavy thunderstorm"
};

const getWeatherDescription = (code) =>
    weatherDescriptions[code] || "Weather conditions unavailable";

const getWeatherIcon = (code) => {
    if (code === 0 || code === 1) return "☀️";
    if (code === 2 || code === 3) return "⛅";
    if ([45, 48].includes(code)) return "🌫️";
    if (code >= 51 && code <= 67) return "🌧️";
    if (code >= 71 && code <= 77) return "❄️";
    if (code >= 80 && code <= 82) return "🌦️";
    if (code >= 95) return "⛈️";
    return "🌤️";
};

const Weather = () => {
    const { getToken } = useAuth();

    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadWeather = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const result = await apiRequest("/api/weather", getToken);

            setWeather(result);
        } catch (err) {
            setError(err.message || "Unable to load weather.");
        } finally {
            setLoading(false);
        }
    }, [getToken]);

    useEffect(() => {
        loadWeather();
    }, [loadWeather]);

    if (loading) {
        return (
            <main className="weather-page">
                <div className="weather-status">Loading weather forecast...</div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="weather-page">
                <div className="weather-error">
                    <h2>Unable to load weather</h2>
                    <p>{error}</p>
                    <button onClick={loadWeather}>Try again</button>
                </div>
            </main>
        );
    }

    if (!weather?.current || !weather?.daily) {
        return (
            <main className="weather-page">
                <div className="weather-error">
                    Weather data is incomplete. Please try again.
                    <button onClick={loadWeather}>Refresh</button>
                </div>
            </main>
        );
    }

    const current = weather.current;
    const daily = weather.daily;
    const currentUnits = weather.currentUnits || {};
    const dailyUnits = weather.dailyUnits || {};

    const formatDate = (date) =>
        new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short"
        });

    return (
        <main className="weather-page">
            <header className="weather-header">
                <div>
                    <p className="weather-eyebrow">AGRO-AI FARM TOOLS</p>
                    <h1>Weather Forecast</h1>
                    <p className="weather-location">
                        📍 {weather.location?.name}
                        {weather.location?.district
                            ? `, ${weather.location.district}`
                            : ""}
                        {weather.location?.state
                            ? `, ${weather.location.state}`
                            : ""}
                    </p>
                </div>

                <button
                    className="weather-refresh"
                    onClick={loadWeather}
                >
                    ↻ Refresh
                </button>
            </header>

            <section className="current-weather">
                <div className="current-weather-main">
                    <span className="current-weather-icon">
                        {getWeatherIcon(current.weather_code)}
                    </span>

                    <div>
                        <p>Current temperature</p>
                        <h2>
                            {current.temperature_2m}
                            {currentUnits.temperature_2m || "°C"}
                        </h2>
                        <span>
                            {getWeatherDescription(current.weather_code)}
                        </span>
                    </div>
                </div>

                <div className="current-weather-details">
                    <div className="weather-detail">
                        <span>Feels like</span>
                        <strong>
                            {current.apparent_temperature}
                            {currentUnits.apparent_temperature || "°C"}
                        </strong>
                    </div>

                    <div className="weather-detail">
                        <span>Humidity</span>
                        <strong>
                            {current.relative_humidity_2m}
                            {currentUnits.relative_humidity_2m || "%"}
                        </strong>
                    </div>

                    <div className="weather-detail">
                        <span>Rainfall</span>
                        <strong>
                            {current.precipitation}
                            {currentUnits.precipitation || " mm"}
                        </strong>
                    </div>

                    <div className="weather-detail">
                        <span>Wind speed</span>
                        <strong>
                            {current.wind_speed_10m}
                            {currentUnits.wind_speed_10m || " km/h"}
                        </strong>
                    </div>
                </div>
            </section>

            <section className="forecast-section">
                <div className="section-heading">
                    <div>
                        <h2>7-Day Forecast</h2>
                        <p>Plan your farm activities according to the weather.</p>
                    </div>
                </div>

                <div className="forecast-grid">
                    {daily.time?.map((date, index) => {
                        const code = daily.weather_code[index];

                        return (
                            <article className="forecast-card" key={date}>
                                <p className="forecast-date">
                                    {formatDate(date)}
                                </p>

                                <span className="forecast-icon">
                                    {getWeatherIcon(code)}
                                </span>

                                <p className="forecast-description">
                                    {getWeatherDescription(code)}
                                </p>

                                <div className="forecast-temperatures">
                                    <strong>
                                        {daily.temperature_2m_max[index]}°
                                    </strong>
                                    <span>
                                        {daily.temperature_2m_min[index]}°
                                    </span>
                                </div>

                                <p className="forecast-rain">
                                    🌧️{" "}
                                    {daily.precipitation_sum?.[index] ?? 0}
                                    {dailyUnits.precipitation_sum || " mm"}
                                </p>

                                {daily.precipitation_probability_max && (
                                    <p className="forecast-probability">
                                        Rain chance:{" "}
                                        {daily.precipitation_probability_max[index]}
                                        %
                                    </p>
                                )}
                            </article>
                        );
                    })}
                </div>
            </section>

            <section className="weather-note">
                <h3>🌱 Farming reminder</h3>
                <p>
                    Check rainfall forecasts before irrigation or spraying.
                    Weather forecasts are estimates, so confirm local
                    conditions before making important farm decisions.
                </p>
            </section>
        </main>
    );
};

export default Weather;
