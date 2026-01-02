const express = require('express');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3300;

// In-memory cache for SDR status
let sdrCache = {
  last_checked: null,
  sdr_status: []
};
const CACHE_TTL = 600000; // 10 minutes in milliseconds

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// ============================================
// SDR Status Checker API (replaces sdrs.php)
// ============================================
app.get('/api/sdrs', async (req, res) => {
  try {
    // Check if cache is still valid
    if (sdrCache.last_checked) {
      const cacheAge = Date.now() - new Date(sdrCache.last_checked).getTime();
      if (cacheAge < CACHE_TTL) {
        return res.json(sdrCache);
      }
    }

    // Load locations
    const locationsPath = path.join(__dirname, '../public/locations.json');
    const locations = JSON.parse(fs.readFileSync(locationsPath, 'utf8'));

    // Fetch status from all SDR stations in parallel
    const statusPromises = locations.map(async (location) => {
      const startTime = Date.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const response = await fetch(`${location.sdrlink}/status.json`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        const ping = Date.now() - startTime;

        if (!response.ok) {
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
        return { id: location.id, status: 0, ping: null, frequencies: [] };
      }
    });

    const sdrStatus = await Promise.all(statusPromises);

    // Update cache
    sdrCache = {
      last_checked: new Date().toISOString().replace('T', ' ').substring(0, 19),
      sdr_status: sdrStatus
    };

    // Save to file for persistence
    const dataPath = path.join(__dirname, '../public/grabber/data.json');
    fs.writeFileSync(dataPath, JSON.stringify(sdrCache, null, 2));

    res.json(sdrCache);
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

app.get('/tiles/:s/:z/:x/:y.png', async (req, res) => {
  const { s, z, x, y } = req.params;
  const cacheKey = `${s}/${z}/${x}/${y}`;

  // Check memory cache
  const cached = tileCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < TILE_CACHE_TTL) {
    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'public, max-age=86400');
    return res.send(cached.data);
  }

  try {
    // Fetch from OpenStreetMap tile servers
    const tileUrl = `https://${s}.tile.openstreetmap.org/${z}/${x}/${y}.png`;
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
});
