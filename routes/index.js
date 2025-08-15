const router = require("express").Router();
const Character = require("../models/Character");
const Mission = require("../models/Mission");
const Profile = require("../models/Profile");

router.get("/", async (req, res) => {
  const { guildId, userId } = req.context;
  const [chars, missions, profile] = await Promise.all([
    Character.find({ guildId, ownerId: userId }).sort({ characterName: 1 }),
    Mission.find({ guildId, missionStatus: "active", gmId: userId }).sort({ missionName: 1 }),
    Profile.findOne({ guildId, userId })
  ]);
  res.render("index", { chars, missions, profile, toast: null });
});

module.exports = router;
