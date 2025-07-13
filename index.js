const express = require("express");
const request = require("request");
const cors = require("cors");
const dotenv = require("dotenv");
const app = express();

dotenv.config();
app.use(cors());

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI;

// Homepage test route (optional)
app.get("/", (req, res) => {
  res.send("MelodyAI backend is live! 🎶");
});

// Step 1: Login - Redirect user to Spotify authorization
app.get("/login", function (req, res) {
  const scope = "playlist-modify-public playlist-modify-private";
  const auth_url =
    "https://accounts.spotify.com/authorize?" +
    new URLSearchParams({
      response_type: "code",
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
    }).toString();

  res.redirect(auth_url);
});

// Step 2: Spotify redirects here after user agrees
app.get("/callback", function (req, res) {
  const code = req.query.code || null;

  const authOptions = {
    url: "https://accounts.spotify.com/api/token",
    form: {
      code: code,
      redirect_uri: redirect_uri,
      grant_type: "authorization_code",
    },
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(client_id + ":" + client_secret).toString("base64"),
    },
    json: true,
  };

  request.post(authOptions, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      const access_token = body.access_token;
      const refresh_token = body.refresh_token;

      // ✅ Redirect back to your frontend with tokens in URL
      const frontend_url = "https://developerprajjal.github.io/birthday-for-oishi/";
      res.redirect(
        `${frontend_url}?access_token=${access_token}&refresh_token=${refresh_token}`
      );
    } else {
      res.send("Authentication failed. Please try again.");
    }
  });
});

// Optional: refresh token route
app.get("/refresh_token", function (req, res) {
  const refresh_token = req.query.refresh_token;

  const authOptions = {
    url: "https://accounts.spotify.com/api/token",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(client_id + ":" + client_secret).toString("base64"),
    },
    form: {
      grant_type: "refresh_token",
      refresh_token: refresh_token,
    },
    json: true,
  };

  request.post(authOptions, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      const access_token = body.access_token;
      res.send({ access_token });
    } else {
      res.status(400).send("Failed to refresh token.");
    }
  });
});

// Start server
const PORT = process.env.PORT || 8888;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
