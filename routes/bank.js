const router = require("express").Router();
const Profile = require("../models/Profile");

router.get("/", async (req, res) => {
  const { guildId, userId } = req.context;
  let profile = await Profile.findOne({ guildId, userId });
  if (!profile) profile = await Profile.create({ guildId, userId, experience: 0, missions: [] });
  // console.log("Profile:")
  // console.log(profile)
  // console.log("GuildID:")
  // console.log(guildId)
  // console.log("userId:")
  // console.log(userId)
  
  res.render("bank", { profile });
});

module.exports = router;
