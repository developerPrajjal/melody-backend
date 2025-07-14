// index.js
const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/create-playlist", async (req, res) => {
  const { access_token, genres } = req.body;

  if (!access_token || !genres) {
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
