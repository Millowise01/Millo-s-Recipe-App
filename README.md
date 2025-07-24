# Millo's Cuisine Explorer

A full-stack web application for discovering and exploring authentic recipes from various African and intercontinental cuisines. Built with Node.js, Express.js, and vanilla JavaScript.

## Purpose

This application serves a practical purpose by helping users discover authentic recipes, explore different cuisines, and find meal inspiration. It addresses the real need for accessible, searchable recipe discovery with comprehensive filtering and sorting capabilities.

## Features

- **Recipe Search**: Real-time search by recipe name
- **Cuisine Filtering**: Browse recipes by African regions and international cuisines
- **Category Filtering**: Filter by food categories (Vegetarian, Seafood, Chicken, etc.)
- **Recipe Sorting**: Alphabetical sorting options (A-Z, Z-A)
- **Detailed Views**: Complete recipe information with ingredients and instructions
- **Popular Recipes**: Featured recipes on the home page
- **Responsive Design**: Works on all devices and screen sizes

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)

### Installation & Setup

1. **Clone the repository**:

```bash
git clone https://github.com/Millowise01/Millo-s-Recipe-App.git
cd millos-cuisine-explorer
```

**Install dependencies**:

```bash
npm install
```

**Start the server**:

```bash
npm start
```

**Access the application**:

Open your browser and navigate to `http://localhost:3000`

### Quick Start Scripts

**Windows:**

```cmd
start.bat
```

**Linux/Mac:**

```bash
chmod +x start.sh
./start.sh
```

## Architecture

### Backend (Node.js + Express.js)

- RESTful API with 9 endpoints
- Server-side caching for performance
- Comprehensive error handling
- Security headers and CORS configuration

### Frontend (HTML + CSS + JavaScript)

- Responsive, modern UI design
- Dynamic content loading
- Interactive user interface
- Real-time search and filtering

### External API Integration

- **TheMealDB API**: Primary data source for recipes

- **Caching Strategy**: 5-minute TTL to optimize performance
- **Error Handling**: Graceful fallback for API issues

## 📡 API Endpoints

- `GET /api/health` - Health check for load balancer
- `GET /api/recipes/random?count=N` - Get random recipes
- `GET /api/recipes/search?q=query` - Search recipes by name
- `GET /api/recipes/category/:category` - Get recipes by category
- `GET /api/recipes/area/:area` - Get recipes by cuisine/area
- `GET /api/recipes/details/:id` - Get detailed recipe information
- `GET /api/categories` - Get all available categories
- `GET /api/areas` - Get all available cuisines/areas
- `GET /api/recipes/african` - Get featured African recipes

## 🧪 Testing

### API Testing

Load the test suite in your browser console:

```javascript
// Test all API endpoints
testAllAPIs()

// Test specific meal details
testMealDetails('52874')

// Performance testing
performanceTest()
```

### Load Balancer Testing

After deployment, test load balancing:

```javascript
testLoadBalancer(20)
```

## 🚀 Deployment

### Local Development

```bash
npm run dev  # Start with nodemon for development
```

### Production Deployment

#### Web Servers (Web01 & Web02)

1. **Install Node.js**:

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
npm install
```

**Create systemd service**:

```bash
sudo nano /etc/systemd/system/millos-cuisine.service
```

```ini
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
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

**Start service**:

```bash
sudo systemctl daemon-reload
sudo systemctl enable millos-cuisine
sudo systemctl start millos-cuisine
```

**Configure Nginx reverse proxy**:

```bash
sudo nano /etc/nginx/sites-available/millos-cuisine
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/millos-cuisine /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Load Balancer (Lb01)

```bash
sudo nano /etc/nginx/sites-available/millos-cuisine-lb
```

```nginx
upstream millos_backend {
    server web01-ip:80;
    server web02-ip:80;
    keepalive 32;
}

server {
    listen 80;
    server_name your-load-balancer-domain.com;

    location / {
        proxy_pass http://millos_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

For detailed deployment instructions, see [deployment.md](deployment.md).

## File Structure

millos-cuisine-explorer/
├── Frontend Files
│   ├── index.html              # Main HTML structure
│   ├── style.css               # Application styling
│   ├── app.js                  # Frontend JavaScript
│   └── health.js               # Health check functionality
├── Backend Files
│   ├── server.js               # Express.js server
│   ├── package.json            # Dependencies and scripts
│   └── test-api.js             # API testing suite
├── Deployment Files
│   ├── deployment.md           # Detailed deployment guide
│   ├── start.bat              # Windows start script
│   └── start.sh               # Unix start script
├── Documentation
│   ├── README.md              # This file
│   ├── ASSIGNMENT_REQUIREMENTS.md
│   └── IMPLEMENTATION_SUMMARY.md
└── Assets
    └── images/                # Application images

## 🔧 Technologies Used

### Backend

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Axios** - HTTP client for API requests
- **Node-cache** - In-memory caching
- **Helmet.js** - Security middleware
- **CORS** - Cross-origin resource sharing

### Frontend

- **HTML5** - Semantic markup
- **CSS3** - Modern styling with Grid and Flexbox
- **JavaScript (ES6+)** - Interactive functionality
- **Fetch API** - HTTP requests

### External APIs

- **TheMealDB API** - Recipe data source

## Security Features

- **Helmet.js**: Security headers
- **Input Validation**: Query parameter sanitization
- **Error Handling**: No sensitive information exposure
- **CORS Configuration**: Controlled cross-origin requests
- **No API Keys**: Uses public API, no sensitive data

## Performance Optimizations

- **Server-side Caching**: 5-minute TTL for API responses
- **Gzip Compression**: Reduced payload sizes
- **Lazy Loading**: Images loaded on demand
- **Efficient DOM Manipulation**: Minimal reflows and repaints

## Error Handling

- **API Downtime**: Graceful fallback messages
- **Network Issues**: User-friendly error notifications
- **Invalid Responses**: Proper error parsing and display
- **Loading States**: Visual feedback during operations

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
- **Font Awesome** - For icons (if used)
- **Google Fonts** - For Poppins font family

## Support

If you encounter any issues or have questions:

1. Check the [deployment guide](deployment.md)
2. Run the API test suite: `testAllAPIs()`
3. Check server logs: `sudo journalctl -u millos-cuisine -f`
4. Verify load balancer: `testLoadBalancer(10)`
