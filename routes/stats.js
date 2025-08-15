const router = require("express").Router();
const Character = require("../models/Character");

router.get("/", async (req, res) => {
  const { guildId } = req.context;
  const { analyze = "level", grouping = "single" } = req.query;
  const chars = await Character.find({ guildId });

  let labels = [], counts = [];
  if (analyze === "class") {
    const map = {};
    chars.forEach(c => map[c.class || "Unclassed"] = (map[c.class || "Unclassed"] || 0) + 1);
    labels = Object.keys(map);
    counts = Object.values(map);
  } else {
    const bucket = {};
    const keyFor = (lvl) => grouping === "grouped"
      ? `${Math.floor((lvl||0)/3)*3}-${Math.floor((lvl||0)/3)*3+2}`
      : `${lvl||0}`;
    chars.forEach(c => bucket[keyFor(c.level)] = (bucket[keyFor(c.level)] || 0) + 1);
    labels = Object.keys(bucket);
    counts = Object.values(bucket);
  }

  res.render("stats", { labels: JSON.stringify(labels), counts: JSON.stringify(counts), analyze, grouping });
});

module.exports = router;
