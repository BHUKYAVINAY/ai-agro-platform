
const Groq = require("groq-sdk");
const Farmer = require("../models/farmer.model");

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// Find the farm's approximate coordinates and retrieve its weather.
async function getFarmWeather(farmer) {
    const state = String(farmer.state || "").trim();

    // Try the village/town first, then the district.
    const searchTerms = [
        farmer.location,
        farmer.district,
        `${farmer.district || ""} ${state}`.trim()
    ].filter(Boolean);

    let place = null;

    for (const term of [...new Set(searchTerms)]) {
        const geoUrl = new URL(
            "https://geocoding-api.open-meteo.com/v1/search"
        );

        geoUrl.search = new URLSearchParams({
            name: String(term).trim(),
            count: "10",
            language: "en",
            format: "json",
            countryCode: "IN"
        }).toString();

        const geoResponse = await fetch(geoUrl, {
            signal: AbortSignal.timeout(10000)
        });

        if (!geoResponse.ok) {
            throw new Error(
                "Unable to search for your farm location. Please try again."
            );
        }

        const geoData = await geoResponse.json();
        const results = geoData.results || [];

        // Prefer a place within the farmer's selected state.
        place = results.find((item) =>
            item.country_code?.toUpperCase() === "IN" &&
            item.admin1?.trim().toLowerCase() === state.toLowerCase()
        ) || null;

        if (place) {
            break;
        }
    }

    if (!place) {
        throw new Error(
            "Farm location not found. Please check the village or town, district, and state in your farmer profile."
        );
    }

    const weatherUrl = new URL(
        "https://api.open-meteo.com/v1/forecast"
    );

    weatherUrl.search = new URLSearchParams({
        latitude: String(place.latitude),
        longitude: String(place.longitude),
        current:
            "temperature_2m,relative_humidity_2m,precipitation,weather_code",
        daily:
            "temperature_2m_max,temperature_2m_min,precipitation_sum",
        forecast_days: "7",
        timezone: "auto"
    }).toString();

    const weatherResponse = await fetch(weatherUrl, {
        signal: AbortSignal.timeout(10000)
    });

    if (!weatherResponse.ok) {
        throw new Error(
            "Unable to retrieve weather information. Please try again."
        );
    }

    const weather = await weatherResponse.json();

    return {
        location: `${place.name}, ${place.admin1 || state}`,
        coordinates: {
            latitude: place.latitude,
            longitude: place.longitude
        },
        current: weather.current,
        current_units: weather.current_units,
        daily_units: weather.daily_units,
        nextSevenDays: weather.daily
    };
}

// POST /api/crop/recommend
const recommendCrops = async (req, res) => {
    try {
        // 1. Load the currently signed-in farmer's profile.
        const farmer = await Farmer.findOne({
            clerkUserId: req.userId
        }).lean();

        if (!farmer) {
            return res.status(404).json({
                success: false,
                message: "Please complete your farmer profile first."
            });
        }

        // 2. Retrieve weather for the farm's approximate location.
        const weather = await getFarmWeather(farmer);

        // 3. Prepare the farmer's information for Groq.
        const currentDate = new Date().toISOString().slice(0, 10);

        const farmDetails = {
            date: currentDate,
            location: farmer.location,
            district: farmer.district,
            state: farmer.state,
            farmSizeAcres: farmer.farmSize,
            soilType: farmer.soilType,
            irrigationMethod: farmer.irrigationMethod,
            currentlyGrownCrops: farmer.crops,
            weather: {
                location: weather.location,
                current: weather.current,
                nextSevenDays: weather.nextSevenDays
            }
        };

        // 4. Ask Groq AI for suitable crop options.
        const completion = await groq.chat.completions.create({
            model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
            messages: [
                {
                    role: "system",
                    content: `
You are AGRO-AI, an agricultural guidance assistant for farmers in India.

Recommend potential crops using the farmer's location, soil type,
irrigation method, farm size, current date, and supplied weather data.

Rules:
- Consider regional growing seasons and local suitability.
- Do not invent soil test results or weather measurements.
- Do not promise profits or guaranteed yields.
- Explain uncertainty when important information is missing.
- Consider the farmer's existing crops, but do not assume they must
  continue growing the same crops.
- Encourage soil testing and advice from a local agricultural expert
  before major planting decisions.
- Recommendations are preliminary and must not be presented as
  guaranteed agricultural outcomes.
- Return valid JSON only, following this structure:

{
  "season": "Likely growing season and explanation",
  "summary": "Short overall recommendation",
  "recommendations": [
    {
      "crop": "Crop name",
      "suitability": "High, Moderate, or Low",
      "reason": "Why it may suit this farm",
      "waterNeeds": "Water requirement",
      "growingPeriod": "Approximate growing period",
      "precautions": ["Precaution 1", "Precaution 2"]
    }
  ],
  "additionalAdvice": ["Advice 1", "Advice 2"],
  "limitations": ["Important uncertainty or limitation"]
}

Provide three to five suitable crop options when enough information
is available. Use cautious language and never claim certainty.
`
                },
                {
                    role: "user",
                    content: JSON.stringify(farmDetails)
                }
            ],
            temperature: 0.3,
            max_completion_tokens: 1800,
            response_format: {
                type: "json_object"
            }
        });

        // 5. Parse and validate the AI response.
        const content = completion.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error(
                "The AI returned an empty recommendation. Please try again."
            );
        }

        let recommendation;

        try {
            recommendation = JSON.parse(content);
        } catch {
            throw new Error(
                "The AI returned an invalid response. Please try again."
            );
        }

        if (!Array.isArray(recommendation.recommendations)) {
            throw new Error(
                "The AI response has an unexpected format. Please try again."
            );
        }

        // 6. Return the result to the signed-in farmer.
        return res.status(200).json({
            success: true,
            message: "Crop recommendations generated successfully.",
            farm: {
                location: farmer.location,
                district: farmer.district,
                state: farmer.state,
                soilType: farmer.soilType,
                irrigationMethod: farmer.irrigationMethod,
                farmSize: farmer.farmSize,
                crops: farmer.crops
            },
            weather,
            recommendation
        });
    } catch (error) {
        console.error("Crop recommendation error:", error.message);

        return res.status(502).json({
            success: false,
            message: error.message ||
                "Unable to generate crop recommendations right now."
        });
    }
};

module.exports = { recommendCrops };
