let currFolder = "songs/cs"; // Define globally with default
let currentAudio = null; // Track current audio globally
let currentlySelectedFolder = null; // Track currently selected folder
let currentlyPlayingFolder = null; // Track which folder's song is currently playing
let currentlyPlayingSong = null; // Track currently playing song name

async function getSongs(folder) {
    try {
        currFolder = folder; // Update the global variable
        let a = await fetch(`http://127.0.0.1:154/${currFolder}/`);
        let response = await a.text();

        let div = document.createElement("div");
        div.innerHTML = response;

        let as = div.getElementsByTagName("a");
        let songs = [];
        
        for (let index = 0; index < as.length; index++) {
            const element = as[index];
            if (element.href && element.href.endsWith(".mp3")) {
                let fullPath = decodeURIComponent(element.href);
                
                // Extract just the filename
                let songName = fullPath.split('/').pop().split('\\').pop();
                
                // Remove any folder prefix if present
                songName = songName.replace(new RegExp(`^${currFolder.split('/').pop()}[\\\\/]?`), '');
                
                songs.push(songName);
            }
        }
        return songs;
    } catch (error) {
        console.error("Error fetching songs:", error);
        return [];
    }
}

// Function to extract artist from filename
function extractArtistFromFilename(filename) {
    // Remove file extension and replace %20 with spaces
    let cleanName = filename.replace(/\.mp3$/i, "").replace(/%20/g, " ");
    
    // Common patterns for artist extraction
    let artist = "Unknown Artist";
    
    // Pattern 1: "Song Name - Artist Name" or "Artist Name - Song Name"
    if (cleanName.includes(" - ")) {
        let parts = cleanName.split(" - ");
        
        if (parts.length >= 2) {
            // Try to determine which part is the artist
            // Usually artist names are shorter or in specific format
            let part1 = parts[0].trim();
            let part2 = parts[1].trim();
            
            // Check if part1 looks like an artist (all caps, has featuring, etc.)
            if (part1.includes("&") || part1.includes("feat") || part1 === part1.toUpperCase() || part1.length < 20) {
                artist = part1;
            } 
            // Check if part2 looks like an artist
            else if (part2.includes("&") || part2.includes("feat") || part2 === part2.toUpperCase() || part2.length < 20) {
                artist = part2;
            }
            // Default to second part
            else {
                artist = part2;
            }
        }
    }
    
    // Pattern 2: "Song Name (feat. Artist)" or "Song Name ft. Artist"
    else if (cleanName.includes("(feat.") || cleanName.includes(" ft. ")) {
        let match = cleanName.match(/\(feat\.\s*([^)]+)\)/i) || cleanName.match(/ft\.\s*([^-]+)/i);
        if (match) {
            artist = match[1].trim();
        } else {
            // Try to extract from common patterns
            let featIndex = cleanName.toLowerCase().indexOf("feat");
            if (featIndex > 0) {
                artist = cleanName.substring(featIndex + 4).replace(/[\(\)]/g, '').trim();
            }
        }
    }
    
    // Pattern 3: "Artist - Song Name" (when dash exists but pattern 1 didn't catch)
    else if (cleanName.includes(" - ")) {
        let parts = cleanName.split(" - ");
        if (parts.length >= 2) {
            artist = parts[0].trim();
        }
    }
    
    // Pattern 4: If filename has underscores, try to parse
    else if (cleanName.includes("_")) {
        let parts = cleanName.split("_");
        if (parts.length >= 2) {
            // Could be "Artist_Song" or "Song_Artist"
            // Check if first part looks like an artist
            if (parts[0].length < 20 && !parts[0].includes(" ")) {
                artist = parts[0].trim();
            } else {
                artist = parts[1].trim();
            }
        }
    }
    
    // Pattern 5: Look for featuring artists in brackets
    let bracketMatch = cleanName.match(/\[([^\]]+)\]/);
    if (bracketMatch && !artist) {
        artist = bracketMatch[1].trim();
    }
    
    return artist || "Unknown Artist";
}

// Function to fetch song metadata if available
async function fetchSongMetadata(folder, songName) {
    try {
        // Try to fetch metadata.json from the folder
        let metadataResponse = await fetch(`http://127.0.0.1:154/${folder}/metadata.json`);
        if (metadataResponse.ok) {
            let metadata = await metadataResponse.json();
            // Remove .mp3 extension for matching
            let songKey = songName.replace(/\.mp3$/i, '');
            return metadata[songKey] || metadata[songName] || null;
        }
    } catch (error) {
        console.log("No metadata.json found, using filename parsing");
    }
    return null;
}

