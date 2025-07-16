// index.js
const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// 🔐 Spotify Credentials
const CLIENT_ID = "9d4c5c3068574999b5ce2dea3bf5db54";
const CLIENT_SECRET = "283010b863b844a6b4d847dd2a4ae762"; // Replace in production
const REDIRECT_URI = "https://developerprajjal.github.io/birthday-for-oishi/callback.html";

// 🪵 Logging Middleware for Debug
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log("📦 Body:", JSON.stringify(req.body));
  }
  next();
});

// 🎯 1. Exchange Code for Access Token
app.post("/api/exchange-token", async (req, res) => {
  const { code, codeVerifier, state } = req.body;

  if (!code || !codeVerifier) {
    return res.status(400).json({ error: "Missing code or codeVerifier" });
  }

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: codeVerifier
  });

  try {
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: body.toString()
    });

    const tokenData = await tokenRes.json();

    if (tokenData.access_token) {
      return res.json({ access_token: tokenData.access_token });
    } else {
      console.error("❌ Failed to get token:", tokenData);
      return res.status(500).json({ error: "Failed to exchange token" });
    }
  } catch (err) {
    console.error("❌ Token exchange error:", err);
    return res.status(500).json({ error: "Error exchanging token" });
  }
});

// 🎯 2. Create Playlist (Unified endpoint)
app.post("/api/playlist", async (req, res) => {
  const { access_token, genres } = req.body;

  if (!access_token || !genres || !Array.isArray(genres)) {
    return res.status(400).json({ error: "Missing or invalid access_token or genres" });
  }

  try {
    // Step 1: Get user ID
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

    // Step 3: Create playlist
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

    // Step 4: Add tracks to playlist
    await fetch(`https://api.spotify.com/v1/playlists/${playlistData.id}/tracks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ uris })
    });

    // ✅ Done
    return res.json({ playlist_url: playlistData.external_urls.spotify });

  } catch (err) {
    console.error("❌ Playlist creation error:", err);
    return res.status(500).json({ error: "Something went wrong while creating playlist" });
  }
});

// 🌐 Health Check (Optional)
app.get("/", (req, res) => {
  res.send("🎶 Melody backend is running!");
});

// 🚀 Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
