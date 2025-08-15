const mongoose = require("mongoose");

const siteLogSchema = new mongoose.Schema({
  ts:         { type: Date,   default: Date.now, index: true },
  method:     { type: String, required: true },
  status:     { type: Number, required: true, default: 0 },
  durationMs: { type: Number, required: true, default: 0 },

  path:        { type: String, required: true },
  originalUrl: { type: String, required: true },

  userId:  { type: String, default: null, index: true },
  guildId: { type: String, default: null, index: true },

  ip:        { type: String, default: null },
  userAgent: { type: String, default: null },
  referrer:  { type: String, default: null },

  // Keep raw inputs small & queryable (Mixed is fine here)
  query:  { type: mongoose.Schema.Types.Mixed, default: {} },
  body:   { type: mongoose.Schema.Types.Mixed, default: {} },
  params: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { minimize: true });

siteLogSchema.index({ ts: -1 });
siteLogSchema.index({ method: 1, status: 1 });

module.exports = mongoose.model("sitelogs", siteLogSchema);
