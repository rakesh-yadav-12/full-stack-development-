<?php
// get-folders.php - Fixed version to properly detect folders
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

$songsDir = 'songs/';
$folders = [];

// Check if songs directory exists
if (!is_dir($songsDir)) {
    echo json_encode(['error' => 'Songs directory not found', 'folders' => []]);
    exit;
}

// Get all items in the songs directory
$items = scandir($songsDir);

foreach ($items as $item) {
    // Skip . and ..
    if ($item === '.' || $item === '..') continue;
    
    $itemPath = $songsDir . $item;
    
    // Check if it's a directory
    if (is_dir($itemPath)) {
        // Check if directory contains any MP3 files
        $files = scandir($itemPath);
        $hasMp3 = false;
        
        foreach ($files as $file) {
            if (pathinfo($file, PATHINFO_EXTENSION) === 'mp3') {
                $hasMp3 = true;
                break;
            }
        }
        
        // Only add folders that have MP3 files (optional)
        // if ($hasMp3) {
            $folders[] = $item;
        // }
    }
}

// If no folders found with MP3, still return all folders
if (empty($folders)) {
    // Return all directories even if no MP3 found
    foreach ($items as $item) {
        if ($item === '.' || $item === '..') continue;
        if (is_dir($songsDir . $item)) {
            $folders[] = $item;
        }
    }
}

echo json_encode([
    'folders' => $folders,
    'count' => count($folders),
    'songsDir' => realpath($songsDir)
]);
?>