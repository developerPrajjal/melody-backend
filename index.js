const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("MelodyBot backend is running!");
});

// ✅ Token Exchange Route
app.post("/api/exchange-token", async (req, res) => {
  const { code, codeVerifier } = req.body;

  try {
    const params = new URLSearchParams();
    params.append("client_id", "9d4c5c3068574999b5ce2dea3bf5db54");
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", "https://developerprajjal.github.io/birthday-for-oishi/callback.html");
    params.append("code_verifier", codeVerifier);

    const response = await axios.post("https://accounts.spotify.com/api/token", params.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });

    res.json(response.data);
  } catch (error) {
    console.error("Token exchange failed:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to exchange token" });
  }
});

// ✅ Playlist Creation Route
app.post("/api/create-playlist", async (req, res) => {
  const { access_token, genres } = req.body;

  if (!access_token || !genres || !Array.isArray(genres)) {
    return res.status(400).json({ error: "Missing access_token or genres array" });
  }

  try {
    // 1. Get user profile (for user ID)
    const userRes = await axios.get("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const userId = userRes.data.id;

    // 2. Search tracks for each genre (limit total ~30)
    const trackUris = [];

    for (const genre of genres) {
      const q = encodeURIComponent(genre);
      const searchRes = await axios.get(`https://api.spotify.com/v1/search?q=${q}&type=track&limit=10`, {
        headers: { Authorization: `Bearer ${access_token}` }
      });

      const tracks = searchRes.data.tracks.items;
      tracks.forEach((track) => trackUris.push(track.uri));
    }

    // 3. Create playlist
    const playlistRes = await axios.post(`https://api.spotify.com/v1/users/${userId}/playlists`, {
      name: `🎶 Oishi's ${genres.join(", ")} Playlist`,
      description: "A custom playlist made with 💖 by MelodyBot",
      public: true
    }, {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const playlistId = playlistRes.data.id;

    // 4. Add tracks to playlist
    await axios.post(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      uris: trackUris.slice(0, 30)
    }, {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    // 5. Return playlist URL
    const playlistUrl = playlistRes.data.external_urls.spotify;
    res.json({ success: true, playlist_url: playlistUrl });

  } catch (error) {
    console.error("Playlist creation failed:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to create playlist",
      details: error.response?.data || error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
