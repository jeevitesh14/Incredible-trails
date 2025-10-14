let map;        // Leaflet map instance
let marker;     // Destination marker
let tilesAdded = false; // Prevent adding tiles twice

function inr(n) {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n));
  } catch {
    return `₹${n}`;
  }
}

function setYear() {
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
}

async function generatePlan() {
  const destination = document.getElementById('destination').value.trim();
  const budgetRaw = document.getElementById('budget').value.trim();

  if (!destination || !budgetRaw) {
    alert('Please enter both destination and budget!');
    return;
  }

  const budget = Number(budgetRaw);

  // Show result card
  document.getElementById('result').classList.remove('hidden');
  document.getElementById('dest-output').innerText = destination;
  document.getElementById('budget-output').innerText = inr(budget);

  // Build suggestions (basic for beginners)
  const base = [
    'Visit popular attractions',
    'Discover nature trails',
    'Explore local food spots',
    'Relax at local cafes',
    'Take a guided city tour'
  ];
  const budgetTip = budget < 5000
    ? 'Use public transport & free attractions'
    : budget < 20000
      ? 'Mix paid attractions with local experiences'
      : 'Consider premium tours and unique experiences';

  const placesList = document.getElementById('places-list');
placesList.innerHTML = '';

const links = {
  'Visit popular attractions': 'popular.html',
  'Discover nature trails': 'nature.html',
  'Explore local food spots': 'food.html',
  'Relax at local cafes': 'cafes.html',
  'Take a guided city tour': 'citytour.html'
};

[...base, `Budget tip: ${budgetTip}`].forEach((item) => {
  const li = document.createElement('li');

  if (links[item]) {
    const a = document.createElement('a');
    a.href = links[item];
    a.textContent = item;
    a.target = '_blank'; // optional: opens in new tab
    li.appendChild(a);
  } else {
    li.textContent = item;
  }

  placesList.appendChild(li);
});


  try {
    // 1) Geocode destination
    const geoRes = await fetch(`/api/geocode?q=${encodeURIComponent(destination)}`);
    const geo = await geoRes.json();
    if (!geoRes.ok) throw new Error(geo?.error || 'Geocoding failed');

    const { lat, lon, name } = geo;

    // 2) Weather for these coordinates
    const wRes = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
    const weather = await wRes.json();
    if (!wRes.ok) throw new Error(weather?.error || 'Weather fetch failed');

    const summary = `${weather.temp}°C, ${weather.condition} (${weather.description})`;
    document.getElementById('weather-output').innerText = summary;

    // 3) Render map
    renderMap(lat, lon, name || destination);

    // 4) Save last plan (simple persistence)
    localStorage.setItem('incredible_trails:last', JSON.stringify({ destination, budget, lat, lon }));
  } catch (err) {
    document.getElementById('weather-output').innerText = 'Data unavailable';
    alert(err.message || 'Something went wrong fetching data.');
  }
}

function renderMap(lat, lon, label) {
  const target = [lat, lon];

  if (!map) {
    map = L.map('map');
  }

  map.setView(target, 12);

  if (!tilesAdded) {
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    tilesAdded = true;
  }

  if (marker) {
    marker.setLatLng(target).bindPopup(label).openPopup();
  } else {
    marker = L.marker(target).addTo(map).bindPopup(label).openPopup();
  }
}

// Optional: restore last search on load
window.addEventListener('DOMContentLoaded', () => {
  setYear();
  const saved = localStorage.getItem('incredible_trails:last');
  if (!saved) return;
  try {
    const { destination, budget } = JSON.parse(saved);
    if (destination) document.getElementById('destination').value = destination;
    if (budget) document.getElementById('budget').value = budget;
  } catch {}
});
// 🌙 Theme Toggle Feature
const themeSwitch = document.getElementById('theme-switch');
const modeLabel = document.getElementById('mode-label');

// Check saved theme preference
window.addEventListener('DOMContentLoaded', () => {
  setYear();
  const saved = localStorage.getItem('incredible_trails:last');
  if (saved) {
    try {
      const { destination, budget } = JSON.parse(saved);
      if (destination) document.getElementById('destination').value = destination;
      if (budget) document.getElementById('budget').value = budget;
    } catch {}
  }

  // Apply saved theme
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    themeSwitch.checked = true;
    modeLabel.textContent = '🌙 Dark Mode';
  }
});

// Toggle dark/light mode
themeSwitch.addEventListener('change', () => {
  if (themeSwitch.checked) {
    document.body.classList.add('dark-mode');
    localStorage.setItem('theme', 'dark');
    modeLabel.textContent = '🌙 Dark Mode';
  } else {
    document.body.classList.remove('dark-mode');
    localStorage.setItem('theme', 'light');
    modeLabel.textContent = '🌞 Light Mode';
  }
});
