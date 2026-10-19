
const Groq = require("groq-sdk");

const chatWithAgroAI = async (req, res) => {
    try {
        const { message } = req.body;

        if (
            typeof message !== "string" ||
            !message.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Please enter a question."
            });
        }

        if (message.length > 4000) {
            return res.status(400).json({
                success: false,
                message: "Your question must be under 4000 characters."
            });
        }

        if (!process.env.GROQ_API_KEY) {
            return res.status(503).json({
                success: false,
                message: "AI service is not configured."
            });
        }

        const groq = new Groq({
            apiKey: process.env.GROQ_API_KEY
        });

        const completion =
            await groq.chat.completions.create({
                model:
                    process.env.GROQ_MODEL ||
                    "openai/gpt-oss-20b",

                messages: [
                    {
                        role: "system",
                        content: `
You are AgroAI, an agricultural assistant
helping farmers, especially in India.

Your responsibilities:
- Explain crop cultivation and soil management.
- Give general irrigation and weather-related advice.
- Explain possible crop diseases and pest problems.
- Suggest questions farmers should ask agricultural experts.
- Use simple, practical language.
- Consider location and crops when provided.
- Ask for missing details when needed.
- Never invent live weather observations, market prices,
  government schemes, or scientific facts.
- Do not claim to have diagnosed an image when no image
  analysis was performed.
- For pesticides and fertilizers, encourage following
  product labels and local agricultural expert guidance.
- Explain uncertainty and recommend professional help
  when a crop problem cannot be identified reliably.
`
                    },
                    {
                        role: "user",
                        content: message.trim()
                    }
                ],

                temperature: 0.4,
                max_completion_tokens: 1000
            });

        const reply =
            completion.choices?.[0]?.message?.content;

        if (!reply) {
            return res.status(502).json({
                success: false,
                message: "The AI returned an empty response."
            });
        }

        return res.status(200).json({
            success: true,
            reply
        });
    } catch (error) {
        console.error("AgroAI error:", {
            message: error.message,
            status: error.status,
            code: error.code
        });

        return res.status(502).json({
            success: false,
            message: "Unable to generate an AI response. Please try again."
        });
    }
};

module.exports = { chatWithAgroAI };
