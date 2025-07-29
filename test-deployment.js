#!/usr/bin/env node

const http = require('http');
const https = require('https');

const API_KEY = 'secure-api-key-2024';
const BASE_URL = process.env.TEST_URL || 'http://localhost:8080';

// Test configuration
const tests = [
    {
        name: 'Health Check',
        path: '/api/health',
        method: 'GET',
        requiresAuth: false
    },
    {
        name: 'Random Recipes',
        path: '/api/recipes/random?count=2',
        method: 'GET',
        requiresAuth: true
    },
    {
        name: 'Search Recipes',
        path: '/api/recipes/search?q=chicken',
        method: 'GET',
        requiresAuth: true
    },
    {
        name: 'Recipes by Area',
        path: '/api/recipes/area/Italian',
        method: 'GET',
        requiresAuth: true
    },
    {
        name: 'Categories',
        path: '/api/categories',
        method: 'GET',
        requiresAuth: true
    },
    {
        name: 'Home Page',
        path: '/',
        method: 'GET',
        requiresAuth: false,
        expectHtml: true
    }
];

function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const isHttps = url.startsWith('https');
        const client = isHttps ? https : http;
        
        const req = client.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    data: data
                });
            });
        });
        
        req.on('error', reject);
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        
        req.end();
    });
}

async function runTest(test) {
    const url = `${BASE_URL}${test.path}`;
    const options = {
        method: test.method,
        headers: {}
    };
    
    if (test.requiresAuth) {
        options.headers['X-API-Key'] = API_KEY;
    }
    
    try {
        console.log(`Testing: ${test.name}`);
        console.log(`URL: ${url}`);
        
        const response = await makeRequest(url, options);
        
        console.log(`Status: ${response.statusCode}`);
        
        if (response.statusCode === 200) {
            if (test.expectHtml) {
                if (response.data.includes('<title>Millo\'s Cuisine Explorer</title>')) {
                    console.log('✅ HTML page loaded successfully');
                } else {
                    console.log('❌ HTML page missing expected content');
                }
            } else {
                try {
                    const jsonData = JSON.parse(response.data);
                    if (jsonData.success !== false) {
                        console.log('✅ API response successful');
                        if (jsonData.meals) {
                            console.log(`   Found ${jsonData.meals.length} meals`);
                        }
                    } else {
                        console.log('❌ API returned error:', jsonData.error);
                    }
                } catch (e) {
                    console.log('✅ Non-JSON response (likely health check)');
                }
            }
        } else {
            console.log(`❌ HTTP ${response.statusCode}`);
        }
        
        console.log('---');
        return response.statusCode === 200;
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        console.log('---');
        return false;
    }
}

async function testLoadBalancer() {
    console.log('\\n🔄 Testing Load Balancer (if available)...');
    
    const lbUrl = process.env.LB_URL || 'http://localhost';
    const healthUrl = `${lbUrl}/api/health`;
    
    try {
        const responses = [];
        for (let i = 0; i < 6; i++) {
            const response = await makeRequest(healthUrl, {
                headers: { 'X-API-Key': API_KEY }
            });
            
            if (response.statusCode === 200) {
                try {
                    const data = JSON.parse(response.data);
                    responses.push(data.server || 'unknown');
                } catch (e) {
                    responses.push('unknown');
                }
            }
        }
        
        const uniqueServers = [...new Set(responses)];
        console.log(`Responses from servers: ${responses.join(', ')}`);
        console.log(`Unique servers: ${uniqueServers.length}`);
        
        if (uniqueServers.length > 1) {
            console.log('✅ Load balancing working - multiple servers responding');
        } else if (uniqueServers.length === 1 && uniqueServers[0] !== 'unknown') {
            console.log('⚠️  Only one server responding (may be expected)');
        } else {
            console.log('❌ Load balancer test inconclusive');
        }
    } catch (error) {
        console.log(`❌ Load balancer test failed: ${error.message}`);
    }
}

async function main() {
    console.log('🚀 Starting Millo\\'s Cuisine Explorer Deployment Test\\n');
    console.log(`Testing against: ${BASE_URL}\\n`);
    
    let passedTests = 0;
    
    for (const test of tests) {
        const passed = await runTest(test);
        if (passed) passedTests++;
    }
    
    await testLoadBalancer();
    
    console.log('\\n📊 Test Summary:');
    console.log(`Passed: ${passedTests}/${tests.length} tests`);
    
    if (passedTests === tests.length) {
        console.log('🎉 All tests passed! Application is ready for deployment.');
        process.exit(0);
    } else {
        console.log('❌ Some tests failed. Please check the application configuration.');
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { runTest, testLoadBalancer };