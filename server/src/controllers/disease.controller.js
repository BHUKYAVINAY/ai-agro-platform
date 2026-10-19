
const Groq = require("groq-sdk");
const DiseaseReport = require("../models/DiseaseReport");

const detectCropDisease = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please upload a crop photo."
            });
        }

        if (!process.env.GROQ_API_KEY) {
            return res.status(503).json({
                success: false,
                message: "AI service is not configured."
            });
        }

        const { crop } = req.body;

        if (
            typeof crop !== "string" ||
            !crop.trim() ||
            crop.trim().length > 50
        ) {
            return res.status(400).json({
                success: false,
                message: "Please select a valid crop."
            });
        }

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(req.file.mimetype)) {
            return res.status(400).json({
                success: false,
                message: "Upload a JPG, PNG, or WebP image."
            });
        }

        const groq = new Groq({
            apiKey: process.env.GROQ_API_KEY
        });

        const base64Image =
            req.file.buffer.toString("base64");

        const imageUrl =
            `data:${req.file.mimetype};base64,${base64Image}`;

        const completion =
            await groq.chat.completions.create({
                model:
                    process.env.GROQ_VISION_MODEL ||
                    "qwen/qwen3.8-27b",

                messages: [
                    {
                        role: "system",
                        content: `
You are an agricultural image-assessment assistant.

Return a JSON object with exactly these fields:
{
  "crop": "string",
  "likelyProblem": "string",
  "confidence": "low, medium, or high",
  "observations": ["string"],
  "organicOptions": ["string"],
  "conventionalOptions": ["string"],
  "nextSteps": ["string"],
  "warnings": ["string"]
}

Rules:
- Separate visible observations from possible causes.
- Do not claim a confirmed diagnosis from an image alone.
- State uncertainty if the image is unclear.
- Use simple English for farmers.
- Do not invent pesticide brands, approval status,
  dosages, mixing instructions, or harvest waiting periods.
- Encourage consulting a qualified agricultural expert.
- Explain that any treatment must follow local guidance
  and the product label.
- Return valid JSON only.
`
                    },
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text:
                                    `Selected crop: ${crop.trim()}. ` +
                                    "Assess the visible symptoms cautiously. " +
                                    "Suggest practical management options. " +
                                    "Do not guess if evidence is insufficient."
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: imageUrl
                                }
                            }
                        ]
                    }
                ],

                response_format: {
                    type: "json_object"
                },

                temperature: 0.2,
                max_completion_tokens: 1800
            });

        const content =
            completion.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error("The AI returned an empty response.");
        }

        const analysis = JSON.parse(content);

        // Save the analysis under the authenticated Clerk user.
        const report = await DiseaseReport.create({
            userId: req.userId,
            crop: crop.trim(),
            analysis
        });

        return res.status(200).json({
            success: true,
            message: "Crop disease analysis completed and saved.",
            reportId: report._id,
            analysis: report.analysis,
            createdAt: report.createdAt
        });
    } catch (error) {
        console.error("Crop disease detection error:", {
            message: error.message,
            status: error.status,
            code: error.code
        });

        return res.status(502).json({
            success: false,
            message:
                "Unable to analyse this photo right now. Please try again."
        });
    }
};

module.exports = { detectCropDisease };
