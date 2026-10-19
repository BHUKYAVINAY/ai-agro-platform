
const Farmer = require("../models/farmer.model");

const getWeather = async (req, res) => {
    try {
        // 1. Find the logged-in farmer's profile
        const farmer = await Farmer.findOne({
            clerkUserId: req.userId
        });

        if (!farmer) {
            return res.status(404).json({
                success: false,
                message: "Please complete your farmer profile first."
            });
        }

        // 2. Check the saved location
        const location = [
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

        // 3. Convert the location into coordinates
        const geoUrl = new URL(
            "https://geocoding-api.open-meteo.com/v1/search"
        );

        geoUrl.searchParams.set("name", location);
        geoUrl.searchParams.set("count", "10");
        geoUrl.searchParams.set("language", "en");
        geoUrl.searchParams.set("format", "json");
        geoUrl.searchParams.set("countryCode", "IN");

        const geoResponse = await fetch(geoUrl);

        if (!geoResponse.ok) {
            throw new Error("Unable to contact the location service.");
        }

        const geoData = await geoResponse.json();

        // If the full address doesn't work, try district and state
        let places = geoData.results || [];

        if (places.length === 0 && farmer.district) {
            const fallbackUrl = new URL(
                "https://geocoding-api.open-meteo.com/v1/search"
            );

            fallbackUrl.searchParams.set(
                "name",
                `${farmer.district}, ${farmer.state || "Telangana"}`
            );
            fallbackUrl.searchParams.set("count", "10");
            fallbackUrl.searchParams.set("language", "en");
            fallbackUrl.searchParams.set("format", "json");
            fallbackUrl.searchParams.set("countryCode", "IN");

            const fallbackResponse = await fetch(fallbackUrl);

            if (fallbackResponse.ok) {
                const fallbackData = await fallbackResponse.json();
                places = fallbackData.results || [];
            }
        }

        if (places.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Farm location not found. Check your farmer profile."
            });
        }

        // Prefer a result matching the saved state
        const stateName = (farmer.state || "").toLowerCase();

        const place =
            places.find(
                (item) =>
                    item.admin1?.toLowerCase() === stateName
            ) || places[0];

        // 4. Fetch current weather and the next 7 days
        const weatherUrl = new URL(
            "https://api.open-meteo.com/v1/forecast"
        );

        weatherUrl.searchParams.set(
            "latitude",
            String(place.latitude)
        );
        weatherUrl.searchParams.set(
            "longitude",
            String(place.longitude)
        );
        weatherUrl.searchParams.set(
            "current",
            "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m"
        );
        weatherUrl.searchParams.set(
            "daily",
            "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max"
        );
        weatherUrl.searchParams.set("timezone", "auto");
        weatherUrl.searchParams.set("forecast_days", "7");

        const weatherResponse = await fetch(weatherUrl);

        if (!weatherResponse.ok) {
            throw new Error("Unable to fetch the weather forecast.");
        }

        const weatherData = await weatherResponse.json();

        // 5. Send the response to the frontend
        return res.status(200).json({
            success: true,
            location: {
                name: place.name,
                district: farmer.district,
                state: farmer.state,
                latitude: place.latitude,
                longitude: place.longitude
            },
            current: weatherData.current,
            currentUnits: weatherData.current_units,
            daily: weatherData.daily,
            dailyUnits: weatherData.daily_units
        });
    } catch (error) {
        console.error("Weather controller error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to get the weather forecast right now."
        });
    }
};

module.exports = { getWeather };
