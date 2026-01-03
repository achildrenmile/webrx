const express = require('express');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3300;

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for inline scripts
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: { error: 'Too many requests, please try again later' }
});

const tileLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 300, // 300 tile requests per minute
  message: 'Too many tile requests'
});

// In-memory cache for SDR status
let sdrCache = {
  last_checked: null,
  sdr_status: []
};
const CACHE_TTL = 300000; // 5 minutes in milliseconds
const CHECK_TIMEOUT = 5000; // 5 seconds timeout per attempt
const MAX_RETRIES = 3; // Number of retry attempts

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// ============================================
// SDR Status Checker with Retry Logic
// ============================================

// Check a single SDR station with retries
async function checkStation(location) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CHECK_TIMEOUT);

      const response = await fetch(`${location.sdrlink}/status.json`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const ping = Date.now() - startTime;

      if (!response.ok) {
        if (attempt < MAX_RETRIES) {
          await new Promise(r => setTimeout(r, 1000)); // Wait 1s before retry
          continue;
        }
        return { id: location.id, status: 0, ping: null, frequencies: [] };
      }

      const data = await response.json();
      const frequencies = [];

      if (data.sdrs && Object.keys(data.sdrs).length > 0) {
        for (const sdr of Object.values(data.sdrs)) {
          if (sdr.profiles) {
            for (const profile of Object.values(sdr.profiles)) {
              if (profile.center_freq) {
                frequencies.push(Math.round(profile.center_freq / 100000) / 10);
              }
            }
          }
        }
        frequencies.sort((a, b) => a - b);
        return { id: location.id, status: 2, ping, frequencies };
      } else {
        return { id: location.id, status: 1, ping, frequencies: [] };
      }
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, 1000)); // Wait 1s before retry
        continue;
      }
      return { id: location.id, status: 0, ping: null, frequencies: [] };
    }
  }
  return { id: location.id, status: 0, ping: null, frequencies: [] };
}

// Refresh all station statuses
async function refreshStationStatus() {
  try {
    const locationsPath = path.join(__dirname, '../public/locations.json');
    const locations = JSON.parse(fs.readFileSync(locationsPath, 'utf8'));

    console.log(`[${new Date().toISOString()}] Checking ${locations.length} stations...`);

    const statusPromises = locations.map(location => checkStation(location));
    const sdrStatus = await Promise.all(statusPromises);

    const online = sdrStatus.filter(s => s.status === 2).length;
    const issues = sdrStatus.filter(s => s.status === 1).length;
    const offline = sdrStatus.filter(s => s.status === 0).length;

    console.log(`[${new Date().toISOString()}] Status: ${online} online, ${issues} issues, ${offline} offline`);

    // Update cache
    sdrCache = {
      last_checked: new Date().toISOString().replace('T', ' ').substring(0, 19),
      sdr_status: sdrStatus
    };

    // Save to file for persistence
    const dataPath = path.join(__dirname, '../public/grabber/data.json');
    fs.writeFileSync(dataPath, JSON.stringify(sdrCache, null, 2));

    return sdrCache;
  } catch (error) {
    console.error('Error refreshing station status:', error);
    return null;
  }
}

// API endpoint
app.get('/api/sdrs', apiLimiter, async (req, res) => {
  try {
    // Check if cache is still valid
    if (sdrCache.last_checked) {
      const cacheAge = Date.now() - new Date(sdrCache.last_checked).getTime();
      if (cacheAge < CACHE_TTL) {
        return res.json(sdrCache);
      }
    }

    const result = await refreshStationStatus();
    if (result) {
      res.json(result);
    } else {
      res.status(500).json({ error: 'Failed to fetch SDR status' });
    }
  } catch (error) {
    console.error('Error fetching SDR status:', error);
    res.status(500).json({ error: 'Failed to fetch SDR status' });
  }
});

// ============================================
// OpenStreetMap Tile Proxy
// ============================================
const tileCache = new Map();
const TILE_CACHE_TTL = 86400000; // 24 hours in milliseconds
const VALID_SUBDOMAINS = ['a', 'b', 'c'];

app.get('/tiles/:s/:z/:x/:y.png', tileLimiter, async (req, res) => {
  const { s, z, x, y } = req.params;

  // Validate subdomain
  if (!VALID_SUBDOMAINS.includes(s)) {
    return res.status(400).send('Invalid subdomain');
  }

  // Validate coordinates are integers
  const zInt = parseInt(z, 10);
  const xInt = parseInt(x, 10);
  const yInt = parseInt(y, 10);
  if (isNaN(zInt) || isNaN(xInt) || isNaN(yInt) || zInt < 0 || zInt > 19) {
    return res.status(400).send('Invalid tile coordinates');
  }

  const cacheKey = `${s}/${zInt}/${xInt}/${yInt}`;

  // Check memory cache
  const cached = tileCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < TILE_CACHE_TTL) {
    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'public, max-age=86400');
    return res.send(cached.data);
  }

  try {
    // Fetch from OpenStreetMap tile servers
    const tileUrl = `https://${s}.tile.openstreetmap.org/${zInt}/${xInt}/${yInt}.png`;
    const response = await fetch(tileUrl, {
      headers: {
        'User-Agent': 'WebRX Amateur Radio Map/1.0'
      }
    });

    if (!response.ok) {
      return res.status(response.status).send('Tile not found');
    }

    const buffer = await response.buffer();

    // Store in memory cache
    tileCache.set(cacheKey, {
      data: buffer,
      timestamp: Date.now()
    });

    // Limit cache size to 1000 tiles
    if (tileCache.size > 1000) {
      const oldestKey = tileCache.keys().next().value;
      tileCache.delete(oldestKey);
    }

    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(buffer);
  } catch (error) {
    console.error('Error fetching tile:', error);
    res.status(500).send('Failed to fetch tile');
  }
});

// ============================================
// Backward compatibility routes
// ============================================
// Redirect old PHP endpoint to new API
app.get('/grabber/sdrs.php', (req, res) => {
  res.redirect('/api/sdrs');
});

// Serve cached data.json directly for backward compatibility
app.get('/grabber/data.json', (req, res) => {
  const dataPath = path.join(__dirname, '../public/grabber/data.json');
  if (fs.existsSync(dataPath)) {
    res.sendFile(dataPath);
  } else {
    res.json(sdrCache);
  }
});

// ============================================
// Start Server
// ============================================
app.listen(PORT, () => {
  console.log(`WebRX server running on http://localhost:${PORT}`);
  console.log(`SDR Status API: http://localhost:${PORT}/api/sdrs`);
  console.log(`OSM Tile Proxy: http://localhost:${PORT}/tiles/{s}/{z}/{x}/{y}.png`);

  // Initial status check on startup
  console.log('Performing initial station status check...');
  refreshStationStatus();

  // Background checker - runs every 5 minutes
  const BACKGROUND_CHECK_INTERVAL = 300000; // 5 minutes
  setInterval(() => {
    console.log('Background status check starting...');
    refreshStationStatus();
  }, BACKGROUND_CHECK_INTERVAL);

  console.log(`Background checker enabled (every ${BACKGROUND_CHECK_INTERVAL / 60000} minutes)`);
});
