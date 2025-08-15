const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  experience: { type: Number, default: 0 },
  missions: { type: Array, default: [] },
});

profileSchema.index({ guildId: 1, userId: 1}, {unique: true});

module.exports = mongoose.model("profiles", profileSchema);
