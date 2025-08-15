const router = require("express").Router();
const Summary = require("../models/Summary");

router.get("/", async (req, res) => {
  const items = await Summary.find().sort({ updatedAt: -1 }).limit(50);
  res.render("summaries", { items });
});

router.post("/upsert", async (req, res) => {
  const { channelId, channelName, model, summary, contextLength } = req.body;
  await Summary.findOneAndUpdate(
    { channelId, model },
    { channelId, channelName, model, summary, contextLength: Number(contextLength) || 0, timestamp: new Date() },
    { upsert: true }
  );
  res.redirect("/summaries");
});

module.exports = router;
