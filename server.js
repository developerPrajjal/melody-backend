const express = require("express");
const axios = require("axios");
const fetch = require("node-fetch");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// 🪵 Debug Logging
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log("📦 Body:", JSON.stringify(req.body));
  }
  next();
});

// 🔐 Spotify Credentials
const CLIENT_ID = process.env.CLIENT_ID || "9d4c5c3068574999b5ce2dea3bf5db54";
const CLIENT_SECRET = process.env.CLIENT_SECRET || "283010b863b844a6b4d847dd2a4ae762";
const REDIRECT_URI = "https://developerprajjal.github.io/birthday-for-oishi/callback.html";

// 🌐 Health check
app.get("/", (req, res) => {
  res.send("🎶 Melody backend is running!");
});

// 🎯 Token Exchange (optional – not used by front-end currently)
app.post("/exchange-token", async (req, res) => {
  const { code, codeVerifier, redirectUri } = req.body;

  try {
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        client_id: CLIENT_ID,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Error exchanging token:", error.response?.data || error.message);
    res.status(400).json({ error: "Token exchange failed" });
  }
});

// 🎯 Main Endpoint – Create Playlist
app.post("/api/playlist", async (req, res) => {
  const { access_token, genres } = req.body;

  if (!access_token || !genres || !Array.isArray(genres)) {
    return res.status(400).json({ error: "Missing or invalid access_token or genres" });
  }

  try {
    // Step 1: Get user info
    const userRes = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const userData = await userRes.json();

    if (!userData.id) {
      console.error("❌ Failed to get user data:", userData);
      return res.status(500).json({ error: "Invalid access token" });
    }

    const userId = userData.id;

    // Step 2: Get recommended tracks
    const trackRes = await fetch(`https://api.spotify.com/v1/recommendations?limit=10&seed_genres=${genres.join(",")}`, {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const trackData = await trackRes.json();

    const uris = trackData.tracks?.map(track => track.uri) || [];
    if (uris.length === 0) {
      return res.status(500).json({ error: "No tracks found for selected genres" });
    }

    // Step 3: Create a playlist
    const playlistRes = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: "🎵 Melody Playlist",
        description: "A cute custom playlist for Oishi 💖",
        public: true
      })
    });
    const playlistData = await playlistRes.json();

    if (!playlistData.id) {
      console.error("❌ Failed to create playlist:", playlistData);
      return res.status(500).json({ error: "Failed to create playlist" });
    }

    // Step 4: Add tracks
    await fetch(`https://api.spotify.com/v1/playlists/${playlistData.id}/tracks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ uris })
    });

    // ✅ Success
    return res.json({ playlist_url: playlistData.external_urls.spotify });

  } catch (err) {
    console.error("❌ Playlist creation error:", err);
    return res.status(500).json({ error: "Something went wrong while creating playlist" });
  }
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
