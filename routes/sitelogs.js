require("dotenv").config();
const router = require("express").Router();
const SiteLog = require("../models/SiteLog");

// Only allow Nathan (your user) to access logs
const OWNER_ID = process.env.OWNER_ID;
function requireOwner(req, res, next) {
  if (req.context?.userId === OWNER_ID) return next();
  return res.status(403).send("Forbidden");
}

// List logs with simple filters
router.get("/", requireOwner, async (req, res) => {
  const { method, status, userId, path } = req.query;
  const q = {};
  if (method) q.method = method.toUpperCase();
  if (status) q.status = Number(status);
  if (userId) q.userId = userId;
  if (path) q.path = new RegExp(path, "i");

  const logs = await SiteLog.find(q).sort({ ts: -1 }).limit(200).lean();
  res.render("sitelogs", { logs, filters: { method, status, userId, path } });
});

module.exports = router;
