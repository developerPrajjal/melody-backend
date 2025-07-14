// Elements
const chatbotLauncher = document.getElementById("chatbotLauncher");
const melodyChatbot = document.getElementById("melodyChatbot");
const chatbotCloud = document.getElementById("chatbotCloud");
const closeChatbot = document.getElementById("closeChatbot");
const sendMsg = document.getElementById("sendMsg");
const userInput = document.getElementById("userInput");
const chatbotBody = document.getElementById("chatbotBody");

let step = 0;
let selectedGenres = [];

// Show chatbot
chatbotLauncher.addEventListener("click", () => {
  melodyChatbot.classList.remove("hidden");
  chatbotCloud.classList.add("hidden");

  // After Spotify login redirect
  if (window.location.hash.includes("playlist")) {
    const token = localStorage.getItem("spotify_token");
    const genres = localStorage.getItem("selected_genres");

    console.log("Token:", token);
    console.log("Genres:", genres);

    if (token && genres) {
      appendMessage("bot", "Hello Oishi, hope you are having a great day! 😀");
      appendMessage("bot", `🎵 You previously selected: ${genres}`);
      appendMessage("bot", "Hang tight! I’m fetching your playlist now...");

      // Clean the hash
      history.replaceState(null, "", window.location.pathname);

      // Fetch playlist
      generatePlaylist(token, genres);
    }
  }
});

// Hide chatbot
closeChatbot.addEventListener("click", () => {
  melodyChatbot.classList.add("hidden");
  chatbotCloud.classList.remove("hidden");
});

// Message send handlers
sendMsg.addEventListener("click", handleUserMessage);
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleUserMessage();
});

function handleUserMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  appendMessage("user", message);
  userInput.value = "";

  setTimeout(() => handleBotResponse(message), 600);
}

function appendMessage(sender, text) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add(sender === "bot" ? "bot-message" : "user-message");
  msgDiv.textContent = text;
  chatbotBody.appendChild(msgDiv);
  chatbotBody.scrollTop = chatbotBody.scrollHeight;
}

function appendSpotifyButton(url) {
  const button = document.createElement("button");
  button.textContent = "🎵 Open Spotify";
  button.className = "spotify-btn";
  button.onclick = () => window.open(url, "_blank"); // FIXED this line

  const wrapper = document.createElement("div");
  wrapper.className = "bot-message";
  wrapper.appendChild(button);
  chatbotBody.appendChild(wrapper);
  chatbotBody.scrollTop = chatbotBody.scrollHeight;
}

function handleBotResponse(userMsg) {
  if (step === 0) {
    appendMessage("bot", "Awesome! 🎧 What genre(s) of music do you love? You can mention more than one.");
    step = 1;
  } else if (step === 1) {
    selectedGenres = userMsg.split(",").map((genre) => genre.trim());
    appendMessage("bot", `Great taste! 💕 I'll now prepare a playlist based on: ${selectedGenres.join(", ")}`);

    const button = document.createElement("button");
    button.textContent = "Generate My Playlist 🎵";
    button.className = "spotify-btn";
    button.onclick = () => initiateSpotifyLogin(selectedGenres);

    const wrapper = document.createElement("div");
    wrapper.className = "bot-message";
    wrapper.appendChild(button);
    chatbotBody.appendChild(wrapper);
    chatbotBody.scrollTop = chatbotBody.scrollHeight;

    step = 2;
  } else {
    appendMessage("bot", "Hang tight while I get your playlist ready! 🎵");
  }
}

// 🔐 Spotify Login Flow with PKCE
async function generateCodeChallenge(codeVerifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function generateRandomString(length) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => ('0' + (byte & 0xff).toString(16)).slice(-2)).join('');
}

async function initiateSpotifyLogin(genres) {
  const clientId = "9d4c5c3068574999b5ce2dea3bf5db54";
  const redirectUri = "https://developerprajjal.github.io/birthday-for-oishi/callback.html";
  const state = encodeURIComponent(genres.join(","));
  const codeVerifier = generateRandomString(64);
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  sessionStorage.setItem("code_verifier", codeVerifier);
  localStorage.setItem("selected_genres", genres.join(","));

  const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=playlist-modify-public&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;

  appendMessage("bot", "Click below to login and get your custom playlist:");
  appendSpotifyButton(authUrl); // Pass correct URL here
}

// 🎵 Playlist Generation from Backend
async function generatePlaylist(token, genres) {
  try {
    console.log("Calling create-playlist with token:", token, "genres:", genres);

    const res = await fetch("https://melody-backend-7vmo.onrender.com/api/create-playlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        access_token: token,
        genres: genres.split(",").map((g) => g.trim())
      })
    });

    const data = await res.json();
    console.log("Playlist Response:", data);

    if (data.playlist_url) {
      appendMessage("bot", "Here's your custom Spotify playlist! 🎶");
      appendSpotifyButton(data.playlist_url);
    } else {
      appendMessage("bot", "Oops! Couldn't generate the playlist. Please try again.");
    }
  } catch (err) {
    console.error("Playlist Error:", err);
    appendMessage("bot", "Something went wrong while fetching your playlist.");
  }
}
