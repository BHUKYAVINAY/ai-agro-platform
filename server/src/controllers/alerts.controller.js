
const Farmer = require("../models/farmer.model");

const getWeatherAlerts = async (req, res) => {
    try {
        const farmer = await Farmer.findOne({
            clerkUserId: req.userId
        });

        if (!farmer) {
            return res.status(404).json({
                success: false,
                message: "Please complete your farmer profile first."
            });
        }

        const locationQuery = [
            farmer.location,
            farmer.district,
            farmer.state,
            "India"
        ]
            .filter(Boolean)
            .join(", ");

        if (!farmer.location && !farmer.district) {
            return res.status(400).json({
                success: false,
                message: "Add your farm location to your profile first."
            });
        }

        // Find farm coordinates
        const geoUrl = new URL(
            "https://geocoding-api.open-meteo.com/v1/search"
        );

        geoUrl.searchParams.set("name", locationQuery);
        geoUrl.searchParams.set("count", "10");
        geoUrl.searchParams.set("language", "en");
        geoUrl.searchParams.set("format", "json");
        geoUrl.searchParams.set("countryCode", "IN");

        const geoResponse = await fetch(geoUrl);

        if (!geoResponse.ok) {
            throw new Error("Location service is unavailable.");
        }

        let places = (await geoResponse.json()).results || [];

        // Fall back to the district if the full location isn't found
        if (places.length === 0 && farmer.district) {
            const fallbackUrl = new URL(
                "https://geocoding-api.open-meteo.com/v1/search"
            );

            fallbackUrl.searchParams.set(
                "name",
                `${farmer.district}, ${farmer.state || "Telangana"}`
            );
            fallbackUrl.searchParams.set("count", "10");
            fallbackUrl.searchParams.set("countryCode", "IN");

            const fallbackResponse = await fetch(fallbackUrl);

            if (fallbackResponse.ok) {
                places = (await fallbackResponse.json()).results || [];
            }
        }

        if (places.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Farm location not found. Check your farmer profile."
            });
        }

        const stateName = (farmer.state || "").toLowerCase();

        const place =
            places.find(
                (item) => item.admin1?.toLowerCase() === stateName
            ) || places[0];

        // Get the current conditions and next 7 days of forecast
        const weatherUrl = new URL(
            "https://api.open-meteo.com/v1/forecast"
        );

        weatherUrl.searchParams.set("latitude", String(place.latitude));
        weatherUrl.searchParams.set("longitude", String(place.longitude));
        weatherUrl.searchParams.set(
            "current",
            "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m"
        );
        weatherUrl.searchParams.set(
            "hourly",
            "precipitation_probability,precipitation,wind_speed_10m"
        );
        weatherUrl.searchParams.set(
            "daily",
            "precipitation_sum,precipitation_probability_max,wind_speed_10m_max,temperature_2m_max"
        );
        weatherUrl.searchParams.set("forecast_days", "7");
        weatherUrl.searchParams.set("timezone", "auto");

        const weatherResponse = await fetch(weatherUrl);

        if (!weatherResponse.ok) {
            throw new Error("Weather service is unavailable.");
        }

        const weather = await weatherResponse.json();

        const alerts = [];
        const current = weather.current;
        const daily = weather.daily;

        // Heavy rainfall warning
        if (current.precipitation >= 10) {
            alerts.push({
                type: "warning",
                title: "Heavy precipitation now",
                message:
                    "Check field drainage and avoid unnecessary irrigation while heavy precipitation continues."
            });
        }

        // Hot weather warning
        if (current.temperature_2m >= 35) {
            alerts.push({
                type: "warning",
                title: "High temperature",
                message:
                    "Check soil moisture and crop stress. Irrigate according to crop needs and local conditions."
            });
        }

        // Strong wind warning
        if (current.wind_speed_10m >= 30) {
            alerts.push({
                type: "warning",
                title: "Strong winds",
                message:
                    "Avoid spraying in strong winds because spray drift may affect people, nearby crops, and the environment."
            });
        }

        // High humidity advisory
        if (current.relative_humidity_2m >= 85) {
            alerts.push({
                type: "info",
                title: "High humidity",
                message:
                    "Inspect crops for signs of fungal disease. Humidity alone does not confirm a disease."
            });
        }

        // Forecast-based alerts
        daily.time.forEach((date, index) => {
            const rainProbability =
                daily.precipitation_probability_max?.[index] ?? 0;
            const rainAmount = daily.precipitation_sum?.[index] ?? 0;
            const maxWind = daily.wind_speed_10m_max?.[index] ?? 0;
            const maxTemp = daily.temperature_2m_max?.[index] ?? 0;

            if (rainProbability >= 70 || rainAmount >= 20) {
                alerts.push({
                    type: "warning",
                    title: "Rain expected",
                    date,
                    message:
                        `Forecast rainfall is ${rainAmount} mm with a maximum precipitation probability of ${rainProbability}%. Check drainage and postpone irrigation if appropriate.`
                });
            }

            if (maxWind >= 30) {
                alerts.push({
                    type: "info",
                    title: "Windy conditions forecast",
                    date,
                    message:
                        "Avoid spraying during strong winds. Check local wind conditions before field work."
                });
            }

            if (maxTemp >= 38) {
                alerts.push({
                    type: "warning",
                    title: "Very hot day forecast",
                    date,
                    message:
                        "Monitor crop stress and soil moisture. Follow crop-specific irrigation guidance."
                });
            }
        });

        if (alerts.length === 0) {
            alerts.push({
                type: "success",
                title: "No major weather alerts",
                message:
                    "No conditions crossed the alert thresholds in the available forecast. Continue monitoring local weather."
            });
        }

        return res.status(200).json({
            success: true,
            location: {
                name: place.name,
                district: farmer.district,
                state: farmer.state
            },
            generatedAt: new Date().toISOString(),
            alerts
        });
    } catch (error) {
        console.error("Weather alerts error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to generate weather alerts right now."
        });
    }
};

module.exports = { getWeatherAlerts };
