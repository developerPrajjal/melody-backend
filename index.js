const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/login', (req, res) => {
  const redirectUri = encodeURIComponent(process.env.REDIRECT_URI);
  const scope = encodeURIComponent('playlist-modify-public');
  const clientId = process.env.CLIENT_ID;
  
  const authURL = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}`;
  res.redirect(authURL);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
