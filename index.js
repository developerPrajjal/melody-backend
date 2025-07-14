const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// Replace this with your real client ID and secret (secure in env in real case)
const client_id = "9d4c5c3068574999b5ce2dea3bf5db54";

app.get("/", (req, res) => {
  res.send("Melody backend running 🎵");
});

app.post("/api/create-playlist", async (req, res) => {
  const { access_token, genres } = req.body;

  try {
    if (!access_token || !genres) {
      return res.status(400).json({ error: "Missing token or genres" });
    }

    // Step 1: Get user profile
    const userRes = await axios.get("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const userId = userRes.data.id;

    // Step 2: Create new playlist
    const playlistRes = await axios.post(
      `https://api.spotify.com/v1/users/${userId}/playlists`,
      {
        name: "MelodyBot: Your Custom Playlist 💖",
        description: `Made just for you by MelodyBot! Genres: ${genres.join(", ")}`,
        public: true,
      },
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const playlistId = playlistRes.data.id;

    // Step 3: Search for tracks in each genre
    const trackUris = [];
    for (const genre of genres) {
      const searchRes = await axios.get(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(
          genre
        )}&type=track&limit=2`,
        {
          headers: { Authorization: `Bearer ${access_token}` },
        }
      );

      const tracks = searchRes.data.tracks.items;
      tracks.forEach((track) => trackUris.push(track.uri));
    }

    // Step 4: Add tracks to playlist
    if (trackUris.length > 0) {
      await axios.post(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        {
          uris: trackUris,
        },
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const playlistUrl = `https://open.spotify.com/playlist/${playlistId}`;
    res.json({ playlist_url: playlistUrl });
  } catch (err) {
    console.error("Playlist creation failed:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to create playlist" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Melody backend running on port ${PORT}`);
});
