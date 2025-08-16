const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Geocode using OpenStreetMap (no key required)
app.get('/api/geocode', async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.status(400).json({ error: 'Missing q parameter' });

    const { data } = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: { q, format: 'json', limit: 1 },
      headers: {
        'User-Agent': 'IncredibleTrails/1.0 (contact@example.com)'
      }
    });

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(404).json({ error: 'Place not found' });
    }

    const { lat, lon, display_name } = data[0];
    res.json({ lat: parseFloat(lat), lon: parseFloat(lon), name: display_name });
  } catch (err) {
    res.status(500).json({ error: 'Geocoding failed', details: err.message });
  }
});

// Weather via OpenWeather (kept server-side to hide your API key)
app.get('/api/weather', async (req, res) => {
  try {
    const { lat, lon, city } = req.query;
    const key = process.env.OPENWEATHER_KEY;
    if (!key) return res.status(500).json({ error: 'Missing OPENWEATHER_KEY on server' });

    const params = { appid: key, units: 'metric' };
    if (lat && lon) {
      params.lat = lat;
      params.lon = lon;
    } else if (city) {
      params.q = city;
    } else {
      return res.status(400).json({ error: 'Provide lat & lon or city' });
    }

    const { data } = await axios.get('https://api.openweathermap.org/data/2.5/weather', { params });
    const payload = {
      temp: data.main?.temp,
      feels_like: data.main?.feels_like,
      condition: data.weather?.[0]?.main,
      description: data.weather?.[0]?.description,
      name: data.name,
      country: data.sys?.country,
    };
    res.json(payload);
  } catch (err) {
    const status = err.response?.status || 500;
    res.status(status).json({ error: 'Weather fetch failed', details: err.message });
  }
});

// Fallback to index.html for any unknown route (optional)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Incredible Trails running at http://localhost:${PORT}`);
});
