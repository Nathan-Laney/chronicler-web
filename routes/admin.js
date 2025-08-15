const router = require("express").Router();
const Profile = require("../models/Profile");
const Character = require("../models/Character");

router.get("/", (req, res) => res.render("admin", { toast: null }));

router.post("/xp/addbank", async (req, res) => {
  const { guildId } = req.context;
  const { userId, amount, mission } = req.body;
  const amt = Number(amount) || 0;
  let profile = await Profile.findOne({ guildId, userId });
  if (!profile) profile = await Profile.create({ guildId, userId, experience: 0, missions: [] });
  profile.experience += amt;
  if (mission) profile.missions.push(mission);
  await profile.save();
  res.redirect("/admin");
});

router.post("/xp/removebank", async (req, res) => {
  const { guildId } = req.context;
  const { userId, amount, mission } = req.body;
  const amt = Number(amount) || 0;
  const profile = await Profile.findOne({ guildId, userId });
  if (!profile) throw new Error("Profile not found.");
  profile.experience = Math.max(0, profile.experience - amt);
  if (mission) profile.missions = profile.missions.filter(m => m !== mission);
  await profile.save();
  res.redirect("/admin");
});

router.post("/xp/addcharacter", async (req, res) => {
  const { guildId } = req.context;
  const { userId, characterId, amount, mission } = req.body;
  const amt = Number(amount) || 0;
  const char = await Character.findOne({ guildId, ownerId: userId, characterId });
  if (!char) throw new Error("Character not found.");
  char.experience += amt;
  if (mission) char.missions.push(mission);
  await char.save();
  res.redirect("/admin");
});

router.post("/xp/removecharacter", async (req, res) => {
  const { guildId } = req.context;
  const { userId, characterId, amount, mission } = req.body;
  const amt = Number(amount) || 0;
  const char = await Character.findOne({ guildId, ownerId: userId, characterId });
  if (!char) throw new Error("Character not found.");
  char.experience = Math.max(0, char.experience - amt);
  if (mission) char.missions = char.missions.filter(m => m !== mission);
  await char.save();
  res.redirect("/admin");
});

module.exports = router;
