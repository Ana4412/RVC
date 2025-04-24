<?php
/**
 * Get all custom voices
 * Returns a JSON array of voice metadata
 */

// Set headers
header('Content-Type: application/json');

// Define voices metadata file
$voicesFile = __DIR__ . '/../data/voices.json';

// Check if file exists
if (!file_exists($voicesFile)) {
    // Return empty array if file doesn't exist
    echo json_encode([]);
    exit;
}

// Read file
$voicesJson = file_get_contents($voicesFile);

if ($voicesJson === false) {
    // Return error if file cannot be read
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to read voices data'
    ]);
    exit;
}

// Parse JSON
$voices = json_decode($voicesJson, true);

if ($voices === null) {
    // Return error if JSON is invalid
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid voices data format'
    ]);
    exit;
}

// Return voices array
echo json_encode($voices);
