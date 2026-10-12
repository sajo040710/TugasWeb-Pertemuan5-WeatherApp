// Ganti dengan API key
const API_KEY = "af56cab804a637d5605af67423870a5a";
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";
const HISTORY_KEY = "weather-history";
const MAX_HISTORY = 5;

const state = { unit: "C", data: null };

const $ = (id) => document.getElementById(id);
const form = $("search-form");
const input = $("city-input");
const submitBtn = form.querySelector("button");

// ---------- Fetch ----------
const fetchWeather = async (city) => {
  const url = `${BASE_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=id`;
  const res = await fetch(url);

  if (res.status === 404) throw new Error("NOT_FOUND");
  if (res.status === 401) throw new Error("BAD_KEY");
  if (!res.ok) throw new Error(`HTTP_${res.status}`);

  return res.json();
};

// ---------- UI helpers ----------
const showStatus = (message, type = "info") => {
  const el = $("status");
  el.className = `status ${type}`;
  el.innerHTML = type === "loading"
    ? `<span class="spinner" aria-hidden="true"></span><span>${message}</span>`
    : message;
  el.hidden = false;
};
const hideStatus = () => { $("status").hidden = true; };

const errorMessage = (err) => {
  if (err.message === "NOT_FOUND") return "Kota tidak ditemukan. Cek ejaan nama kota lalu coba lagi.";
  if (err.message === "BAD_KEY") return "API key tidak valid. Periksa API_KEY di script.js.";
  if (err instanceof TypeError) return "Koneksi bermasalah. Periksa internet kamu lalu coba lagi.";
  return "Terjadi kesalahan saat mengambil data. Coba lagi nanti.";
};

const convertTemp = (celsius) =>
  state.unit === "C" ? Math.round(celsius) : Math.round((celsius * 9) / 5 + 32);

const renderWeather = () => {
  if (!state.data) return;
  const { name, sys, weather, main, wind } = state.data;
  const [info] = weather;

  $("city-name").textContent = `${name}, ${sys.country}`;
  $("description").textContent = info.description;
  $("icon").src = `https://openweathermap.org/img/wn/${info.icon}@2x.png`;
  $("icon").alt = info.description;
  $("temp").textContent = convertTemp(main.temp);
  $("temp-unit").textContent = `°${state.unit}`;
  $("humidity").textContent = `${main.humidity}%`;
  $("feels").textContent = `${convertTemp(main.feels_like)}°${state.unit}`;
  $("wind").textContent = `${wind.speed} m/s`;
  $("result").hidden = false;
};

// ---------- History (LocalStorage) ----------
const loadHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) ?? [];
  } catch {
    return [];
  }
};

const saveHistory = (city) => {
  const updated = [city, ...loadHistory().filter((c) => c.toLowerCase() !== city.toLowerCase())]
    .slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  renderHistory();
};

const renderHistory = () => {
  const list = loadHistory();
  const el = $("history");
  el.hidden = list.length === 0;
  el.innerHTML = list
    .map((city) => `<button type="button" data-city="${city}">${city}</button>`)
    .join("");
};

// ---------- Main flow ----------
const searchCity = async (city) => {
  const query = city.trim();
  if (!query) return;

  $("result").hidden = true;
  showStatus("Mengambil data cuaca...", "loading");
  submitBtn.disabled = true;

  try {
    state.data = await fetchWeather(query);
    hideStatus();
    renderWeather();
    saveHistory(state.data.name);
  } catch (err) {
    showStatus(errorMessage(err), "error");
  } finally {
    submitBtn.disabled = false;
  }
};

// ---------- Events ----------
form.addEventListener("submit", (e) => {
  e.preventDefault();
  searchCity(input.value);
});

$("history").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-city]");
  if (!btn) return;
  input.value = btn.dataset.city;
  searchCity(btn.dataset.city);
});

document.querySelectorAll(".unit").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.unit = btn.dataset.unit;
    document.querySelectorAll(".unit").forEach((b) => {
      const active = b === btn;
      b.classList.toggle("active", active);
      b.setAttribute("aria-pressed", active);
    });
    renderWeather();
  });
});

renderHistory();
