<?php
/**
 * Delete a custom voice
 * Removes the audio file and metadata
 */

// Set headers
header('Content-Type: application/json');

// Check if request is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'success' => false,
        'message' => 'Only POST requests are allowed'
    ]);
    exit;
}

// Check if voice ID is provided
if (!isset($_POST['id']) || empty($_POST['id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Voice ID is required'
    ]);
    exit;
}

// Get voice ID
$voiceId = $_POST['id'];

// Define voices metadata file
$voicesFile = __DIR__ . '/../data/voices.json';

// Check if file exists
if (!file_exists($voicesFile)) {
    echo json_encode([
        'success' => false,
        'message' => 'No voices data found'
    ]);
    exit;
}

// Read file
$voicesJson = file_get_contents($voicesFile);

if ($voicesJson === false) {
    echo json_encode([
        'success' => false,
        'message' => 'Failed to read voices data'
    ]);
    exit;
}

// Parse JSON
$voices = json_decode($voicesJson, true);

if ($voices === null) {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid voices data format'
    ]);
    exit;
}

// Find voice by ID
$voiceIndex = -1;
$voiceToDelete = null;

foreach ($voices as $index => $voice) {
    if ($voice['id'] === $voiceId) {
        $voiceIndex = $index;
        $voiceToDelete = $voice;
        break;
    }
}

// Check if voice was found
if ($voiceIndex === -1 || $voiceToDelete === null) {
    echo json_encode([
        'success' => false,
        'message' => 'Voice not found'
    ]);
    exit;
}

// Delete audio file if it exists
if (isset($voiceToDelete['file'])) {
    $filePath = __DIR__ . '/../' . $voiceToDelete['file'];
    if (file_exists($filePath)) {
        if (!unlink($filePath)) {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to delete voice file'
            ]);
            exit;
        }
    }
}

// Remove voice from array
array_splice($voices, $voiceIndex, 1);

// Save updated voices metadata
if (!file_put_contents($voicesFile, json_encode($voices, JSON_PRETTY_PRINT))) {
    echo json_encode([
        'success' => false,
        'message' => 'Failed to update voices data'
    ]);
    exit;
}

// Return success response
echo json_encode([
    'success' => true,
    'message' => 'Voice deleted successfully'
]);
