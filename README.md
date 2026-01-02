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

## Docker Deployment

### Quick Start
```bash
# Clone and run
git clone https://github.com/achildrenmile/webrx.git
cd webrx
docker compose up -d
```

The application will be available at `http://localhost:3300`

### Container Management

```bash
# Start the container
docker compose up -d

# Stop the container
docker compose down

# Restart the container
docker compose restart

# View logs
docker compose logs -f

# View container status
docker compose ps

# Rebuild after code changes
docker compose up -d --build
```

### Using Docker directly
```bash
# Build the image
docker build -t webrx .

# Run the container
docker run -d -p 3300:3300 --name webrx webrx

# Stop
docker stop webrx

# Start
docker start webrx

# View logs
docker logs -f webrx

# Remove container
docker rm -f webrx
```

### Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3300 | Server port |
| `NODE_ENV` | production | Environment mode |

### Volumes
| Path | Description |
|------|-------------|
| `./public/locations.json` | Station configuration (read-only) |
| `webrx-cache` | SDR status cache data |

### Custom Port
```bash
# Run on port 8080
PORT=8080 docker compose up -d
```

### Health Check
The container includes a health check that verifies the server is responding. View health status:
```bash
docker inspect --format='{{.State.Health.Status}}' webrx
```

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
