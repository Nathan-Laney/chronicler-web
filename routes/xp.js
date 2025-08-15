const router = require("express").Router();
const Character = require("../models/Character");
const Profile = require("../models/Profile");
const calculateGainedGPAndLevel = require("../experienceTable");


function addDowntimeForXP(xp) { return xp * 2; }

// XP home
router.get("/", async (req, res) => {
  const { guildId, userId } = req.context;
  const [profile, chars] = await Promise.all([
    Profile.findOne({ guildId, userId }),
    Character.find({ guildId, ownerId: userId }).sort({ characterName: 1 })
  ]);
  const msg = req.query.msg || null;
  const src = req.query.src || null; // 'char' | 'bank' | null
  res.render("xp", { profile, chars, toast: null, msg, src });
  
});

// --- helpers (JSON) ---

// Get a character's current stats (for this user/guild)
router.get("/character/:id.json", async (req, res) => {
  const { guildId, userId } = req.context;
  const char = await Character.findOne({ guildId, ownerId: userId, characterId: req.params.id })
    .select("characterId characterName experience level")
    .lean();
  if (!char) return res.status(404).json({ error: "Not found" });
  res.json(char);
});

// Get banked XP for this user/guild
router.get("/bank.json", async (req, res) => {
  const { guildId, userId } = req.context;
  const profile = await Profile.findOne({ guildId, userId }).lean();
  res.json({ experience: (profile && profile.experience) || 0 });
});

// --- mutations ---

router.post("/add/character", async (req, res) => {
  const { guildId, userId } = req.context;
  const { characterId, amount } = req.body;
  const amt = Number(amount) || 0;
  const char = await Character.findOne({ guildId, ownerId: userId, characterId });
  if (!char) throw new Error("Character not found.");
  const currentXP = char.experience;
  const newXP = currentXP + amt;
  const { gpGained, characterLevel } = calculateGainedGPAndLevel(currentXP, newXP);
  char.experience = newXP;
  char.level = characterLevel;
  char.downtime += addDowntimeForXP(amt);
  await char.save();
  const msg = `You now have an additional ${amt} xp. You gain ${gpGained} gold and are now level ${characterLevel}.`;
  res.redirect(`/xp?msg=${encodeURIComponent(msg)}&src=char`);
});

router.post("/remove/character", async (req, res) => {
  const { guildId, userId } = req.context;
  const { characterId, amount } = req.body;
  const amt = Number(amount) || 0;
  const char = await Character.findOne({ guildId, ownerId: userId, characterId });
  if (!char) throw new Error("Character not found.");
  const currentXP = char.experience;
  const newXP = Math.max(0, currentXP - amt);
  const { gpGained, characterLevel } = calculateGainedGPAndLevel(currentXP, newXP);
  char.experience = newXP;
  char.level = characterLevel;
  await char.save();
  const delta = -amt;
  const msg = `You now have an additional ${delta} xp. You gain ${gpGained} gold and are now level ${characterLevel}.`;
  res.redirect(`/xp?msg=${encodeURIComponent(msg)}&src=char`);
});

// Bank add/remove kept for completeness (not surfaced in UI now)
router.post("/add/bank", async (req, res) => {
  const { guildId, userId } = req.context;
  const { amount } = req.body;
  const amt = Number(amount) || 0;
  let profile = await Profile.findOne({ guildId, userId });
  if (!profile) profile = await Profile.create({ guildId, userId, experience: 0, missions: [] });
  profile.experience += amt;
  await profile.save();
  const msg = `You now have an additional ${amt} xp in your bank. Total banked XP: ${profile.experience}.`;
  res.redirect(`/xp?msg=${encodeURIComponent(msg)}&src=bank`);

});

router.post("/remove/bank", async (req, res) => {
  const { guildId, userId } = req.context;
  const { amount } = req.body;
  const amt = Number(amount) || 0;
  let profile = await Profile.findOne({ guildId, userId });
  if (!profile) profile = await Profile.create({ guildId, userId, experience: 0, missions: [] });
  profile.experience = Math.max(0, profile.experience - amt);
  await profile.save();
  const msg = `You now have an additional ${-amt} xp in your bank. Total banked XP: ${profile.experience}.`;
  res.redirect(`/xp?msg=${encodeURIComponent(msg)}&src=bank`);
  
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
  const currentXP = char.experience;
  const newXP = currentXP + amt;
  const { gpGained, characterLevel } = calculateGainedGPAndLevel(currentXP, newXP);
  char.experience = newXP;
  char.level = characterLevel;
  char.downtime += addDowntimeForXP(amt);
  await Promise.all([profile.save(), char.save()]);
  const msg = `You now have an additional ${amt} xp. You gain ${gpGained} gold and are now level ${characterLevel}.`;
  res.redirect(`/xp?msg=${encodeURIComponent(msg)}&src=char`);
  });

module.exports = router;
