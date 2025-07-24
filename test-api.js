// API Testing Script for Millo's Cuisine Explorer
// Run this in the browser console to test all API endpoints

const API_BASE = '/api';

async function testAllAPIs() {
    console.log('🧪 Starting API Tests...\n');
    
    const tests = [
        {
            name: 'Health Check',
            url: `${API_BASE}/health`,
            expected: 'status: healthy'
        },
        {
            name: 'Random Recipes',
            url: `${API_BASE}/recipes/random?count=2`,
            expected: 'meals array with 2 items'
        },
        {
            name: 'Search Recipes',
            url: `${API_BASE}/recipes/search?q=chicken`,
            expected: 'meals array with chicken recipes'
        },
        {
            name: 'Category - Vegetarian',
            url: `${API_BASE}/recipes/category/Vegetarian`,
            expected: 'vegetarian meals'
        },
        {
            name: 'Area - Italian',
            url: `${API_BASE}/recipes/area/Italian`,
            expected: 'Italian meals'
        },
        {
            name: 'African Recipes',
            url: `${API_BASE}/recipes/african`,
            expected: 'African meals'
        },
        {
            name: 'All Categories',
            url: `${API_BASE}/categories`,
            expected: 'categories array'
        },
        {
            name: 'All Areas',
            url: `${API_BASE}/areas`,
            expected: 'areas array'
        }
    ];
    
    const results = [];
    
    for (const test of tests) {
        try {
            console.log(`Testing: ${test.name}...`);
            const response = await fetch(test.url);
            const data = await response.json();
            
            if (data.success !== false) {
                console.log(`✅ ${test.name}: PASSED`);
                results.push({ test: test.name, status: 'PASSED', data: data });
            } else {
                console.log(`❌ ${test.name}: FAILED - ${data.error}`);
                results.push({ test: test.name, status: 'FAILED', error: data.error });
            }
        } catch (error) {
            console.log(`❌ ${test.name}: ERROR - ${error.message}`);
            results.push({ test: test.name, status: 'ERROR', error: error.message });
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n📊 Test Summary:');
    const passed = results.filter(r => r.status === 'PASSED').length;
    const failed = results.filter(r => r.status === 'FAILED').length;
    const errors = results.filter(r => r.status === 'ERROR').length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Errors: ${errors}`);
    
    return results;
}

// Test a specific meal details endpoint
async function testMealDetails(mealId = '52874') {
    console.log(`🍽️  Testing meal details for ID: ${mealId}`);
    
    try {
        const response = await fetch(`${API_BASE}/recipes/details/${mealId}`);
        const data = await response.json();
        
        if (data.success && data.meal) {
            console.log(`✅ Meal Details: ${data.meal.strMeal}`);
            console.log(`📝 Instructions length: ${data.meal.strInstructions.length} characters`);
            return data.meal;
        } else {
            console.log(`❌ Meal Details Failed: ${data.error}`);
            return null;
        }
    } catch (error) {
        console.log(`❌ Meal Details Error: ${error.message}`);
        return null;
    }
}

// Performance test
async function performanceTest() {
    console.log('⚡ Running Performance Test...');
    
    const start = performance.now();
    const promises = [];
    
    // Make 5 concurrent requests
    for (let i = 0; i < 5; i++) {
        promises.push(fetch(`${API_BASE}/recipes/random?count=1`));
    }
    
    try {
        const responses = await Promise.all(promises);
        const end = performance.now();
        
        console.log(`⚡ Performance Test: ${responses.length} concurrent requests completed in ${(end - start).toFixed(2)}ms`);
        
        // Check if all responses are successful
        const successful = responses.filter(r => r.ok).length;
        console.log(`✅ Successful responses: ${successful}/${responses.length}`);
        
    } catch (error) {
        console.log(`❌ Performance Test Error: ${error.message}`);
    }
}

// Run all tests
console.log('🚀 Millo\'s Cuisine Explorer API Test Suite');
console.log('==========================================');

// Export functions for manual testing
window.testAllAPIs = testAllAPIs;
window.testMealDetails = testMealDetails;
window.performanceTest = performanceTest;

// Auto-run basic tests if this script is loaded
if (typeof window !== 'undefined') {
    console.log('💡 Available test functions:');
    console.log('- testAllAPIs() - Test all API endpoints');
    console.log('- testMealDetails(mealId) - Test specific meal details');
    console.log('- performanceTest() - Test API performance');
    console.log('\nRun testAllAPIs() to start testing!');
}