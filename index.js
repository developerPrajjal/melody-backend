const express = require("express");
const request = require("request");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const FRONTEND_URI = process.env.FRONTEND_URI;

app.get("/", (req, res) => {
  res.send("Melody backend is live!");
});

app.get("/login", (req, res) => {
  const scope = "playlist-modify-public";
  const authURL =
    "https://accounts.spotify.com/authorize" +
    "?response_type=code" +
    "&client_id=" + encodeURIComponent(CLIENT_ID) +
    "&scope=" + encodeURIComponent(scope) +
    "&redirect_uri=" + encodeURIComponent(REDIRECT_URI);
  res.redirect(authURL);
});

app.get("/callback", (req, res) => {
  const code = req.query.code || null;
  const authOptions = {
    url: "https://accounts.spotify.com/api/token",
    form: {
      code: code,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code"
    },
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(CLIENT_ID + ":" + CLIENT_SECRET).toString("base64"),
    },
    json: true,
  };

  request.post(authOptions, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const access_token = body.access_token;
      res.redirect(`${FRONTEND_URI}?access_token=${access_token}`);
    } else {
      res.redirect(`${FRONTEND_URI}?error=invalid_token`);
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
