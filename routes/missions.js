const router = require("express").Router();
const { customAlphabet } = require("nanoid");
const Mission = require("../models/Mission");
const Character = require("../models/Character");
const { resolveChannelMentions, mapDisplayNames } = require("../utils/discord");
const nano = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 12);

router.get("/", async (req, res) => {
  const { guildId, userId } = req.context;
  const missions = await Mission.find({ guildId }).sort({ missionStatus: 1, missionName: 1 });
  const myChars = await Character.find({ guildId, ownerId: userId }).sort({ characterName: 1 });
    // Resolve channel mentions in mission names
  const resolved = await Promise.all(missions.map(m => resolveChannelMentions(guildId, m.missionName)));
  // Resolve GM display names
  const gmMap = await mapDisplayNames(guildId, missions.map(m => m.gmId));
  missions.forEach((m, i) => {
    m._displayName = resolved[i].display;
    m._channelLinks = resolved[i].channels; // array of {id,name,url}
    m._gmName = gmMap[m.gmId] || m.gmId;
  });
  res.render("missions", { missions, myChars, toast: null });
});

router.get("/new/form", (req, res) => res.render("mission_form", { mission: {}, isEdit: false }));

router.post("/create", async (req, res) => {
  const { guildId, userId } = req.context;
  const { missionName, description } = req.body;
  await Mission.create({ missionId: nano(), missionName, description: description || "", guildId, gmId: userId });
  res.redirect("/missions");
});

router.get("/:id", async (req, res) => {
  const mission = await Mission.findOne({ missionId: req.params.id });
  if (!mission) throw new Error("Mission not found.");

  const { guildId } = req.context;

  // Resolve player display names and channel mentions concurrently
  const [displayNames, resolved, gmMap] = await Promise.all([
    mapDisplayNames(guildId, mission.players),
    resolveChannelMentions(guildId, mission.missionName),
    mapDisplayNames(guildId, [mission.gmId])
  ]);

  // Attach pretty mission name channel link(s) for the view
  mission._displayName = resolved.display;    // e.g. "#table-5" instead of "<#123...>"
  mission._channelLinks = resolved.channels;  // [{ id, name: "#table-5", url }]
  mission._gmName = gmMap[mission.gmId] || mission.gmId;

  res.render("mission_show", { mission, displayNames });
});

router.post("/:id/rename", async (req, res) => {
  const { current_name, new_name } = req.body;
  await Mission.updateOne({ missionId: req.params.id, missionName: current_name }, { $set: { missionName: new_name }});
  res.redirect(`/missions/${req.params.id}`);
});

router.post("/:id/description", async (req, res) => {
  const { description } = req.body;
  await Mission.updateOne({ missionId: req.params.id }, { $set: { description }});
  res.redirect(`/missions/${req.params.id}`);
});

router.post("/:id/delete", async (req, res) => {
  await Mission.deleteOne({ missionId: req.params.id });
  res.redirect("/missions");
});

router.post("/:id/complete", async (req, res) => {
  const mission = await Mission.findOne({ missionId: req.params.id });
  if (!mission) throw new Error("Mission not found.");

  // Only the GM can mark complete
  if (req.context.userId !== mission.gmId) {
    return res.status(403).send("Forbidden: Only the GM can mark this mission complete.");
  }

  mission.missionStatus = "completed";
  await mission.save();
  res.redirect(`/missions/${req.params.id}`);
});

router.post("/:id/addplayer", async (req, res) => {
  const { userId, characterId } = req.body;
  const char = await Character.findOne({ characterId });
  if (!char) throw new Error("Character not found.");
  await Mission.updateOne(
    { missionId: req.params.id },
    { $addToSet: { players: userId, characterIds: char.characterId, characterNames: char.characterName } }
  );
  res.redirect(`/missions/${req.params.id}`);
});

router.post("/:id/removeplayer", async (req, res) => {
  const { userId, characterId } = req.body;
  const char = await Character.findOne({ characterId });
  await Mission.updateOne(
    { missionId: req.params.id },
    { $pull: { players: userId, characterIds: characterId, characterNames: char ? char.characterName : undefined } }
  );
  res.redirect(`/missions/${req.params.id}`);
});

module.exports = router;
