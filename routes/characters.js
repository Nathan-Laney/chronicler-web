const router = require("express").Router();
const { customAlphabet } = require("nanoid");
const Character = require("../models/Character");
const nano = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 10);

router.get("/", async (req, res) => {
  const { guildId, userId } = req.context;
  const chars = await Character.find({ guildId, ownerId: userId }).sort({ characterName: 1 });
  res.render("characters", { chars, toast: null });
});

router.get("/:id", async (req, res) => {
  const { guildId, userId } = req.context;
  const char = await Character.findOne({ guildId, ownerId: userId, characterId: req.params.id });
  if (!char) throw new Error("Character not found.");
  res.render("character_show", { char, toast: null });
});

router.get("/new/form", (req, res) => res.render("character_form", { isEdit: false, char: {} }));

router.post("/create", async (req, res) => {
  const { guildId, userId } = req.context;
  const { characterName, class: klass } = req.body;
  const characterId = nano();
  await Character.create({ characterName, characterId, ownerId: userId, guildId, class: klass || "" });
  res.redirect("/characters");
});

router.post("/:id/delete", async (req, res) => {
  const { guildId, userId } = req.context;
  await Character.findOneAndDelete({ guildId, ownerId: userId, characterId: req.params.id });
  res.redirect("/characters");
});

router.post("/:id/rename", async (req, res) => {
  const { guildId, userId } = req.context;
  const { new_name } = req.body;
  await Character.updateOne({ guildId, ownerId: userId, characterId: req.params.id }, { $set: { characterName: new_name }});
  res.redirect(`/characters/${req.params.id}`);
});

router.post("/:id/description", async (req, res) => {
  const { guildId, userId } = req.context;
  const { description } = req.body;
  await Character.updateOne({ guildId, ownerId: userId, characterId: req.params.id }, { $set: { description }});
  res.redirect(`/characters/${req.params.id}`);
});

router.post("/:id/class", async (req, res) => {
  const { guildId, userId } = req.context;
  const { class: klass } = req.body;
  await Character.updateOne({ guildId, ownerId: userId, characterId: req.params.id }, { $set: { class: klass || "" }});
  res.redirect(`/characters/${req.params.id}`);
});

router.post("/:id/mission/add", async (req, res) => {
  const { guildId, userId } = req.context;
  const { mission } = req.body;
  await Character.updateOne({ guildId, ownerId: userId, characterId: req.params.id }, { $push: { missions: mission }});
  res.redirect(`/characters/${req.params.id}`);
});

router.post("/:id/mission/remove", async (req, res) => {
  const { guildId, userId } = req.context;
  const { mission } = req.body;
  await Character.updateOne({ guildId, ownerId: userId, characterId: req.params.id }, { $pull: { missions: mission }});
  res.redirect(`/characters/${req.params.id}`);
});

module.exports = router;