// Function to update currently playing song display on folder card
function updateCurrentSongOnCard(folderName, songName) {
    const folderCard = document.querySelector(`.card[data-folder="${folderName}"]`);
    if (!folderCard) return;
    
    // Check if song display element exists, if not create it
    let songDisplay = folderCard.querySelector('.currently-playing-song');
    if (!songDisplay) {
        songDisplay = document.createElement('div');
        songDisplay.className = 'currently-playing-song';
        folderCard.appendChild(songDisplay);
    }
    
    if (songName) {
        let displayName = formatSongName(songName, 20); // Shorter format for card
        songDisplay.innerHTML = `
            <span class="now-playing-indicator">🎵</span>
            <span class="song-name" title="${displayName}">${displayName}</span>
        `;
        songDisplay.classList.add('active');
    } else {
        songDisplay.innerHTML = '';
        songDisplay.classList.remove('active');
    }
}

// Function to update folder card play button based on playing state
function updateFolderPlayButton(folderName, isPlaying = false, songName = null) {
    const folderCard = document.querySelector(`.card[data-folder="${folderName}"]`);
    if (!folderCard) return;
    
    const playButton = folderCard.querySelector('.play');
    if (!playButton) return;
    
    if (isPlaying) {
        // Change to pause button
        playButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="35" height="35" color="currentColor" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="6" y="4" width="4" height="16" fill="black" stroke="none" />
                <rect x="14" y="4" width="4" height="16" fill="black" stroke="none" />
            </svg>
        `;
        playButton.classList.add('playing');
        playButton.setAttribute('data-state', 'pause');
        
        // Update the currently playing song on card
        if (songName) {
            updateCurrentSongOnCard(folderName, songName);
        }
    } else {
        // Change back to play button
        playButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="35" height="35" color="currentColor" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round">
                <polygon points="9,7 17,12 9,17" fill="black" stroke="none" />
            </svg>
        `;
        playButton.classList.remove('playing');
        playButton.setAttribute('data-state', 'play');
        
        // Remove the currently playing song from card
        updateCurrentSongOnCard(folderName, null);
    }
}

// Function to stop current song and reset UI
function stopCurrentSong() {
    if (window.currentAudio) {
        // Update the playing folder's button back to play
        if (currentlyPlayingFolder) {
            updateFolderPlayButton(currentlyPlayingFolder, false);
        }
        
        window.currentAudio.pause();
        window.currentAudio.currentTime = 0;
        window.currentAudio = null;
        currentlyPlayingFolder = null;
        currentlyPlayingSong = null;
    }
    
    // Reset play button
    updatePlayPauseButton(false);
    
    // Reset seekbar
    let circle = document.querySelector(".circle");
    if (circle) circle.style.left = "0%";
    
    // Reset time display
    let songTime = document.querySelector(".songtime");
    if (songTime) songTime.textContent = "0:00 / 0:00";
    
    // Reset song info
    let songInfo = document.querySelector(".songinfo");
    if (songInfo) songInfo.textContent = "Select a song to play";
    
    // Remove active highlight from all songs
    document.querySelectorAll(".songList ul li").forEach(li => {
        li.classList.remove("active");
    });
}

// Function to highlight selected folder
function highlightSelectedFolder(folderName) {
    // Remove active class from all cards
    document.querySelectorAll(".card").forEach(card => {
        card.classList.remove("selected-folder");
    });
    
    // Add active class to selected folder card
    if (folderName) {
        const selectedCard = document.querySelector(`.card[data-folder="${folderName}"]`);
        if (selectedCard) {
            selectedCard.classList.add("selected-folder");
            
            // Add click animation
            selectedCard.classList.add("folder-clicked");
            setTimeout(() => {
                selectedCard.classList.remove("folder-clicked");
            }, 300);
        }
    }
    
    // Update currently selected folder
    currentlySelectedFolder = folderName;
}

// Function to format song name
function formatSongName(song, maxLength = 30) {
    let displayName = song.replace(/%20/g, " ").replace(/\.mp3$/i, "");
    
    // Truncate if too long (this is additional safety, though CSS handles it)
    if (displayName.length > maxLength) {
        displayName = displayName.substring(0, maxLength - 3) + "...";
    }
    
    return displayName;
}

// Function to create a song list item
async function createSongItem(song, index, songsList, folder) {
    let li = document.createElement("li");
    let displayName = formatSongName(song);
    
    // Try to get metadata first
    let metadata = await fetchSongMetadata(folder, song);
    let artistName = "Unknown Artist";
    
    if (metadata && metadata.artist) {
        artistName = metadata.artist;
    } else {
        artistName = extractArtistFromFilename(song);
    }
    
    li.innerHTML = `
        <img class="invert" src="img/music.svg" alt="">
        <div class="info">
            <div class="song-title" title="${displayName}">${displayName}</div>
            <div class="artist-name" title="${artistName}">${artistName}</div>
        </div>
        <div class="playnow">
            <span>Play Now</span>
            <img class="invert" src="img/play.svg" alt="">
        </div>
    `;
    
    li.setAttribute("data-src", song);
    li.setAttribute("data-index", index);
    li.setAttribute("data-artist", artistName);
    
    // Add click event
    li.addEventListener("click", function(e) {
        // Don't trigger if clicking on play button (to avoid double events)
        if (!e.target.closest('.playnow img')) {
            playSong(this.getAttribute("data-src"), songsList);
            highlightActiveSong(this);
        }
    });
    
    // Add play button click event
    let playBtn = li.querySelector('.playnow img');
    if (playBtn) {
        playBtn.addEventListener("click", function(e) {
            e.stopPropagation(); // Prevent li click event
            playSong(li.getAttribute("data-src"), songsList);
            highlightActiveSong(li);
        });
    }
    
    return li;
}

