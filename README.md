# Millo's Cuisine Explorer

A web application for discovering and exploring authentic recipes from various African and intercontinental cuisines. Built with Node.js, Express.js, and vanilla JavaScript with Docker containerization and load balancing.

## Purpose

This application serves a practical purpose by helping users discover authentic recipes, explore different cuisines, and find meal inspiration. It addresses the real need for accessible, searchable recipe discovery with comprehensive filtering and sorting capabilities.

## Features

- **Cuisine Filtering**: Browse recipes by African regions and international cuisines
- **Detailed Views**: Complete recipe information with ingredients and instructions
- **Popular Recipes**: Featured recipes on the home page
- **Responsive Design**: Works on all devices and screen sizes
- **API Protection**: Secured endpoints with API key authentication
- **Rate Limiting**: Protection against abuse with request throttling

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose
- npm (Node Package Manager)

### Local Development

**Clone the repository**:

```bash
git clone https://github.com/Millowise01/Millo-s-Recipe-App.git
cd Millo-s-Recipe-App
```

**Install dependencies**:

```bash
npm install
```

**Set environment variables**:

```bash
export API_KEY=secure-api-key-2024
export PORT=8080
```

**Start the server**:

```bash
npm start
```

**Access the application**:
Open your browser and navigate to `http://localhost:8080`

## Docker Deployment

### Part 2A: Docker Containers + Docker Hub

#### Image Details

- **Docker Hub Repository**: https://hub.docker.com/r/millowise01/millos-cuisine
- **Image Name**: `millowise01/millos-cuisine`
- **Available Tags**: `v1`, `v1.1`, `latest`
- **Base Image**: node:18-alpine
- **Image Size**: ~150MB (optimized)

#### Build Instructions

**Build the Docker image**:

```bash
docker build -t millowise01/millos-cuisine:v1 .
```

**Test locally**:

```bash
docker run -p 8080:8080 -e API_KEY=secure-api-key-2024 millowise01/millos-cuisine:v1
curl -H "X-API-Key: secure-api-key-2024" http://localhost:8080/api/health
```

**Push to Docker Hub**:

```bash
docker login
docker push millowise01/millos-cuisine:v1
docker tag millowise01/millos-cuisine:v1 millowise01/millos-cuisine:latest
docker push millowise01/millos-cuisine:latest
```

#### Deploy on Lab Machines

**Lab Infrastructure:**
- **Lab Setup**: Based on https://github.com/waka-man/web_infra_lab.git
- **Web01**: 172.20.0.11 (Docker container)
- **Web02**: 172.20.0.12 (Docker container)
- **Load Balancer**: 172.20.0.10 (HAProxy container)

**SSH into web-01 and web-02**:

```bash
# On web-01 (172.20.0.11)
ssh user@web-01
docker pull millowise01/millos-cuisine:v1
docker run -d --name app --restart unless-stopped \
  -p 8080:8080 \
  -e API_KEY=secure-api-key-2024 \
  -e NODE_ENV=production \
  -e SERVER_NAME=web-01 \
  millowise01/millos-cuisine:v1

# On web-02 (172.20.0.12)
ssh user@web-02
docker pull millowise01/millos-cuisine:v1
docker run -d --name app --restart unless-stopped \
  -p 8080:8080 \
  -e API_KEY=secure-api-key-2024 \
  -e NODE_ENV=production \
  -e SERVER_NAME=web-02 \
  millowise01/millos-cuisine:v1
```

**Verify instances are running**:

```bash
# Test web-01 internally
curl -H "X-API-Key: secure-api-key-2024" http://web-01:8080/api/health

# Test web-02 internally  
curl -H "X-API-Key: secure-api-key-2024" http://web-02:8080/api/health

# Verify external access
curl -H "X-API-Key: secure-api-key-2024" http://172.20.0.11:8080/api/health
curl -H "X-API-Key: secure-api-key-2024" http://172.20.0.12:8080/api/health
```

#### Configure Load Balancer (lb-01)

**Update HAProxy configuration**:

```bash
# Copy haproxy.cfg to lb-01
scp haproxy.cfg user@lb-01:/tmp/haproxy.cfg

# SSH into lb-01
ssh user@lb-01
sudo cp /tmp/haproxy.cfg /etc/haproxy/haproxy.cfg
```

**HAProxy Configuration**:

```haproxy
backend webapps
    balance roundrobin
    option httpchk GET /api/health
    http-check expect status 200
    server web01 172.20.0.11:8080 check inter 30s fall 3 rise 2
    server web02 172.20.0.12:8080 check inter 30s fall 3 rise 2
```

**Reload HAProxy**:

```bash
docker exec -it lb-01 sh -c 'haproxy -sf $(pidof haproxy) -f /etc/haproxy/haproxy.cfg'
```

#### Testing Steps & Evidence

**Test load balancing**:

```bash
# Make multiple requests to verify round-robin
for i in {1..10}; do
  curl -H "X-API-Key: secure-api-key-2024" http://localhost/api/health
  echo ""
done
```

**Verify container health**:

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

**Check logs**:

```bash
docker logs millos-web01
docker logs millos-web02
```

### Part 2B: Traditional Deployment

#### Web Servers (Web01 & Web02)

**Install Node.js**:

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Deploy application**:

```bash
sudo mkdir -p /var/www/millos-cuisine
sudo chown -R $USER:$USER /var/www/millos-cuisine
scp -r ./* username@server-ip:/var/www/millos-cuisine/
cd /var/www/millos-cuisine
npm install --production
```

