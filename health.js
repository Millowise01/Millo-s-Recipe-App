// Simple health check endpoint for load balancer
document.addEventListener('DOMContentLoaded', () => {
    // Create a route for health checks
    if (window.location.pathname === '/health') {
        document.body.innerHTML = '';
        
        const healthInfo = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            application: 'Millo\'s Cuisine Explorer'
        };
        
        // Display health information
        const healthDiv = document.createElement('div');
        healthDiv.style.fontFamily = 'monospace';
        healthDiv.style.padding = '20px';
        healthDiv.innerHTML = `
            <h2>Health Check</h2>
            <pre>${JSON.stringify(healthInfo, null, 2)}</pre>
        `;
        
        document.body.appendChild(healthDiv);
    }
});