<?php
// Simple health check endpoint for load balancer
header('Content-Type: application/json');

// Get server information
$serverInfo = [
    'status' => 'healthy',
    'timestamp' => date('Y-m-d H:i:s'),
    'server' => $_SERVER['SERVER_NAME'] ?? 'unknown',
    'ip' => $_SERVER['SERVER_ADDR'] ?? 'unknown'
];

// Return JSON response
echo json_encode($serverInfo);
?>