const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();
const app = express();

app.use(cors());
app.use(express.json());
const port = process.env.PORT || 3000;

app.post("/token", async (req, res) => {
  const { code, code_verifier, redirect_uri } = req.body;

  try {
    const params = new URLSearchParams();
    params.append("client_id", process.env.SPOTIFY_CLIENT_ID);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", redirect_uri);
    params.append("code_verifier", code_verifier);

    const response = await axios.post("https://accounts.spotify.com/api/token", params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error exchanging code for token:", error.response?.data || error.message);
    res.status(500).json({ error: "Token exchange failed" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
