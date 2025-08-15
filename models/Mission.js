const mongoose = require("mongoose");

const missionSchema = new mongoose.Schema({
  missionId: {
    type: String,
    required: true,
    unique: true,
    default: () => Math.random().toString(36).substring(2, 15),
  },
  missionName: { type: String, required: true },
  guildId: { type: String, required: true },
  players: { type: [String], default: [] },
  characterNames: { type: [String], default: [] },
  characterIds: { type: [String], default: [] },
  gmId: { type: String, required: true },
  missionStatus: { type: String, default: "active" },
  description: { type: String, required: false },
});

module.exports = mongoose.model("missions", missionSchema);
