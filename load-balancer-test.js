// Simple script to test load balancer configuration
// This can be run from a browser console when accessing the site through the load balancer

function testLoadBalancer(numRequests = 10) {
    const results = {
        requests: [],
        summary: {}
    };
    
    console.log(`Starting load balancer test with ${numRequests} requests...`);
    
    // Function to make a single request
    async function makeRequest(index) {
        try {
            const start = performance.now();
            const response = await fetch('/health?' + new Date().getTime());
            const end = performance.now();
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            // Try to extract server info from response
            let serverInfo = null;
            try {
                const text = await response.text();
                const div = document.createElement('div');
                div.innerHTML = text;
                const pre = div.querySelector('pre');
                if (pre) {
                    serverInfo = JSON.parse(pre.textContent);
                }
            } catch (e) {
                console.error('Error parsing server info:', e);
            }
            
            return {
                index,
                success: true,
                time: end - start,
                serverInfo
            };
        } catch (error) {
            return {
                index,
                success: false,
                error: error.message
            };
        }
    }
    
    // Make all requests
    const promises = [];
    for (let i = 0; i < numRequests; i++) {
        promises.push(makeRequest(i + 1));
    }
    
    // Process results
    Promise.all(promises).then(responses => {
        results.requests = responses;
        
        // Calculate summary
        const successful = responses.filter(r => r.success);
        const failed = responses.filter(r => !r.success);
        
        // Count requests per server
        const serverCounts = {};
        successful.forEach(r => {
            if (r.serverInfo && r.serverInfo.application) {
                const server = r.serverInfo.application;
                serverCounts[server] = (serverCounts[server] || 0) + 1;
            }
        });
        
        results.summary = {
            total: numRequests,
            successful: successful.length,
            failed: failed.length,
            averageTime: successful.reduce((sum, r) => sum + r.time, 0) / successful.length,
            serverDistribution: serverCounts
        };
        
        // Log results
        console.log('Load Balancer Test Results:', results);
        console.log(`Success Rate: ${(results.summary.successful / results.summary.total * 100).toFixed(2)}%`);
        console.log(`Average Response Time: ${results.summary.averageTime.toFixed(2)}ms`);
        console.log('Server Distribution:', results.summary.serverDistribution);
    });
}

// Example usage:
// testLoadBalancer(20);