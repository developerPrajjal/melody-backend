// index.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const querystring = require('querystring');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const FRONTEND_URI = process.env.FRONTEND_URI;

// Login endpoint
app.get('/login', (req, res) => {
  const scope = 'playlist-modify-public';
  const queryParams = querystring.stringify({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: scope,
    redirect_uri: REDIRECT_URI,
  });

  res.redirect(`https://accounts.spotify.com/authorize?${queryParams}`);
});

// Callback endpoint
app.get('/callback', async (req, res) => {
  const code = req.query.code || null;

  try {
    const response = await axios.post('https://accounts.spotify.com/api/token',
      querystring.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

    const access_token = response.data.access_token;

    // ✅ Redirect back to frontend with token in URL
    res.redirect(`${FRONTEND_URI}?access_token=${access_token}`);

  } catch (error) {
    console.error("Error exchanging token:", error.response?.data || error.message);
    res.status(500).send("Something went wrong during authentication.");
  }
});

app.get('/', (req, res) => {
  res.send('🎵 Melody backend is live!');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
