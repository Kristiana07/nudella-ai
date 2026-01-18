require("dotenv").config();
const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { Configuration, OpenAIApi } = require("openai");
const path = require("path");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
app.use(express.static("public")); // serve frontend files

// Initialize OpenAI
const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY
}));

// --- Stripe checkout route ---
app.post("/create-checkout", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "NUDELLA AI Business Chatbox" },
            unit_amount: 30000, // $300 in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: "https://nudella-ai-production.up.railway.app/dashboard.html",
      cancel_url: "https://nudella-ai-production.up.railway.app",
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe handler error:", err);
    res.status(500).json({ error: "Stripe handler error" });
  }
});

// --- Create chatbox token for embedding ---
app.post("/create-bot", async (req, res) => {
  const { businessName, welcomeMessage, tone } = req.body;
  if (!businessName || !welcomeMessage || !tone) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Generate a JWT token for embedding
    const token = jwt.sign(
      { businessName, welcomeMessage, tone },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({ token });
  } catch (err) {
    console.error("Create bot error:", err);
    res.status(500).json({ error: "Failed to create bot" });
  }
});

// --- AI chat endpoint ---
app.post("/chat", async (req, res) => {
  const { token, message } = req.body;
  if (!token || !message) return res.status(400).json({ error: "Missing token or message" });

  try {
    // Verify token
    const botData = jwt.verify(token, process.env.JWT_SECRET);

    // Generate AI response
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: `You are a helpful AI for ${botData.businessName}. Tone: ${botData.tone}. Welcome message: ${botData.welcomeMessage}` },
        { role: "user", content: message }
      ]
    });

    res.json({ reply: completion.data.choices[0].message.content });
  } catch (err) {
    console.error("AI chat error:", err);
    res.status(500).json({ error: "Failed to get AI response" });
  }
});

// --- Start server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
