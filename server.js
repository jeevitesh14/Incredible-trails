// server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const Plan = require('./database'); // Make sure this exports the Plan model
const jwt = require('jsonwebtoken');
const User = require('./models/User');

// Connect to DB (done in database.js)
require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Geocode using OpenStreetMap
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

// Weather via OpenWeather
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

// --- START: Auth routes ---
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_this';

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'User already exists' });

    const user = new User({ name, email, password });
    await user.save();

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Registered', token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Logged in', token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});
// --- END: Auth routes ---

// Auth middleware
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_change_this');
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// --- START: PLAN ROUTES ---
// Create a new plan
app.post('/api/plans', authMiddleware, async (req, res) => {
  try {
    const { destination, budget, weather, itinerary } = req.body;
    if (!destination) return res.status(400).json({ error: 'Destination required' });

    // You can attach the authenticated user's id if desired: userId: req.user.id
    const plan = new Plan({
      destination,
      budget,
      weather,
      itinerary
      // userId: req.user.id // add if your schema includes userId
    });
    await plan.save();
    res.json({ message: 'Plan created', plan });
  } catch (err) {
    console.error('Create plan error:', err);
    res.status(500).json({ error: 'Plan creation failed' });
  }
});

// Get all plans
app.get('/api/plans', authMiddleware, async (req, res) => {
  const plans = await Plan.find();
  res.json(plans);
});
// --- END: PLAN ROUTES ---

// Fallback catch-all route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Incredible Trails running on port ${PORT}`);
});
