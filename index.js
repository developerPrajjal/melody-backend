const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health Check Route
app.get("/", (req, res) => {
  res.send("🎵 MelodyBot backend is running!");
});

// Exchange Authorization Code for Access Token
app.post("/api/exchange-token", async (req, res) => {
  const { code, codeVerifier, state } = req.body;

  try {
    const params = new URLSearchParams();
    params.append("client_id", "9d4c5c3068574999b5ce2dea3bf5db54");
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", "https://developerprajjal.github.io/birthday-for-oishi/callback.html");
    params.append("code_verifier", codeVerifier);

    const response = await axios.post("https://accounts.spotify.com/api/token", params.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    console.log("✅ Token Exchange Successful");
    res.json(response.data);
  } catch (error) {
    console.error("❌ Token exchange failed:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to exchange token",
      details: error.response?.data || error.message,
    });
  }
});

// Generate Custom Playlist
app.post("/api/create-playlist", async (req, res) => {
  const { access_token, genres } = req.body;

  console.log("🎧 Incoming request to create playlist");
  console.log("Access Token:", access_token);
  console.log("Genres:", genres);

  try {
    // Step 1: Get Spotify user ID
    const profileRes = await axios.get("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const userId = profileRes.data.id;
    console.log("👤 Spotify User ID:", userId);

    // Step 2: Create a new playlist
    const playlistRes = await axios.post(
      `https://api.spotify.com/v1/users/${userId}/playlists`,
      {
        name: "Oishi's Custom Playlist",
        description: `A personalized playlist with ${genres.join(", ")}`,
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
    const playlistUrl = playlistRes.data.external_urls.spotify;
    console.log("🎶 Created Playlist ID:", playlistId);

    // Step 3: Search for tracks by genre
    const trackUris = [];

    for (const genre of genres) {
      const searchRes = await axios.get("https://api.spotify.com/v1/search", {
        params: {
          q: genre,
          type: "track",
          limit: 2, // adjust as needed
        },
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      const items = searchRes.data.tracks.items;
      if (items.length) {
        items.forEach((track) => {
          trackUris.push(track.uri);
        });
      }
    }

    console.log("🎧 Total Tracks Found:", trackUris.length);

    // Step 4: Add tracks to the playlist
    if (trackUris.length > 0) {
      await axios.post(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        { uris: trackUris },
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log("✅ Playlist Created at:", playlistUrl);
    res.json({ playlist_url: playlistUrl });
  } catch (err) {
    console.error("❌ Playlist Generation Failed:", err.response?.data || err.message);
    res.status(500).json({
      error: "Failed to generate playlist",
      details: err.response?.data || err.message,
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 MelodyBot backend is live on port ${PORT}`);
});
