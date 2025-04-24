<?php
// API Proxy for Voice Changer
// This file serves as a proxy between the client and the Python API server

// Set headers to allow for cross-origin requests
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// API endpoint base URL
$api_base_url = 'http://localhost:5001';

// Get the requested API path from the request URL
$request_uri = $_SERVER['REQUEST_URI'];

// Extract the API path that comes after "api/"
if (preg_match('/\/api\/(.*)/', $request_uri, $matches)) {
    $api_path = $matches[1];
    
    // Construct the full URL to the Python API endpoint
    $url = $api_base_url . '/api/' . $api_path;
    
    // Initialize cURL
    $ch = curl_init();
    
    // Set cURL options
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    // Handle POST requests
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        
        // Get the raw POST data
        $post_data = file_get_contents('php://input');
        
        // Set the POST data
        curl_setopt($ch, CURLOPT_POSTFIELDS, $post_data);
        
        // Set the content type header
        curl_setopt($ch, CURLOPT_HTTPHEADER, array(
            'Content-Type: application/json',
            'Content-Length: ' . strlen($post_data)
        ));
    }
    
    // Execute the cURL request
    $response = curl_exec($ch);
    
    // Get the HTTP status code
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    // Close cURL
    curl_close($ch);
    
    // Set the HTTP status code
    http_response_code($http_code);
    
    // Return the response
    echo $response;
} else {
    // Invalid API path
    http_response_code(404);
    echo json_encode(array('error' => 'Invalid API path'));
}
?>