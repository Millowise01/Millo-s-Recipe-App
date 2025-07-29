const express = require('express');
const cors = require('cors');
const axios = require('axios');
const NodeCache = require('node-cache');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;
const API_KEY = process.env.API_KEY || 'default-key';
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 100; // requests per window

// Cache with 5 minutes TTL
const cache = new NodeCache({ stdTTL: 300 });

// Rate limiting store
const rateLimitStore = new Map();

// Rate limiting middleware
function rateLimit(req, res, next) {
    const clientIP = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!rateLimitStore.has(clientIP)) {
        rateLimitStore.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return next();
    }
    
    const clientData = rateLimitStore.get(clientIP);
    
    if (now > clientData.resetTime) {
        rateLimitStore.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return next();
    }
    
    if (clientData.count >= RATE_LIMIT_MAX) {
        return res.status(429).json({ 
            error: 'Too many requests', 
            success: false,
            retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
        });
    }
    
    clientData.count++;
    next();
}

// API Key validation middleware
function validateApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    
    if (!apiKey || apiKey !== API_KEY) {
        return res.status(401).json({ 
            error: 'Invalid or missing API key', 
            success: false 
        });
    }
    
    next();
}

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            scriptSrc: ["'self'"]
        }
    }
}));
app.use(compression());
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));
app.use(rateLimit);

// TheMealDB API base URL
const MEAL_API_BASE = 'https://www.themealdb.com/api/json/v1/1';

// Helper function to make API requests with caching
async function fetchWithCache(url, cacheKey) {
    // Check cache first
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
        console.log(`Cache hit for: ${cacheKey}`);
        return cachedData;
    }

    try {
        const response = await axios.get(url, { timeout: 10000 });
        const data = response.data;
        
        // Cache the response
        cache.set(cacheKey, data);
        console.log(`Cache set for: ${cacheKey}`);
        
        return data;
    } catch (error) {
        console.error(`API Error for ${url}:`, error.message);
        throw new Error(`Failed to fetch data: ${error.message}`);
    }
}

// Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        server: process.env.SERVER_NAME || 'unknown',
        serverIP: process.env.SERVER_IP || 'unknown',
        port: PORT,
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
    });
});

// Get random recipes for home page
app.get('/api/recipes/random', validateApiKey, async (req, res) => {
    try {
        const count = parseInt(req.query.count) || 4;
        const promises = [];
        
        for (let i = 0; i < count; i++) {
            promises.push(fetchWithCache(`${MEAL_API_BASE}/random.php`, `random_${Date.now()}_${i}`));
        }
        
        const results = await Promise.all(promises);
        const meals = results.map(result => result.meals[0]).filter(meal => meal);
        
        res.json({ meals, success: true });
    } catch (error) {
        res.status(500).json({ error: error.message, success: false });
    }
});

// Search recipes by name
app.get('/api/recipes/search', validateApiKey, async (req, res) => {
    const { q } = req.query;
    
    if (!q) {
        return res.status(400).json({ error: 'Search query is required', success: false });
    }
    
    try {
        const cacheKey = `search_${q.toLowerCase()}`;
        const data = await fetchWithCache(`${MEAL_API_BASE}/search.php?s=${encodeURIComponent(q)}`, cacheKey);
        
        res.json({ meals: data.meals || [], success: true });
    } catch (error) {
        res.status(500).json({ error: error.message, success: false });
    }
});

// Get recipes by category
app.get('/api/recipes/category/:category', validateApiKey, async (req, res) => {
    const { category } = req.params;
    
    try {
        const cacheKey = `category_${category.toLowerCase()}`;
        const data = await fetchWithCache(`${MEAL_API_BASE}/filter.php?c=${encodeURIComponent(category)}`, cacheKey);
        
        res.json({ meals: data.meals || [], success: true });
    } catch (error) {
        res.status(500).json({ error: error.message, success: false });
    }
});

// Get recipes by area/cuisine
app.get('/api/recipes/area/:area', validateApiKey, async (req, res) => {
    const { area } = req.params;
    
    try {
        const cacheKey = `area_${area.toLowerCase()}`;
        const data = await fetchWithCache(`${MEAL_API_BASE}/filter.php?a=${encodeURIComponent(area)}`, cacheKey);
        
        res.json({ meals: data.meals || [], success: true });
    } catch (error) {
        res.status(500).json({ error: error.message, success: false });
    }
});

// Get meal details by ID
app.get('/api/recipes/details/:id', validateApiKey, async (req, res) => {
    const { id } = req.params;
    
    try {
        const cacheKey = `meal_${id}`;
        const data = await fetchWithCache(`${MEAL_API_BASE}/lookup.php?i=${id}`, cacheKey);
        
        if (!data.meals || data.meals.length === 0) {
            return res.status(404).json({ error: 'Recipe not found', success: false });
        }
        
        res.json({ meal: data.meals[0], success: true });
    } catch (error) {
        res.status(500).json({ error: error.message, success: false });
    }
});

// Get all categories
app.get('/api/categories', validateApiKey, async (req, res) => {
    try {
        const cacheKey = 'all_categories';
        const data = await fetchWithCache(`${MEAL_API_BASE}/categories.php`, cacheKey);
        
        res.json({ categories: data.categories || [], success: true });
    } catch (error) {
        res.status(500).json({ error: error.message, success: false });
    }
});

// Get all areas/cuisines
app.get('/api/areas', validateApiKey, async (req, res) => {
    try {
        const cacheKey = 'all_areas';
        const data = await fetchWithCache(`${MEAL_API_BASE}/list.php?a=list`, cacheKey);
        
        res.json({ areas: data.meals || [], success: true });
    } catch (error) {
        res.status(500).json({ error: error.message, success: false });
    }
});

// Get featured African recipes
app.get('/api/recipes/african', validateApiKey, async (req, res) => {
    try {
        const cacheKey = 'african_recipes';
        
        // Try to get African recipes, fallback to search if not available
        let data;
        try {
            data = await fetchWithCache(`${MEAL_API_BASE}/filter.php?a=African`, cacheKey);
        } catch (error) {
            // Fallback to search for African dishes
            data = await fetchWithCache(`${MEAL_API_BASE}/search.php?s=African`, `${cacheKey}_fallback`);
        }
        
        res.json({ meals: data.meals || [], success: true });
    } catch (error) {
        res.status(500).json({ error: error.message, success: false });
    }
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!', success: false });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found', success: false });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access the application at: http://localhost:${PORT}`);
});

module.exports = app;