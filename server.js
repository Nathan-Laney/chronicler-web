require("dotenv").config();
require("express-async-errors");
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const morgan = require("morgan");
const methodOverride = require("method-override");
const expressLayouts = require("express-ejs-layouts");

const app = express();

// EJS + layouts + static
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("layout", "layout"); // default layout file views/layout.ejs
app.use(expressLayouts);
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(morgan("dev"));

// Inject guild/user (temporary)
app.use((req, res, next) => {
  req.context = {
    guildId: process.env.GUILD_ID,
    userId: process.env.USER_ID
  };
  next();
});

// Routes
app.use("/", require("./routes/index"));
app.use("/characters", require("./routes/characters"));
app.use("/xp", require("./routes/xp"));
app.use("/bank", require("./routes/bank"));
app.use("/downtime", require("./routes/downtime"));
app.use("/missions", require("./routes/missions"));
app.use("/admin", require("./routes/admin"));
app.use("/stats", require("./routes/stats"));
app.use("/summaries", require("./routes/summaries"));

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send(`<pre>${err.message}</pre>`);
});

const start = async () => {
  const PORT = process.env.PORT || 3000;
  await mongoose.connect(process.env.MONGODB_SRV);
  app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
};
start();
