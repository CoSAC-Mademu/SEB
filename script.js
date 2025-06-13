const BACKEND_URL = "http://192.168.1.101:5000"; // Cambia con l'IP del tuo Raspberry

// Elementi UI
const form = document.getElementById("nickname-form");
const nicknameInput = document.getElementById("nickname");
const nicknameList = document.getElementById("nickname-list");
const pairingList = document.getElementById("pairing-list");
const generateBtn = document.getElementById("generate-btn");

// Effetti sonori (opzionali)
const playSound = (type) => {
  const sounds = {
    success: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3'),
    error: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-retro-arcade-game-notification-211.mp3')
  };
  if (sounds[type]) sounds[type].play().catch(e => console.log("Audio non supportato"));
};

// Animazioni
const animateButton = (btn) => {
  btn.style.transform = "scale(0.95)";
  setTimeout(() => btn.style.transform = "scale(1)", 150);
};

// Aggiorna lista giocatori
async function fetchPlayers() {
  try {
    const res = await fetch(`${BACKEND_URL}/get-players`);
    if (!res.ok) throw new Error("Network error");
    const players = await res.json();
    updatePlayerList(players);
  } catch (error) {
    console.error("Fetch players error:", error);
    nicknameList.innerHTML = "<li>Errore nel caricamento dei giocatori</li>";
  }
}

function updatePlayerList(players) {
  nicknameList.innerHTML = "";
  
  if (players.length === 0) {
    nicknameList.innerHTML = "<li>Nessun giocatore registrato</li>";
    return;
  }

  players.forEach((player, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="player-number">${index + 1}.</span>
      <span class="player-name">${player}</span>
    `;
    nicknameList.appendChild(li);
  });
}

// Aggiorna tabellone
async function fetchPairings() {
  try {
    const res = await fetch(`${BACKEND_URL}/get-pairs`);
    if (!res.ok) throw new Error("Network error");
    const pairings = await res.json();
    updatePairingList(pairings);
  } catch (error) {
    console.error("Fetch pairings error:", error);
    pairingList.innerHTML = "<li>Errore nel caricamento del tabellone</li>";
  }
}

function updatePairingList(pairings) {
  pairingList.innerHTML = "";
  
  if (!pairings || pairings.length === 0) {
    pairingList.innerHTML = "<li>Tabellone non generato</li>";
    return;
  }

  pairings.forEach((pair, index) => {
    const li = document.createElement("li");
    const [p1, p2] = pair;
    
    if (p2) {
      li.innerHTML = `
        <span class="match-number">Match ${index + 1}:</span>
        <span class="vs-match">${p1} <span class="vs">VS</span> ${p2}</span>
      `;
    } else {
      li.innerHTML = `
        <span class="match-number">Match ${index + 1}:</span>
        <span class="bye-match">${p1} <span class="bye">(BYE)</span></span>
      `;
    }
    
    pairingList.appendChild(li);
  });
}

// Gestione form
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nickname = nicknameInput.value.trim();
  if (!nickname) return;

  animateButton(form.querySelector("button"));
  
  try {
    const res = await fetch(`${BACKEND_URL}/add-player`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname })
    });

    const data = await res.json();

    if (res.ok) {
      playSound("success");
      nicknameInput.value = "";
      fetchPlayers();
    } else {
      playSound("error");
      alert(data.error || "Errore durante l'invio del nickname.");
    }
  } catch (error) {
    playSound("error");
    alert("Errore di connessione al server");
    console.error("Submit error:", error);
  }
});

// Genera tabellone
generateBtn.addEventListener("click", async () => {
  animateButton(generateBtn);
  
  try {
    const res = await fetch(`${BACKEND_URL}/generate-pairs`, {
      method: "POST"
    });

    const data = await res.json();

    if (res.ok) {
      playSound("success");
      updatePairingList(data);
    } else {
      playSound("error");
      alert(data.error || "Errore nella generazione del tabellone.");
    }
  } catch (error) {
    playSound("error");
    alert("Errore di connessione al server");
    console.error("Generate pairs error:", error);
  }
});

// Polling per aggiornamenti automatici
setInterval(() => {
  fetchPlayers();
  fetchPairings();
}, 5000); // Aggiorna ogni 5 secondi

// Inizializzazione
document.addEventListener("DOMContentLoaded", () => {
  fetchPlayers();
  fetchPairings();
});
