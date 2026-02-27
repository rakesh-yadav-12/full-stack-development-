<?php
// test.php - Run this to debug folder detection
echo "<h2>Debugging Folder Detection</h2>";

$songsDir = 'songs/';

echo "<h3>Checking if songs directory exists:</h3>";
if (is_dir($songsDir)) {
    echo "✅ Songs directory exists: " . realpath($songsDir) . "<br>";
} else {
    echo "❌ Songs directory NOT found!<br>";
    echo "Current directory: " . __DIR__ . "<br>";
    echo "Tried to find: " . realpath($songsDir) . "<br>";
    exit;
}

echo "<h3>Contents of songs directory:</h3>";
$items = scandir($songsDir);
echo "<ul>";
foreach ($items as $item) {
    if ($item === '.' || $item === '..') continue;
    $itemPath = $songsDir . $item;
    $type = is_dir($itemPath) ? "📁 FOLDER" : "📄 FILE";
    echo "<li>$type: $item</li>";
    
    // If it's a folder, check for MP3 files
    if (is_dir($itemPath)) {
        $subItems = scandir($itemPath);
        $mp3Count = 0;
        foreach ($subItems as $subItem) {
            if ($subItem === '.' || $subItem === '..') continue;
            if (pathinfo($subItem, PATHINFO_EXTENSION) === 'mp3') {
                $mp3Count++;
            }
        }
        echo "<ul><li>Contains $mp3Count MP3 files</li></ul>";
    }
}
echo "</ul>";

echo "<h3>Testing get-folders.php:</h3>";
$folders = [];
foreach ($items as $item) {
    if ($item === '.' || $item === '..') continue;
    if (is_dir($songsDir . $item)) {
        $folders[] = $item;
    }
}
echo "Found folders: " . implode(', ', $folders) . "<br>";
echo "Total folders: " . count($folders) . "<br>";

echo "<h3>File Permissions:</h3>";
echo "Songs directory permissions: " . substr(sprintf('%o', fileperms($songsDir)), -4) . "<br>";
echo "Recommended: 755 or 777<br>";

// Check if web server can read files
echo "<h3>Read Test:</h3>";
if (is_readable($songsDir)) {
    echo "✅ Songs directory is readable<br>";
} else {
    echo "❌ Songs directory is NOT readable!<br>";
}
?>