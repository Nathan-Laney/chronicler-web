const router = require("express").Router();
const Character = require("../models/Character");
const Profile = require("../models/Profile");

function addDowntimeForXP(xp) { return xp * 2; }

router.get("/", async (req, res) => {
  const { guildId, userId } = req.context;
  const [profile, chars] = await Promise.all([
    Profile.findOne({ guildId, userId }),
    Character.find({ guildId, ownerId: userId }).sort({ characterName: 1 })
  ]);
  res.render("xp", { profile, chars, toast: null });
});

router.post("/add/character", async (req, res) => {
  const { guildId, userId } = req.context;
  const { characterId, amount, mission } = req.body;
  const amt = Number(amount) || 0;
  const char = await Character.findOne({ guildId, ownerId: userId, characterId });
  if (!char) throw new Error("Character not found.");
  char.experience += amt;
  char.downtime += addDowntimeForXP(amt);
  if (mission) char.missions.push(mission);
  await char.save();
  res.redirect("/xp");
});

router.post("/add/bank", async (req, res) => {
  const { guildId, userId } = req.context;
  const { amount, mission } = req.body;
  const amt = Number(amount) || 0;
  let profile = await Profile.findOne({ guildId, userId });
  if (!profile) profile = await Profile.create({ guildId, userId, experience: 0, missions: [] });
  profile.experience += amt;
  if (mission) profile.missions.push(mission);
  await profile.save();
  res.redirect("/xp");
});

router.post("/remove/character", async (req, res) => {
  const { guildId, userId } = req.context;
  const { characterId, amount, mission } = req.body;
  const amt = Number(amount) || 0;
  const char = await Character.findOne({ guildId, ownerId: userId, characterId });
  if (!char) throw new Error("Character not found.");
  char.experience = Math.max(0, char.experience - amt);
  if (mission) char.missions = char.missions.filter(m => m !== mission);
  await char.save();
  res.redirect("/xp");
});

router.post("/remove/bank", async (req, res) => {
  const { guildId, userId } = req.context;
  const { amount, mission } = req.body;
  const amt = Number(amount) || 0;
  let profile = await Profile.findOne({ guildId, userId });
  if (!profile) profile = await Profile.create({ guildId, userId, experience: 0, missions: [] });
  profile.experience = Math.max(0, profile.experience - amt);
  if (mission) profile.missions = profile.missions.filter(m => m !== mission);
  await profile.save();
  res.redirect("/xp");
});

router.post("/transfer", async (req, res) => {
  const { guildId, userId } = req.context;
  const { characterId, amount } = req.body;
  const amt = Number(amount) || 0;
  const [profile, char] = await Promise.all([
    Profile.findOne({ guildId, userId }),
    Character.findOne({ guildId, ownerId: userId, characterId })
  ]);
  if (!profile || profile.experience < amt) throw new Error("Insufficient bank XP.");
  if (!char) throw new Error("Character not found.");
  profile.experience -= amt;
  char.experience += amt;
  char.downtime += addDowntimeForXP(amt);
  await Promise.all([profile.save(), char.save()]);
  res.redirect("/xp");
});

module.exports = router;
