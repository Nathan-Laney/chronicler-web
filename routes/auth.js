const router = require("express").Router();
const passport = require("passport");

// Kick off OAuth with Discord (scope: identify)
router.get("/discord", passport.authenticate("discord"));

// Callback URL set in .env DISCORD_REDIRECT_URI
router.get(
  "/discord/callback",
  passport.authenticate("discord", { failureRedirect: "/login-failed" }),
  (req, res) => {
    res.redirect("/"); // success -> home
  }
);

// Optional: simple failure page
router.get("/login-failed", (req, res) => {
  res.status(401).send("<h1>Login failed</h1><p>Please try again.</p>");
});

// Log out and destroy session
router.post("/logout", (req, res) => {
  req.logout?.(e => {
    if (e) console.error(e);
    req.session.destroy(() => res.redirect("/"));
  });
});

module.exports = router;
