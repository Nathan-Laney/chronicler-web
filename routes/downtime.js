const router = require("express").Router();
const Character = require("../models/Character");

router.get("/", async (req, res) => {
  const { guildId, userId } = req.context;
  const chars = await Character.find({ guildId, ownerId: userId }).sort({ characterName: 1 });
  res.render("downtime", { chars, toast: null });
});

router.post("/add", async (req, res) => {
  const { guildId, userId } = req.context;
  const { characterId, days } = req.body;
  const amt = Number(days) || 0;
  await Character.updateOne({ guildId, ownerId: userId, characterId }, { $inc: { downtime: amt }});
  res.redirect("/downtime");
});

router.post("/spend", async (req, res) => {
  const { guildId, userId } = req.context;
  const { characterId, days, activity } = req.body;
  const amt = Number(days) || 0;
  const char = await Character.findOne({ guildId, ownerId: userId, characterId });
  if (!char) throw new Error("Character not found.");
  char.downtime = Math.max(0, char.downtime - amt);
  if (activity) char.downtimeActivities.push(`${new Date().toISOString().slice(0,10)} — ${activity} (-${amt})`);
  await char.save();
  res.redirect("/downtime");
});

module.exports = router;
