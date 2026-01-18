require("dotenv").config();
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const jwt = require("jsonwebtoken");
const stripe = require("./stripe");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const db = new sqlite3.Database("./database.db");

/* DATABASE */
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS chatbots (
    id INTEGER PRIMARY KEY,
    business TEXT,
    token TEXT UNIQUE,
    color TEXT,
    welcome TEXT,
    tone TEXT,
    active INTEGER DEFAULT 1
  )`);
});

/* STRIPE CHECKOUT */
app.post("/create-checkout", async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: { name: "NUDELLA AI Business Chatbox" },
        unit_amount: 30000
      },
      quantity: 1
    }],
    mode: "payment",
    success_url: "http://localhost:3000/dashboard.html",
    cancel_url: "http://localhost:3000"
  });
  res.json({ url: session.url });
});

/* CREATE CHATBOT */
app.post("/create-bot", (req, res) => {
  const token = jwt.sign({}, process.env.JWT_SECRET);
  const { business, color, welcome, tone } = req.body;

  db.run(
    `INSERT INTO chatbots (business, token, color, welcome, tone)
     VALUES (?, ?, ?, ?, ?)`,
    [business, token, color, welcome, tone],
    () => res.json({ token })
  );
});

/* AI CHAT */
app.post("/chat/:token", (req, res) => {
  const { message } = req.body;
  const token = req.params.token;

  db.get("SELECT * FROM chatbots WHERE token=? AND active=1",
    [token], async (_, bot) => {

    if (!bot) return res.status(403).end();

    const system = `
You are an AI assistant for ${bot.business}.
Tone: ${bot.tone}.
Welcome message: ${bot.welcome}.
Be helpful, concise, and professional.
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();
    res.json({ reply: data.choices[0].message.content });
  });
});

/* ADMIN */
app.get("/admin/bots", (req, res) => {
  db.all("SELECT * FROM chatbots", (_, rows) => res.json(rows));
});

app.post("/admin/toggle", (req, res) => {
  db.run(
    "UPDATE chatbots SET active = NOT active WHERE token=?",
    [req.body.token],
    () => res.json({ success: true })
  );
});
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 NUDELLA AI live at http://localhost:${PORT}`);
});

);
