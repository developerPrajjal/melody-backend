// index.js
const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
const app = express();

app.use(cors({
  origin: "https://developerprajjal.github.io", // only allow your GitHub page
}));
app.use(express.json());

const clientId = "9d4c5c3068574999b5ce2dea3bf5db54";
const clientSecret = "283010b863b844a6b4d847dd2a4ae762"; // ⚠️ Replace this securely in .env in production
const redirectUri = "https://developerprajjal.github.io/birthday-for-oishi/callback.html";

// ========== 1. Exchange Auth Code for Access Token ==========
app.post("/api/exchange-token", async (req, res) => {
  const { code, codeVerifier } = req.body;

  if (!code || !codeVerifier) {
    return res.status(400).json({ error: "Missing code or codeVerifier" });
  }

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", redirectUri);
  params.append("code_verifier", codeVerifier);

  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params
    });

    const data = await response.json();

    if (data.access_token) {
      res.json({ access_token: data.access_token });
    } else {
      console.error("Token exchange failed:", data);
      res.status(500).json({ error: "Token exchange failed", details: data });
    }
  } catch (err) {
    console.error("Error during token exchange:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ========== 2. Create Spotify Playlist Based on Genres ==========
app.post("/api/create-playlist", async (req, res) => {
  const { access_token, genres } = req.body;

  if (!access_token || !genres || genres.length === 0) {
    return res.status(400).json({ error: "Missing access token or genres" });
  }

  try {
    // Get user ID
    const userRes = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const userData = await userRes.json();
    const userId = userData.id;

    // Get recommended tracks
    const trackRes = await fetch(`https://api.spotify.com/v1/recommendations?limit=10&seed_genres=${genres.join(",")}`, {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const trackData = await trackRes.json();
    const uris = trackData.tracks.map(track => track.uri);

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

    // Add tracks
    await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ uris })
    });

    res.json({ playlist_url: playlistData.external_urls.spotify });

  } catch (err) {
    console.error("Error creating playlist:", err);
    res.status(500).json({ error: "Failed to create playlist" });
  }
});

// ========== 3. Start Server ==========
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
