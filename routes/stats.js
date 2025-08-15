const router = require("express").Router();
const Character = require("../models/Character");

router.get("/", async (req, res) => {
  const { guildId } = req.context;
  const { analyze = "level", grouping = "single" } = req.query;
  const chars = await Character.find({ guildId });

  let labels = [], counts = [];

  // utility: Title Case
  const titleCase = (s="") =>
    s.toString()
     .trim()
     .toLowerCase()
     .replace(/\b\w/g, m => m.toUpperCase());

  if (analyze === "class") {
    // Normalize class names to Title Case, ignore unset values
    const map = {};
    for (const c of chars) {
      const raw = (c.class || "").trim();
      if (!raw) continue;
      if (/^(not\s*set|unclassed|none)$/i.test(raw)) continue;
      const key = titleCase(raw);
      map[key] = (map[key] || 0) + 1;
    }
    labels = Object.keys(map).sort((a, b) => a.localeCompare(b));
    counts = labels.map(l => map[l]);
  } else {
    // LEVEL analysis
    const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, Number(n) || 0));
    if (grouping === "grouped") {
      // Fixed left-to-right order
      const ORDER = ["3-5","6-8","9-11","12-14","15-17","18-20"];
      const bucketCounts = Object.fromEntries(ORDER.map(k => [k, 0]));
      for (const c of chars) {
        const lvl = clamp(c.level, 3, 20);
        const idx = Math.floor((lvl - 3) / 3); // 0..5
        const key = ORDER[Math.max(0, Math.min(5, idx))];
        bucketCounts[key] += 1;
      }
      labels = ORDER;
      counts = labels.map(l => bucketCounts[l]);
    } else {
      // Single levels, sort numerically ascending
      const map = {};
      for (const c of chars) {
        const lvl = clamp(c.level, 1, 20);
        map[lvl] = (map[lvl] || 0) + 1;
      }
      labels = Object.keys(map).map(Number).sort((a,b)=>a-b).map(String);
      counts = labels.map(l => map[Number(l)]);
    }
  }

  res.render("stats", { labels: JSON.stringify(labels), counts: JSON.stringify(counts), analyze, grouping });
});

module.exports = router;
