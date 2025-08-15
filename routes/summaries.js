const router = require("express").Router();
const Summary = require("../models/Summary");

// PAGE 1: list distinct channels with summaries
router.get("/", async (req, res) => {
  // group by channelId, keep most-recent name + date
  const channels = await Summary.aggregate([
    {
      $sort: { updatedAt: -1 } // make sure first in each group is newest
    },
    {
      $group: {
        _id: "$channelId",
        channelId: { $first: "$channelId" },
        channelName: { $first: "$channelName" },
        updatedAt: { $first: "$updatedAt" },
        count: { $sum: 1 }
      }
    },
    { $sort: { channelName: 1 } }
  ]);

  res.render("summaries", { channels });
});

// PAGE 2: channel detail with model dropdown + summary text
router.get("/:channelId", async (req, res) => {
  const { channelId } = req.params;

  // all model options for this channel
  const modelDocs = await Summary.find({ channelId })
    .select("model channelName updatedAt")
    .sort({ model: 1 })
    .lean();

  if (!modelDocs.length) {
    return res.status(404).send("No summaries found for this channel.");
  }

  const models = Array.from(new Set(modelDocs.map(d => d.model)));
  const channelName = modelDocs[0].channelName;

  // pick model (query param) or default to first available
  const selectedModel = req.query.model && models.includes(req.query.model)
    ? req.query.model
    : models[0];

  // fetch the doc for the selected model (newest if multiples exist)
  const doc = await Summary.findOne({ channelId, model: selectedModel })
    .sort({ updatedAt: -1 })
    .lean();

  res.render("summary_show", {
    channelId,
    channelName,
    models,
    selectedModel,
    summary: doc ? doc.summary : ""
  });
});

// (Optional) Keep your existing /summaries/upsert if you use it elsewhere:
router.post("/upsert", async (req, res) => {
  const { channelId, channelName, model, summary, contextLength } = req.body;
  await Summary.findOneAndUpdate(
    { channelId, model },
    { channelId, channelName, model, summary, contextLength: Number(contextLength) || 0, timestamp: new Date() },
    { upsert: true }
  );
  res.redirect(`/summaries/${encodeURIComponent(channelId)}?model=${encodeURIComponent(model)}`);
});

module.exports = router;
