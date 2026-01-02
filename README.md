# WebRX - Amateur Radio Web Receiver Map

An interactive map application for Software Defined Radio (SDR) receiver stations in Austria.

## Features

- Interactive map showing WebRX station locations
- Real-time status monitoring of SDR stations
- Frequency display for operational stations
- OpenStreetMap tile proxy for local caching

## Tech Stack

- **Backend**: Node.js with Express
- **Frontend**: HTML5, CSS3, JavaScript, Leaflet.js
- **Maps**: OpenStreetMap (with local tile proxy)

## Installation

```bash
npm install
```

## Running

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

The server will start on `http://localhost:3300` (or the port specified in the `PORT` environment variable).

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

## License

ISC
