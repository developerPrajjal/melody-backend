const express = require('express');
const request = require('request');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirect_uri = "https://melody-backend-7vmo.onrender.com/callback";
const frontend_url = "https://developerprajjal.github.io/birthday-for-oishi";

app.get('/login', function (req, res) {
  const scope = 'playlist-modify-public';
  const auth_query_parameters = new URLSearchParams({
    response_type: 'code',
    client_id: client_id,
    scope: scope,
    redirect_uri: redirect_uri,
  });

  res.redirect('https://accounts.spotify.com/authorize/?' + auth_query_parameters.toString());
});

app.get('/callback', function (req, res) {
  const code = req.query.code;

  const authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: code,
      redirect_uri: redirect_uri,
      grant_type: 'authorization_code',
    },
    headers: {
      Authorization:
        'Basic ' +
        Buffer.from(client_id + ':' + client_secret).toString('base64'),
    },
    json: true,
  };

  request.post(authOptions, function (error, response, body) {
    const access_token = body.access_token;
    res.redirect(`${frontend_url}?access_token=${access_token}`);
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
