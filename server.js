require("dotenv").config();
const express = require("express");
const app = express();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Required for parsing JSON from frontend
app.use(express.json());

// Stripe checkout route — must be POST
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

// Serve static files (your index.html)
app.use(express.static("public"));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(🚀 Server running on port ${PORT}));
