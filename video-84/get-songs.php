<?php
// get-songs.php - Fixed version to properly detect MP3 files
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

$folder = isset($_GET['folder']) ? $_GET['folder'] : '';

if (empty($folder)) {
    echo json_encode(['error' => 'No folder specified', 'songs' => []]);
    exit;
}

// Sanitize folder path to prevent directory traversal
$folder = str_replace(['..', './', '../', '\\'], '', $folder);
$folderPath = 'songs/' . $folder;

if (!is_dir($folderPath)) {
    echo json_encode(['error' => 'Folder not found: ' . $folder, 'songs' => []]);
    exit;
}

// Get all files in the directory
$files = scandir($folderPath);
$songs = [];

foreach ($files as $file) {
    $filePath = $folderPath . '/' . $file;
    
    // Check if it's a file and has .mp3 extension (case insensitive)
    if (is_file($filePath)) {
        $extension = strtolower(pathinfo($file, PATHINFO_EXTENSION));
        if ($extension === 'mp3') {
            $songs[] = $file;
        }
    }
}

// Sort songs alphabetically
sort($songs);

echo json_encode([
    'songs' => $songs,
    'count' => count($songs),
    'folder' => $folder,
    'path' => realpath($folderPath)
]);
?>