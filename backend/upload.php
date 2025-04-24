<?php
/**
 * Handle custom voice uploads
 * Saves the audio file and metadata
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

// Define upload directory
$uploadDir = __DIR__ . '/../uploads/';

// Create directory if it doesn't exist
if (!file_exists($uploadDir)) {
    if (!mkdir($uploadDir, 0755, true)) {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to create upload directory'
        ]);
        exit;
    }
}

// Define voices metadata file
$voicesFile = __DIR__ . '/../data/voices.json';

// Create data directory if it doesn't exist
if (!file_exists(__DIR__ . '/../data/')) {
    if (!mkdir(__DIR__ . '/../data/', 0755, true)) {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to create data directory'
        ]);
        exit;
    }
}

// Initialize voices array
$voices = [];

// Load existing voices if file exists
if (file_exists($voicesFile)) {
    $voicesJson = file_get_contents($voicesFile);
    if ($voicesJson) {
        $voices = json_decode($voicesJson, true);
        
        // If json_decode fails, initialize as empty array
        if ($voices === null) {
            $voices = [];
        }
    }
}

// Check if all required fields are present
if (!isset($_POST['voiceName']) || empty($_POST['voiceName']) ||
    !isset($_POST['accentType']) || empty($_POST['accentType']) ||
    !isset($_FILES['voiceFile']) || $_FILES['voiceFile']['error'] !== UPLOAD_ERR_OK) {
    
    $errorMessage = 'Missing required fields';
    
    // Add more specific error if it's a file upload error
    if (isset($_FILES['voiceFile']) && $_FILES['voiceFile']['error'] !== UPLOAD_ERR_OK) {
        $uploadErrors = [
            UPLOAD_ERR_INI_SIZE => 'The uploaded file exceeds the upload_max_filesize directive in php.ini',
            UPLOAD_ERR_FORM_SIZE => 'The uploaded file exceeds the MAX_FILE_SIZE directive that was specified in the HTML form',
            UPLOAD_ERR_PARTIAL => 'The uploaded file was only partially uploaded',
            UPLOAD_ERR_NO_FILE => 'No file was uploaded',
            UPLOAD_ERR_NO_TMP_DIR => 'Missing a temporary folder',
            UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
            UPLOAD_ERR_EXTENSION => 'A PHP extension stopped the file upload'
        ];
        $errorMessage = $uploadErrors[$_FILES['voiceFile']['error']] ?? 'Unknown upload error';
    }
    
    echo json_encode([
        'success' => false,
        'message' => $errorMessage
    ]);
    exit;
}

// Get file details
$file = $_FILES['voiceFile'];
$fileName = $file['name'];
$fileTmpPath = $file['tmp_name'];
$fileSize = $file['size'];
$fileType = $file['type'];

// Check file type (allow only audio files)
$allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'];
if (!in_array($fileType, $allowedTypes)) {
    echo json_encode([
        'success' => false,
        'message' => 'Only audio files are allowed (MP3, WAV, OGG, WEBM)'
    ]);
    exit;
}

// Check file size (max 10MB)
$maxFileSize = 10 * 1024 * 1024; // 10MB in bytes
if ($fileSize > $maxFileSize) {
    echo json_encode([
        'success' => false,
        'message' => 'File is too large. Maximum size is 10MB'
    ]);
    exit;
}

// Generate unique filename to avoid overwriting
$fileExtension = pathinfo($fileName, PATHINFO_EXTENSION);
$uniqueId = uniqid();
$newFileName = $uniqueId . '.' . $fileExtension;
$uploadFilePath = $uploadDir . $newFileName;

// Move uploaded file
if (!move_uploaded_file($fileTmpPath, $uploadFilePath)) {
    echo json_encode([
        'success' => false,
        'message' => 'Failed to save the uploaded file'
    ]);
    exit;
}

// Create voice metadata
$voiceName = htmlspecialchars(strip_tags($_POST['voiceName']));
$accentType = htmlspecialchars(strip_tags($_POST['accentType']));

$newVoice = [
    'id' => $uniqueId,
    'name' => $voiceName,
    'accent' => $accentType,
    'file' => 'uploads/' . $newFileName,
    'parameters' => [
        'pitch' => 0,
        'formant' => 0,
        'effect' => 'none'
    ]
];

// Add to voices array
$voices[] = $newVoice;

// Save voices metadata
if (!file_put_contents($voicesFile, json_encode($voices, JSON_PRETTY_PRINT))) {
    // If saving metadata fails, delete the uploaded file
    unlink($uploadFilePath);
    
    echo json_encode([
        'success' => false,
        'message' => 'Failed to save voice metadata'
    ]);
    exit;
}

// Return success response
echo json_encode([
    'success' => true,
    'message' => 'Voice uploaded successfully',
    'voice' => $newVoice
]);
