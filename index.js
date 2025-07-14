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

// Spotify Token Exchange Route
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
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error("Token exchange failed:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to exchange token",
      details: error.response?.data || error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
