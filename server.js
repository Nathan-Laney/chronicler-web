require("dotenv").config();
require("express-async-errors");
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const morgan = require("morgan");
const methodOverride = require("method-override");
const expressLayouts = require("express-ejs-layouts");
const session = require("express-session");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;

// Simple auth gate
function requireLogin(req, res, next) {
  if (req.user) return next();
  // Redirect to Discord login if not authenticated
  return res.redirect("/auth/discord");
}
  
const app = express();

// --- Passport: Discord OAuth ---
passport.serializeUser((user, done) => {
  // store minimal info in session
  done(null, {
    id: user.id,
    username: user.username,
    global_name: user.global_name,
    avatar: user.avatar
  });
});
passport.deserializeUser((obj, done) => done(null, obj));
passport.use(
  new DiscordStrategy(
    {
      clientID: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      callbackURL: process.env.DISCORD_REDIRECT_URI,
      scope: ["identify"]
    },
    (accessToken, refreshToken, profile, done) => {
      // profile.id is the Discord user id
      return done(null, profile);
    }
  )
);

// EJS + layouts + static
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("layout", "layout");
app.use(expressLayouts);
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(morgan("dev"));

// Sessions (needed for OAuth)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "change_me",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: "lax" }
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Inject guild/user (user id from login; fallback to env for local testing)
app.use((req, res, next) => {
  req.context = {
    guildId: process.env.GUILD_ID,
    userId: (req.user && req.user.id) || process.env.USER_ID
  };
  // expose minimal user to views for header UI
  res.locals.me = req.user || null;
  next();
});

// Routes
app.use("/", require("./routes/index"));
app.use("/characters", requireLogin, require("./routes/characters"));
app.use("/xp", requireLogin, require("./routes/xp"));
app.use("/bank", requireLogin, require("./routes/bank"));
app.use("/downtime", requireLogin, require("./routes/downtime"));
app.use("/missions", require("./routes/missions"));
app.use("/admin", requireLogin, require("./routes/admin"));
app.use("/stats", require("./routes/stats"));
app.use("/summaries", require("./routes/summaries"));
app.use("/auth", require("./routes/auth"));

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
