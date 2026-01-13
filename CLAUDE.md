# WebRX - Claude Context

## Project Overview

Interactive map application for Software Defined Radio (SDR) receiver stations in Austria.

- **URL:** https://webrx.at
- **Repository:** https://github.com/achildrenmile/webrx

## Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: HTML5, CSS3, JavaScript, Leaflet.js
- **Maps**: OpenStreetMap (with local tile proxy)
- **Deployment**: Docker on Synology NAS

## Project Structure

```
├── src/
│   └── server.js           # Express backend
├── public/
│   ├── index.html          # Main page with map
│   ├── locations.json      # Station configuration
│   ├── css/                # Stylesheets
│   └── js/                 # Client-side JavaScript
├── Dockerfile              # Container definition
├── docker-compose.yml      # Docker compose config
└── deploy-production.sh    # Synology deployment script
```

## Deployment

### Production (Synology NAS)

```bash
# Deploy to production
./deploy-production.sh
```

**Requirements:**
- Copy `.env.production.example` to `.env.production` and configure
- SSH access to Synology configured

**Infrastructure:**
- **Host**: Synology NAS
- **Container**: `webrx-synology` on port 3300
- **Tunnel**: `cloudflared-webrx` (Cloudflare Tunnel)
- **URL**: https://webrx.at

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

## Features

- Interactive map showing WebRX station locations
- Real-time status monitoring of SDR stations
- Frequency display for operational stations
- OpenStreetMap tile proxy for local caching
- Responsive design

## API Endpoints

- `GET /api/sdrs` - Get status of all SDR stations (cached for 10 minutes)
- `GET /tiles/{s}/{z}/{x}/{y}.png` - OpenStreetMap tile proxy

## Configuration

Station data is stored in `public/locations.json`. Each station entry includes:
- `id`: Unique identifier
- `name`: Station name with callsign link
- `lat`, `lng`: Geographic coordinates
- `sdrlink`: URL to the WebRX instance
- `info`: Hardware and antenna information

### Adding a Station

1. Edit `public/locations.json`
2. Add new station object with required fields
3. Deploy to update

## Maintenance

### Check logs on Synology
```bash
ssh straliadmin@<SYNOLOGY_IP> '/usr/local/bin/docker logs webrx-synology'
```

### Verify deployment
```bash
curl -s -o /dev/null -w "%{http_code}" https://webrx.at/
```

### Check SDR status API
```bash
curl https://webrx.at/api/sdrs
```
