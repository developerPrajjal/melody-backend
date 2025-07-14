const express = require("express");
const axios = require("axios");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

app.post("/exchange-token", async (req, res) => {
  const { code, codeVerifier, redirectUri } = req.body;

  try {
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        client_id: process.env.CLIENT_ID,
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

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