// Function to highlight active song
function highlightActiveSong(activeLi) {
    // Remove active class from all items
    document.querySelectorAll(".songList ul li").forEach(li => {
        li.classList.remove("active");
    });
    
    // Add active class to current item
    if (activeLi) {
        activeLi.classList.add("active");
    }
}

// Function to update play/pause button
function updatePlayPauseButton(isPlaying) {
    let playButton = document.querySelector(".songbuttons img[src='img/play.svg'], .songbuttons img[src='img/pause.svg']");
    if (playButton) {
        if (isPlaying) {
            playButton.src = "img/pause.svg"; // Show pause when playing
        } else {
            playButton.src = "img/play.svg"; // Show play when paused
        }
    }
}

// Function to update seekbar position
function updateSeekbar() {
    let seekbar = document.querySelector(".seekbar");
    let circle = document.querySelector(".circle");
    
    if (window.currentAudio && circle && seekbar) {
        let percentage = (window.currentAudio.currentTime / window.currentAudio.duration) * 100 || 0;
        circle.style.left = percentage + "%";
    }
}

// Function to update time display
function updateTimeDisplay() {
    let songTime = document.querySelector(".songtime");
    if (songTime && window.currentAudio) {
        let minutes = Math.floor(window.currentAudio.currentTime / 60);
        let seconds = Math.floor(window.currentAudio.currentTime % 60);
        if (seconds < 10) seconds = "0" + seconds;
        
        let totalMinutes = Math.floor(window.currentAudio.duration / 60) || 0;
        let totalSeconds = Math.floor(window.currentAudio.duration % 60) || 0;
        if (totalSeconds < 10) totalSeconds = "0" + totalSeconds;
        
        songTime.textContent = `${minutes}:${seconds} / ${totalMinutes}:${totalSeconds}`;
        
        // Update seekbar as well
        updateSeekbar();
    }
}

// Function to setup seekbar functionality
function setupSeekbar() {
    let seekbar = document.querySelector(".seekbar");
    let circle = document.querySelector(".circle");
    
    if (!seekbar || !circle) return;
    
    // Click on seekbar to seek
    seekbar.addEventListener("click", (e) => {
        if (!window.currentAudio) return;
        
        let seekbarRect = seekbar.getBoundingClientRect();
        let clickPosition = (e.clientX - seekbarRect.left) / seekbarRect.width;
        let seekTime = clickPosition * window.currentAudio.duration;
        
        window.currentAudio.currentTime = seekTime;
        
        // Update circle position
        circle.style.left = (clickPosition * 100) + "%";
    });
    
    // Drag functionality for circle
    let isDragging = false;
    
    circle.addEventListener("mousedown", (e) => {
        e.preventDefault();
        isDragging = true;
    });
    
    document.addEventListener("mousemove", (e) => {
        if (!isDragging || !window.currentAudio) return;
        
        let seekbarRect = seekbar.getBoundingClientRect();
        let dragPosition = (e.clientX - seekbarRect.left) / seekbarRect.width;
        
        // Constrain drag position within seekbar
        dragPosition = Math.max(0, Math.min(1, dragPosition));
        
        // Update circle position
        circle.style.left = (dragPosition * 100) + "%";
    });
    
    document.addEventListener("mouseup", (e) => {
        if (isDragging && window.currentAudio) {
            let seekbarRect = seekbar.getBoundingClientRect();
            let dropPosition = (e.clientX - seekbarRect.left) / seekbarRect.width;
            
            // Constrain drop position within seekbar
            dropPosition = Math.max(0, Math.min(1, dropPosition));
            
            // Seek to position
            window.currentAudio.currentTime = dropPosition * window.currentAudio.duration;
        }
        isDragging = false;
    });
}

