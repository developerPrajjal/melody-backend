// index.js
const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Environment Setup (Add your client credentials)
const CLIENT_ID = "9d4c5c3068574999b5ce2dea3bf5db54"; // Your Spotify Client ID
const CLIENT_SECRET = "283010b863b844a6b4d847dd2a4ae762";     // Replace this in production
const REDIRECT_URI = "https://developerprajjal.github.io/birthday-for-oishi/callback.html";

// 🎯 1. Exchange Authorization Code for Access Token
app.post("/api/exchange-token", async (req, res) => {
  const { code, codeVerifier, state } = req.body;

  if (!code || !codeVerifier) {
    return res.status(400).json({ error: "Missing code or code verifier" });
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
      console.error("Token response error:", tokenData);
      return res.status(500).json({ error: "Failed to exchange token" });
    }
  } catch (err) {
    console.error("Exchange error:", err);
    return res.status(500).json({ error: "Error exchanging token" });
  }
});

// 🎯 2. Create Playlist
app.post("/api/create-playlist", async (req, res) => {
  const { access_token, genres } = req.body;

  if (!access_token || !genres || !Array.isArray(genres)) {
    return res.status(400).json({ error: "Missing access token or genres" });
  }

  try {
    // Get User ID
    const userRes = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const userData = await userRes.json();
    const userId = userData.id;

    // Get recommended tracks
    const tracksRes = await fetch(`https://api.spotify.com/v1/recommendations?limit=10&seed_genres=${genres.join(",")}`, {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const tracksData = await tracksRes.json();
    const uris = tracksData.tracks.map(track => track.uri);

    // Create playlist
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
    const playlistId = playlistData.id;

    // Add tracks to playlist
    await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ uris })
    });

    // Send back the playlist URL
    return res.json({ playlist_url: playlistData.external_urls.spotify });

  } catch (err) {
    console.error("Error creating playlist:", err);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

// Server start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server is running on port ${PORT}`));