**Create systemd service**:

```bash
sudo tee /etc/systemd/system/millos-cuisine.service > /dev/null <<EOF
[Unit]
Description=Millo's Cuisine Explorer
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/millos-cuisine
ExecStart=/usr/bin/node server.js
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=8080
Environment=API_KEY=secure-api-key-2024

[Install]
WantedBy=multi-user.target
EOF
```

**Start service**:

```bash
sudo systemctl daemon-reload
sudo systemctl enable millos-cuisine
sudo systemctl start millos-cuisine
```

## Architecture

### Backend (Node.js + Express.js)

- **RESTful API**: 9 protected endpoints with API key authentication
- **Security**: Helmet.js, CORS, rate limiting, input validation
- **Caching**: Server-side caching with 5-minute TTL
- **Error Handling**: Comprehensive error management
- **Health Checks**: Built-in health monitoring

### Frontend (HTML + CSS + JavaScript)

- **Responsive Design**: Mobile-first approach
- **API Integration**: Authenticated requests to backend
- **Interactive UI**: Real-time search and filtering
- **Error Handling**: User-friendly error messages

### External API Integration

- **TheMealDB API**: Primary data source for recipes
- **Caching Strategy**: Reduces external API calls
- **Error Handling**: Graceful fallback mechanisms

## Security Features

### API Protection

- **API Key Authentication**: All endpoints require valid API key
- **Rate Limiting**: 100 requests per 15-minute window per IP
- **Input Validation**: Query parameter sanitization
- **Security Headers**: Comprehensive CSP and security headers
- **CORS Configuration**: Controlled cross-origin requests

### Container Security

- **Non-root User**: Application runs as nodejs user
- **Minimal Base Image**: Alpine Linux for reduced attack surface
- **Health Checks**: Container health monitoring
- **Secret Management**: Environment variables for sensitive data

## API Endpoints

All endpoints require `X-API-Key` header or `apiKey` query parameter:

- `GET /api/health` - Health check (no auth required)
- `GET /api/recipes/random?count=N` - Get random recipes
- `GET /api/recipes/search?q=query` - Search recipes by name
- `GET /api/recipes/category/:category` - Get recipes by category
- `GET /api/recipes/area/:area` - Get recipes by cuisine/area
- `GET /api/recipes/details/:id` - Get detailed recipe information
- `GET /api/categories` - Get all available categories
- `GET /api/areas` - Get all available cuisines/areas
- `GET /api/recipes/african` - Get featured African recipes

### Example Usage

```bash
curl -H "X-API-Key: secure-api-key-2024" \
  "http://localhost:8080/api/recipes/search?q=chicken"
```

## esting

### API Testing

```javascript
// Load test suite in browser console
testAllAPIs()
testMealDetails('52874')
performanceTest()
```

### Load Balancer Testing

```javascript
testLoadBalancer(20)
```

### Docker Testing

```bash
# Test with docker-compose
npm run compose:up
curl -H "X-API-Key: secure-api-key-2024" http://localhost/api/health
npm run compose:down
```

## File Structure

millos-cuisine-explorer/
├── Docker Files
│   ├── Dockerfile              # Container definition
│   ├── .dockerignore          # Docker ignore rules
│   ├── docker-compose.yml     # Local testing setup
│   └── healthcheck.js         # Container health check
├── Frontend Files
│   ├── index.html             # Main HTML structure
│   ├── style.css              # Application styling
│   ├── app.js                 # Frontend JavaScript (with auth)
│   └── health.js              # Health check functionality
├── Backend Files
│   ├── server.js              # Express.js server (with security)
│   ├── package.json           # Dependencies and scripts
│   └── test-api.js            # API testing suite
├── Deployment Files
│   ├── haproxy.cfg            # Load balancer configuration
│   ├── deployment.md          # Detailed deployment guide
│   ├── start.bat              # Windows start script
│   └── start.sh               # Unix start script
└── Documentation
    ├── README.md              # This file
    ├── ASSIGNMENT_REQUIREMENTS.md
    └── IMPLEMENTATION_SUMMARY.md

## Technologies Used

### Backend

- **Node.js 18** - Runtime environment
- **Express.js** - Web framework with security middleware
- **Helmet.js** - Security headers
- **Node-cache** - In-memory caching
- **Compression** - Gzip compression

### Frontend

- **HTML5** - Semantic markup
- **CSS3** - Modern responsive design
- **JavaScript ES6+** - Interactive functionality with authentication

### DevOps

- **Docker** - Containerization
- **HAProxy** - Load balancing
- **Docker Hub** - Image registry

### External APIs

- **TheMealDB API** - Recipe data source

## Hardening & Security

### Secret Management

```bash
# Environment variables (not baked into image)
docker run -e API_KEY=$API_KEY millowise01/millos-cuisine:v1

# Docker secrets (production)
echo "secure-api-key-2024" | docker secret create api_key -
```

### Production Considerations

- Use Docker secrets or external secret management
- Implement HTTPS with SSL certificates
- Set up monitoring and logging
- Regular security updates
- Database encryption at rest

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **TheMealDB API** - For providing comprehensive recipe data
- **Docker Community** - For containerization tools
- **HAProxy** - For load balancing capabilities

## Support

If you encounter any issues:

1. Check container logs: `docker logs <container-name>`
2. Verify API key configuration
3. Test endpoints with proper authentication
4. Check load balancer configuration
