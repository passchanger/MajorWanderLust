const express = require("express");
const router = express.Router();
const getAiResponse = require("../utils/ai");

router.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    const reply = await getAiResponse(message);

    res.json({ reply });

  } catch (err) {
    console.log("AI ERROR:", err);
    res.status(500).json({ reply: "AI error" });
  }
});

module.exports = router;