// Add CSS for hover effects and folder selection
function addHoverStyles() {
    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
        /* Song buttons hover effects */
        .songbuttons img {
            transition: all 0.2s ease;
            cursor: pointer;
        }
        
        .songbuttons img:hover {
            transform: scale(1.1);
            filter: brightness(1.2);
        }
        
        .songbuttons img:active {
            transform: scale(0.9);
        }
        
        /* Song list item hover effects */
        .songList ul li {
            transition: all 0.2s ease;
            cursor: pointer;
            padding: 10px;
            margin: 5px 0;
            border-radius: 5px;
        }
        
        .songList ul li:hover {
            background-color: rgba(255, 255, 255, 0.1);
            transform: translateX(5px);
        }
        
        .songList ul li:active {
            transform: scale(0.99);
        }
        
        /* Active song highlight */
        .songList ul li.active {
            background-color: rgba(29, 185, 84, 0.2);
            border-left: 3px solid #1db954;
        }
        
        /* Song info styling */
        .songList ul li .info {
            font-size: 13px;
            width: 344px;
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
        
        .songList ul li .info .song-title {
            font-weight: 500;
            color: white;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 250px;
        }
        
        .songList ul li .info .artist-name {
            font-size: 11px;
            color: #b3b3b3;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 250px;
            margin-top: 2px;
        }
        
        /* Play now button hover */
        .playnow {
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .playnow:hover {
            transform: scale(1.05);
        }
        
        .playnow:active {
            transform: scale(0.95);
        }
        
        .playnow span {
            font-size: 12px;
            color: #b3b3b3;
        }
        
        /* Song info transition */
        .songinfo {
            transition: all 0.3s ease;
        }
        
        /* Seekbar circle cursor */
        .circle {
            cursor: grab;
        }
        
        .circle:active {
            cursor: grabbing;
        }

        /* Volume control styling */
        .volume {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .volume img {
            cursor: pointer;
            width: 24px;
            height: 24px;
            transition: all 0.2s ease;
        }

        .volume img:hover {
            transform: scale(1.1);
        }

        .volume img.muted {
            opacity: 0.7;
        }

        .volume-slider {
            width: 100px;
            cursor: pointer;
        }

        /* Card Container and Card Styles */
        .cardContainer {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            padding: 20px;
        }

        .card {
            width: 200px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            padding: 10px;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            border: 2px solid transparent;
        }

        .card:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
        }

        .card.selected-folder {
            background: rgba(29, 185, 84, 0.15);
            border: 2px solid #1db954;
            transform: scale(1.02);
            box-shadow: 0 0 20px rgba(29, 185, 84, 0.3);
        }

        .card.folder-clicked {
            animation: folderClick 0.3s ease;
        }

        @keyframes folderClick {
            0% {
                transform: scale(1);
            }
            50% {
                transform: scale(0.95);
                background: rgba(255, 255, 255, 0.3);
            }
            100% {
                transform: scale(1);
            }
        }

        .card.selected-folder {
            animation: folderSelected 1s ease;
        }

        @keyframes folderSelected {
            0% {
                box-shadow: 0 0 0 0 rgba(29, 185, 84, 0.7);
            }
            70% {
                box-shadow: 0 0 0 10px rgba(29, 185, 84, 0);
            }
            100% {
                box-shadow: 0 0 0 0 rgba(29, 185, 84, 0);
            }
        }

        .card img {
            width: 100%;
            height: 133px;
            object-fit: cover;
            border-radius: 10px;
            background: #333;
            transition: all 0.3s ease;
        }

        .card.selected-folder img {
            transform: scale(1.05);
        }

        .card h2 {
            margin: 10px 0 5px;
            font-size: 16px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .card p {
            margin: 0;
            font-size: 14px;
            color: rgba(255, 255, 255, 0.7);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .play {
            position: absolute;
            bottom: 80px;
            right: 3px;
            opacity: 0;
            transition: all 0.3s ease;
            background: #1db954;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 10;
            pointer-events: auto;
        }

        .play.playing {
            background: #ff4444;
            opacity: 1;
            transform: scale(1.1);
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% {
                box-shadow: 0 0 0 0 rgba(255, 68, 68, 0.7);
            }
            70% {
                box-shadow: 0 0 0 10px rgba(255, 68, 68, 0);
            }
            100% {
                box-shadow: 0 0 0 0 rgba(255, 68, 68, 0);
            }
        }

        .card:hover .play {
            opacity: 1;
        }

        .play svg {
            width: 24px;
            height: 24px;
            pointer-events: none;
        }

        .card .no-image {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 48px;
            font-weight: bold;
        }

        .card.loading {
            opacity: 0.7;
            pointer-events: none;
        }

        .card.loading::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 30px;
            height: 30px;
            margin: -15px 0 0 -15px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-top-color: #1db954;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        /* Song list container styling */
        .songList {
            max-height: 60vh;
            overflow-y: auto;
            padding: 10px;
        }

        .songList ul {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .songList ul li {
            display: flex;
            align-items: center;
            gap: 10px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .songList ul li img {
            width: 30px;
            height: 30px;
        }

        /* Currently playing song display on card */
        .card .currently-playing-song {
            position: absolute;
            bottom: 10px;
            left: 9px;
            right: 10px;
            background: rgba(17, 231, 17, 0.95);
            color: white;
            padding: 5px 8px;
            border-radius: 15px;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 5px;
            opacity: 0;
            transform: translateY(10px);
            transition: all 0.3s ease;
            pointer-events: none;
            z-index: 5;
            backdrop-filter: blur(5px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .card .currently-playing-song.active {
            opacity: 1;
            transform: translateY(0);
        }
        
        .card .currently-playing-song .now-playing-indicator {
            color: #010703;
            font-size: 12px;
            animation: pulse 1s infinite;
        }
        
        .card .currently-playing-song .song-name {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        /* Hover effect for card with playing song */
        // .card:hover .currently-playing-song {
        //     background: rgba(4, 7, 5, 0.95);
        // }
        
        /* Adjust play button position when song is playing */
        .card .currently-playing-song.active + .play {
            bottom: 80px;
        }
        
        /* Different colors for different folders */
        .card[data-folder="cs"] .currently-playing-song .now-playing-indicator {
            color: rgb(247, 8, 8);
        }
        
        .card[data-folder="music"] .currently-playing-song .now-playing-indicator {
            color: #4ecdc4;
        }
        
        .card[data-folder="ncs"] .currently-playing-song .now-playing-indicator {
            color: #45b7d1;
        }
        
        /* Smooth transitions */
        .card .play {
            transition: all 0.3s ease;
        }
        
        /* Song name truncation */
        .card .currently-playing-song .song-name {
            max-width: 120px;
            display: inline-block;
        }
        
        /* Animation for new song appearing */
        .card .currently-playing-song.active {
            animation: slideUp 0.3s ease;
        }
        
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(styleSheet);
}

// Hamburger menu functionality
function setupHamburgerMenu() {
    const hamburger = document.querySelector('.hamburger');
    const leftPanel = document.querySelector('.left');
    const closeBtn = document.querySelector('.close img');
    
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            leftPanel.classList.add('open');
        });
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            leftPanel.classList.remove('open');
        });
    }
}

// Volume control functionality
function setupVolumeControl() {
    let volumeSlider = document.getElementById('volumeSlider');
    let volumeBtn = document.getElementById('volumeBtn');
    let prevVolume = 70;

    if (volumeSlider) {
        if (window.currentAudio) {
            window.currentAudio.volume = volumeSlider.value / 100;
        }

        volumeSlider.addEventListener('input', (e) => {
            let vol = e.target.value / 100;
            if (window.currentAudio) {
                window.currentAudio.volume = vol;
            }
            prevVolume = e.target.value;
            
            if (volumeBtn) {
                if (vol === 0) {
                    volumeBtn.src = 'img/volume-mute.svg';
                    volumeBtn.classList.add('muted');
                } else if (vol < 0.5) {
                    volumeBtn.src = 'img/volume-low.svg';
                    volumeBtn.classList.remove('muted');
                } else {
                    volumeBtn.src = 'img/volume-high.svg';
                    volumeBtn.classList.remove('muted');
                }
            }
        });
    }

    if (volumeBtn) {
        volumeBtn.addEventListener('click', () => {
            if (window.currentAudio && volumeSlider) {
                if (window.currentAudio.volume > 0) {
                    prevVolume = volumeSlider.value;
                    window.currentAudio.volume = 0;
                    volumeSlider.value = 0;
                    volumeBtn.src = 'img/volume-mute.svg';
                    volumeBtn.classList.add('muted');
                } else {
                    window.currentAudio.volume = prevVolume / 100;
                    volumeSlider.value = prevVolume;
                    
                    if (prevVolume / 100 < 0.5) {
                        volumeBtn.src = 'img/volume-low.svg';
                    } else {
                        volumeBtn.src = 'img/volume-high.svg';
                    }
                    volumeBtn.classList.remove('muted');
                }
            } else if (!window.currentAudio && volumeSlider) {
                if (volumeSlider.value > 0) {
                    prevVolume = volumeSlider.value;
                    volumeSlider.value = 0;
                    volumeBtn.src = 'img/volume-mute.svg';
                    volumeBtn.classList.add('muted');
                } else {
                    volumeSlider.value = prevVolume;
                    if (prevVolume / 100 < 0.5) {
                        volumeBtn.src = 'img/volume-low.svg';
                    } else {
                        volumeBtn.src = 'img/volume-high.svg';
                    }
                    volumeBtn.classList.remove('muted');
                }
            }
        });
    }
}

// Function to display songs in the library
async function displaySongs(folder) {
    try {
        let songs = await getSongs(folder);
        console.log("Songs found in folder", folder, ":", songs);

        let songUL = document.querySelector(".songList ul");

        if (!songUL) {
            console.error("No song list ul found in HTML!");
            return;
        }

        songUL.innerHTML = "";

        if (songs.length === 0) {
            let li = document.createElement("li");
            li.innerHTML = '<div class="info">Click on your favorite folder to start listening to songs.</div>';
            songUL.appendChild(li);
            return songs;
        }

        // Create and append all song items with folder parameter
        for (let index = 0; index < songs.length; index++) {
            let li = await createSongItem(songs[index], index, songs, folder);
            songUL.appendChild(li);
        }

        return songs;
    } catch (error) {
        console.error("Error displaying songs:", error);
    }
}

// Setup folder card button click events
function setupFolderCardButtons() {
    document.addEventListener('click', async (e) => {
        const playButton = e.target.closest('.card .play');
        if (!playButton) return;
        
        e.stopPropagation();
        
        const card = playButton.closest('.card');
        if (!card) return;
        
        const folder = card.dataset.folder;
        if (!folder) return;
        
        console.log("Folder play button clicked:", folder);
        
        if (currentlyPlayingFolder === folder && window.currentAudio) {
            if (window.currentAudio.paused) {
                window.currentAudio.play();
                updatePlayPauseButton(true);
                updateFolderPlayButton(folder, true, currentlyPlayingSong);
            } else {
                window.currentAudio.pause();
                updatePlayPauseButton(false);
                updateFolderPlayButton(folder, false);
            }
            return;
        }
        
        if (currentlyPlayingFolder && currentlyPlayingFolder !== folder) {
            stopCurrentSong();
        }
        
        card.classList.add('loading');
        highlightSelectedFolder(folder);
        
        let songs = await displaySongs(`songs/${folder}`);
        
        card.classList.remove('loading');
        
        if (songs && songs.length > 0) {
            window.currentFolderSongs = songs;
            currFolder = `songs/${folder}`;
            
            if (songs.length > 0) {
                setTimeout(() => {
                    window.playSong(songs[0], songs);
                    setTimeout(() => {
                        const firstSong = document.querySelector('.songList ul li:first-child');
                        if (firstSong) highlightActiveSong(firstSong);
                    }, 100);
                }, 100);
            }
            
            let songInfo = document.querySelector(".songinfo");
            if (songInfo) {
                songInfo.style.transform = "scale(1.1)";
                songInfo.textContent = `Playing from ${folder}`;
                setTimeout(() => {
                    songInfo.style.transform = "scale(1)";
                }, 200);
            }
        }
    });
}

// Setup folder click events
function setupFolderClicks() {
    document.addEventListener('click', async (e) => {
        if (e.target.closest('.card .play')) return;
        
        const card = e.target.closest('.card');
        if (card) {
            const folder = card.dataset.folder;
            
            if (folder) {
                console.log("Folder clicked:", folder);
                
                card.classList.add('loading');
                highlightSelectedFolder(folder);
                stopCurrentSong();
                
                let songs = await displaySongs(`songs/${folder}`);
                
                card.classList.remove('loading');
                
                if (songs && songs.length > 0) {
                    window.currentFolderSongs = songs;
                    currFolder = `songs/${folder}`;
                    
                    let folderName = folder.toUpperCase();
                    console.log(`Now playing from: ${folderName}`);
                    
                    let songInfo = document.querySelector(".songinfo");
                    if (songInfo) {
                        songInfo.style.transform = "scale(1.1)";
                        songInfo.textContent = `${songs.length} songs in ${folder}`;
                        setTimeout(() => {
                            songInfo.style.transform = "scale(1)";
                        }, 200);
                    }
                } else {
                    let songInfo = document.querySelector(".songinfo");
                    if (songInfo) {
                        songInfo.style.transform = "scale(1.1)";
                        songInfo.textContent = `No songs in ${folder}`;
                        setTimeout(() => {
                            songInfo.style.transform = "scale(1)";
                        }, 200);
                    }
                }
            }
        }
    });
}

// Display albums function
async function displayAlbums() {
    try {
        console.log("Fetching albums from songs directory...");
        
        let a = await fetch(`http://127.0.0.1:154/songs/`);
        let response = await a.text();
        
        let div = document.createElement("div");
        div.innerHTML = response;
        
        let anchors = div.getElementsByTagName("a");
        let cardContainer = document.querySelector(".cardContainer");
        
        if (!cardContainer) {
            console.error("Card container not found!");
            return;
        }
        
        cardContainer.innerHTML = "";
        
        console.log("Found anchors:", anchors.length);
        
        let folders = [];
        
        Array.from(anchors).forEach(anchor => {
            let href = anchor.getAttribute('href');
            
            if (href && href.endsWith('/') && href !== '../' && href !== './') {
                let folderName = href.slice(0, -1);
                folderName = decodeURIComponent(folderName);
                folderName = folderName.replace(/\\/g, '/').split('/').pop();
                
                if (folderName && folderName !== '..' && folderName !== '.' && !folderName.includes('?')) {
                    folders.push(folderName);
                    console.log("Found folder:", folderName);
                }
            }
        });
        
        console.log("Detected folders:", folders);
        
        for (let folder of folders) {
            try {
                let title = folder;
                let description = 'Click to play songs';
                let hasCover = false;
                
                try {
                    let infoResponse = await fetch(`http://127.0.0.1:154/songs/${encodeURIComponent(folder)}/info.json`);
                    if (infoResponse.ok) {
                        let info = await infoResponse.json();
                        title = info.title || folder;
                        description = info.description || description;
                        console.log(`Info for ${folder}:`, info);
                    } else {
                        console.log(`No info.json for folder: ${folder}`);
                    }
                } catch (infoError) {
                    console.log(`Error fetching info.json for ${folder}:`, infoError);
                }
                
                try {
                    let coverResponse = await fetch(`http://127.0.0.1:154/songs/${encodeURIComponent(folder)}/cover.jpg`, { method: 'HEAD' });
                    hasCover = coverResponse.ok;
                    console.log(`Cover for ${folder}:`, hasCover ? 'Found' : 'Not found');
                } catch (coverError) {
                    console.log(`Error checking cover for ${folder}:`, coverError);
                }
                
                let cardHtml = `<div data-folder="${folder}" class="card">
                    <div class="play" data-state="play">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="35" height="35" color="currentColor" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round">
                            <polygon points="9,7 17,12 9,17" fill="black" stroke="none" />
                        </svg>
                    </div>`;
                
                if (hasCover) {
                    cardHtml += `<img src="/songs/${encodeURIComponent(folder)}/cover.jpg" alt="${title}" 
                        onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22200%22%20height%3D%22200%22%20viewBox%3D%220%200%20200%20200%22%3E%3Crect%20width%3D%22200%22%20height%3D%22200%22%20fill%3D%22%23333%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22%23fff%22%20font-size%3D%2250%22%3E${folder.charAt(0).toUpperCase()}%3C%2Ftext%3E%3C%2Fsvg%3E';">`;
                } else {
                    let firstLetter = folder.charAt(0).toUpperCase();
                    let colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'];
                    let colorIndex = folders.indexOf(folder) % colors.length;
                    let bgColor = colors[colorIndex].replace('#', '%23');
                    
                    cardHtml += `<img src="data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22200%22%20height%3D%22200%22%20viewBox%3D%220%200%20200%20200%22%3E%3Crect%20width%3D%22200%22%20height%3D%22200%22%20fill%3D%22${bgColor}%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22%23fff%22%20font-size%3D%2280%22%3E${firstLetter}%3C%2Ftext%3E%3C%2Fsvg%3E" alt="${title}">`;
                }
                
                cardHtml += `<h2>${title}</h2>
                    <p>${description}</p>
                </div>`;
                
                cardContainer.innerHTML += cardHtml;
                
            } catch (error) {
                console.error(`Error creating card for folder ${folder}:`, error);
            }
        }
        
        console.log("Albums displayed successfully");
        
        let defaultFolder = currFolder.split('/').pop();
        if (defaultFolder && folders.includes(defaultFolder)) {
            highlightSelectedFolder(defaultFolder);
        }
        
    } catch (error) {
        console.error("Error displaying albums:", error);
    }
}

async function main() {
    try {
        console.log("Starting main function...");
        
        await displayAlbums();
        addHoverStyles();
        setupHamburgerMenu();
        setupFolderClicks();
        setupFolderCardButtons();

        let songs = await displaySongs(currFolder);
        
        if (songs && songs.length > 0) {
            console.log("Initial songs loaded:", songs);
            window.currentFolderSongs = songs;
            
            let songInfo = document.querySelector(".songinfo");
            if (songInfo) {
                songInfo.textContent = `${songs.length} songs in ${currFolder.split('/').pop()}`;
            }
        }

        setupSeekbar();
        setupVolumeControl();

        window.playSong = function(songFile, songsList = window.currentFolderSongs || []) {
            let cleanSongFile = songFile.replace(/\\/g, '/');
            let audioUrl = `http://127.0.0.1:154/${currFolder}/${encodeURIComponent(cleanSongFile)}`;
            
            if (window.currentAudio) {
                if (currentlyPlayingFolder) {
                    updateFolderPlayButton(currentlyPlayingFolder, false);
                }
                
                window.currentAudio.pause();
                window.currentAudio.removeEventListener("timeupdate", updateTimeDisplay);
            }
            
            window.currentAudio = new Audio(audioUrl);
            
            let currentFolderName = currFolder.split('/').pop();
            currentlyPlayingFolder = currentFolderName;
            currentlyPlayingSong = songFile;
            
            // Update folder button with song name
            updateFolderPlayButton(currentFolderName, true, songFile);
            
            let volumeSlider = document.getElementById('volumeSlider');
            if (volumeSlider && window.currentAudio) {
                window.currentAudio.volume = volumeSlider.value / 100;
            }
            
            let songInfo = document.querySelector(".songinfo");
            if (songInfo) {
                let displayName = formatSongName(songFile);
                songInfo.textContent = displayName;
                songInfo.title = displayName;
            }
            
            window.currentAudio.play().catch(e => {
                console.error("Playback failed:", e);
                console.log("Failed URL:", audioUrl);
            });
            
            updatePlayPauseButton(true);
            window.currentAudio.addEventListener("timeupdate", updateTimeDisplay);
            
            window.currentAudio.addEventListener("ended", function() {
                let currentSrc = this.src;
                let currentSongFile = decodeURIComponent(currentSrc.split('/').pop());
                let currentIndex = songsList.findIndex(s => s.includes(currentSongFile));
                
                if (currentIndex < songsList.length - 1) {
                    window.playSong(songsList[currentIndex + 1], songsList);
                    
                    let nextLi = document.querySelector(`.songList ul li[data-index="${currentIndex + 1}"]`);
                    highlightActiveSong(nextLi);
                } else {
                    updatePlayPauseButton(false);
                    let circle = document.querySelector(".circle");
                    if (circle) circle.style.left = "0%";
                    
                    let songTime = document.querySelector(".songtime");
                    if (songTime) songTime.textContent = "0:00 / 0:00";
                    
                    if (currentlyPlayingFolder) {
                        updateFolderPlayButton(currentlyPlayingFolder, false);
                        currentlyPlayingFolder = null;
                        currentlyPlayingSong = null;
                    }
                }
            });
            
            updateTimeDisplay();
            
            let circle = document.querySelector(".circle");
            if (circle) circle.style.left = "0%";
        }

        let playButton = document.querySelector(".songbuttons img[src='img/play.svg'], .songbuttons img[src='img/pause.svg']");
        if (playButton) {
            playButton.addEventListener("click", function() {
                this.style.transform = "scale(0.9)";
                setTimeout(() => {
                    this.style.transform = "";
                }, 100);
                
                if (window.currentAudio) {
                    if (window.currentAudio.paused) {
                        window.currentAudio.play();
                        updatePlayPauseButton(true);
                        
                        if (currentlyPlayingFolder && currentlyPlayingSong) {
                            updateFolderPlayButton(currentlyPlayingFolder, true, currentlyPlayingSong);
                        }
                    } else {
                        window.currentAudio.pause();
                        updatePlayPauseButton(false);
                        
                        if (currentlyPlayingFolder) {
                            updateFolderPlayButton(currentlyPlayingFolder, false);
                        }
                    }
                } else if (window.currentFolderSongs && window.currentFolderSongs.length > 0) {
                    window.playSong(window.currentFolderSongs[0], window.currentFolderSongs);
                    highlightActiveSong(document.querySelector('.songList ul li:first-child'));
                    updatePlayPauseButton(true);
                }
            });
        }

        let prevButton = document.querySelector(".songbuttons img[src='img/previous.svg']");
        if (prevButton) {
            prevButton.addEventListener("click", function() {
                this.style.transform = "scale(0.9)";
                setTimeout(() => {
                    this.style.transform = "";
                }, 100);
                
                if (window.currentAudio && window.currentFolderSongs && window.currentFolderSongs.length > 0) {
                    let currentSrc = window.currentAudio.src;
                    let currentSongFile = decodeURIComponent(currentSrc.split('/').pop());
                    let currentIndex = window.currentFolderSongs.findIndex(song => song.includes(currentSongFile));
                    
                    if (currentIndex > 0) {
                        window.playSong(window.currentFolderSongs[currentIndex - 1], window.currentFolderSongs);
                        let prevLi = document.querySelector(`.songList ul li[data-index="${currentIndex - 1}"]`);
                        highlightActiveSong(prevLi);
                    }
                }
            });
        }

        let nextButton = document.querySelector(".songbuttons img[src='img/next.svg']");
        if (nextButton) {
            nextButton.addEventListener("click", function() {
                this.style.transform = "scale(0.9)";
                setTimeout(() => {
                    this.style.transform = "";
                }, 100);
                
                if (window.currentAudio && window.currentFolderSongs && window.currentFolderSongs.length > 0) {
                    let currentSrc = window.currentAudio.src;
                    let currentSongFile = decodeURIComponent(currentSrc.split('/').pop());
                    let currentIndex = window.currentFolderSongs.findIndex(song => song.includes(currentSongFile));
                    
                    if (currentIndex < window.currentFolderSongs.length - 1) {
                        window.playSong(window.currentFolderSongs[currentIndex + 1], window.currentFolderSongs);
                        let nextLi = document.querySelector(`.songList ul li[data-index="${currentIndex + 1}"]`);
                        highlightActiveSong(nextLi);
                    }
                }
            });
        }

        if (window.currentAudio && !window.currentAudio.paused) {
            updatePlayPauseButton(true);
        } else {
            updatePlayPauseButton(false);
        }

        console.log("Main function completed successfully");

    } catch (error) {
        console.error("Error in main function:", error);
    }  
}

document.addEventListener("DOMContentLoaded", main);