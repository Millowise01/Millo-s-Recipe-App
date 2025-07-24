const express = require('express');
const cors = require('cors');
const axios = require('axios');
const NodeCache = require('node-cache');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Cache with 5 minutes TTL
const cache = new NodeCache({ stdTTL: 300 });

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

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
        uptime: process.uptime()
    });
});

// Get random recipes for home page
app.get('/api/recipes/random', async (req, res) => {
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
app.get('/api/recipes/search', async (req, res) => {
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
app.get('/api/recipes/category/:category', async (req, res) => {
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
app.get('/api/recipes/area/:area', async (req, res) => {
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
app.get('/api/recipes/details/:id', async (req, res) => {
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
app.get('/api/categories', async (req, res) => {
    try {
        const cacheKey = 'all_categories';
        const data = await fetchWithCache(`${MEAL_API_BASE}/categories.php`, cacheKey);
        
        res.json({ categories: data.categories || [], success: true });
    } catch (error) {
        res.status(500).json({ error: error.message, success: false });
    }
});

// Get all areas/cuisines
app.get('/api/areas', async (req, res) => {
    try {
        const cacheKey = 'all_areas';
        const data = await fetchWithCache(`${MEAL_API_BASE}/list.php?a=list`, cacheKey);
        
        res.json({ areas: data.meals || [], success: true });
    } catch (error) {
        res.status(500).json({ error: error.message, success: false });
    }
});

// Get featured African recipes
app.get('/api/recipes/african', async (req, res) => {
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