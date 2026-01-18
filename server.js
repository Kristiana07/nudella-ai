require("dotenv").config();
const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static("public")); // serve index.html and dashboard.html

// Stripe checkout route
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
    console.error("Stripe error:", err);
    res.status(500).json({ error: "Stripe error" });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
