let currFolder = "songs/cs"; // Define globally with default
let currentAudio = null; // Track current audio globally
let currentlySelectedFolder = null; // Track currently selected folder
let currentlyPlayingFolder = null; // Track which folder's song is currently playing

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

// Function to update folder card play button based on playing state
function updateFolderPlayButton(folderName, isPlaying = false) {
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
    } else {
        // Change back to play button
        playButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="35" height="35" color="currentColor" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round">
                <polygon points="9,7 17,12 9,17" fill="black" stroke="none" />
            </svg>
        `;
        playButton.classList.remove('playing');
        playButton.setAttribute('data-state', 'play');
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
function createSongItem(song, index, songsList, isTemplate = false) {
    let li = document.createElement("li");
    let displayName = formatSongName(song);
    
    li.innerHTML = `
        <img class="invert" src="music.svg" alt="">
        <div class="info">
            <div title="${displayName}">${displayName}</div>
            <div>Artist Name</div>
        </div>
        <div class="playnow">
            <span>Play Now</span>
            <img class="invert" src="play.svg" alt="">
        </div>
    `;
    
    li.setAttribute("data-src", song);
    li.setAttribute("data-index", index);
    
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
    let playButton = document.querySelector(".songbuttons img[src='play.svg'], .songbuttons img[src='pause.svg']");
    if (playButton) {
        if (isPlaying) {
            playButton.src = "pause.svg"; // Show pause when playing
        } else {
            playButton.src = "play.svg"; // Show play when paused
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
            background-color: rgba(255, 255, 255, 0.2);
            border-left: 3px solid #1db954;
        }
        
        /* Play now button hover */
        .playnow {
            transition: all 0.2s ease;
        }
        
        .playnow:hover {
            transform: scale(1.05);
        }
        
        .playnow:active {
            transform: scale(0.95);
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
            border: 2px solid transparent; /* For selected state */
        }

        .card:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
        }

        /* Selected folder style */
        .card.selected-folder {
            background: rgba(29, 185, 84, 0.15);
            border: 2px solid #1db954;
            transform: scale(1.02);
            box-shadow: 0 0 20px rgba(29, 185, 84, 0.3);
        }

        /* Click animation */
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

        /* Pulse animation for newly selected folder */
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
            height: 200px;
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

        /* Play button on card */
        .play {
            position: absolute;
            bottom: 80px;
            right: 20px;
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
            pointer-events: auto; /* Ensure button is clickable */
        }

        /* Playing state for card button */
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
            pointer-events: none; /* SVG shouldn't block clicks */
        }

        /* Default placeholder for cards without images */
        .card .no-image {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 48px;
            font-weight: bold;
        }

        /* Loading animation for folder */
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
        // Set initial volume
        if (window.currentAudio) {
            window.currentAudio.volume = volumeSlider.value / 100;
        }

        volumeSlider.addEventListener('input', (e) => {
            let vol = e.target.value / 100;
            if (window.currentAudio) {
                window.currentAudio.volume = vol;
            }
            prevVolume = e.target.value;
            
            // Update volume icon based on level
            if (volumeBtn) {
                if (vol === 0) {
                    volumeBtn.src = 'volume-mute.svg';
                    volumeBtn.classList.add('muted');
                } else if (vol < 0.5) {
                    volumeBtn.src = 'volume-low.svg';
                    volumeBtn.classList.remove('muted');
                } else {
                    volumeBtn.src = 'volume-high.svg';
                    volumeBtn.classList.remove('muted');
                }
            }
        });
    }

    if (volumeBtn) {
        volumeBtn.addEventListener('click', () => {
            if (window.currentAudio && volumeSlider) {
                if (window.currentAudio.volume > 0) {
                    // Mute - save current volume and set to 0
                    prevVolume = volumeSlider.value;
                    window.currentAudio.volume = 0;
                    volumeSlider.value = 0;
                    volumeBtn.src = 'volume-mute.svg';
                    volumeBtn.classList.add('muted');
                } else {
                    // Unmute - restore previous volume
                    window.currentAudio.volume = prevVolume / 100;
                    volumeSlider.value = prevVolume;
                    
                    // Update icon based on restored volume level
                    if (prevVolume / 100 < 0.5) {
                        volumeBtn.src = 'volume-low.svg';
                    } else {
                        volumeBtn.src = 'volume-high.svg';
                    }
                    volumeBtn.classList.remove('muted');
                }
            } else if (!window.currentAudio && volumeSlider) {
                // If no audio is playing, just toggle the slider value
                if (volumeSlider.value > 0) {
                    prevVolume = volumeSlider.value;
                    volumeSlider.value = 0;
                    volumeBtn.src = 'volume-mute.svg';
                    volumeBtn.classList.add('muted');
                } else {
                    volumeSlider.value = prevVolume;
                    if (prevVolume / 100 < 0.5) {
                        volumeBtn.src = 'volume-low.svg';
                    } else {
                        volumeBtn.src = 'volume-high.svg';
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

        // Get the song list container
        let songUL = document.querySelector(".songList ul");

        if (!songUL) {
            console.error("No song list ul found in HTML!");
            return;
        }

        // Clear existing items
        songUL.innerHTML = "";

        if (songs.length === 0) {
            // Display a message if no songs found
            let li = document.createElement("li");
            li.innerHTML = '<div class="info">No songs found in this folder</div>';
            songUL.appendChild(li);
            return songs;
        }

        // Create and append all song items
        songs.forEach((song, index) => {
            let li = createSongItem(song, index, songs);
            songUL.appendChild(li);
        });

        return songs;
    } catch (error) {
        console.error("Error displaying songs:", error);
    }
}

// Setup folder card button click events
function setupFolderCardButtons() {
    document.addEventListener('click', async (e) => {
        // Check if clicked on play button inside card
        const playButton = e.target.closest('.card .play');
        if (!playButton) return;
        
        e.stopPropagation(); // Prevent card click event
        
        const card = playButton.closest('.card');
        if (!card) return;
        
        const folder = card.dataset.folder;
        if (!folder) return;
        
        console.log("Folder play button clicked:", folder);
        
        // If this folder is currently playing
        if (currentlyPlayingFolder === folder && window.currentAudio) {
            // Toggle play/pause
            if (window.currentAudio.paused) {
                window.currentAudio.play();
                updatePlayPauseButton(true);
                updateFolderPlayButton(folder, true);
            } else {
                window.currentAudio.pause();
                updatePlayPauseButton(false);
                updateFolderPlayButton(folder, false);
            }
            return;
        }
        
        // If a different folder is playing, stop it first
        if (currentlyPlayingFolder && currentlyPlayingFolder !== folder) {
            stopCurrentSong();
        }
        
        // Add loading class to card
        card.classList.add('loading');
        
        // Highlight the selected folder
        highlightSelectedFolder(folder);
        
        // Display songs from the clicked folder
        let songs = await displaySongs(`songs/${folder}`);
        
        // Remove loading class
        card.classList.remove('loading');
        
        if (songs && songs.length > 0) {
            window.currentFolderSongs = songs;
            currFolder = `songs/${folder}`;
            
            // Play the first song automatically
            if (songs.length > 0) {
                // Small delay to ensure UI is ready
                setTimeout(() => {
                    window.playSong(songs[0], songs);
                    // Highlight first song in list
                    setTimeout(() => {
                        const firstSong = document.querySelector('.songList ul li:first-child');
                        if (firstSong) highlightActiveSong(firstSong);
                    }, 100);
                }, 100);
            }
            
            // Update song info
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

// Setup folder click events (for the card itself)
function setupFolderClicks() {
    // Use event delegation for dynamically created cards
    document.addEventListener('click', async (e) => {
        // Don't trigger if clicking on the play button (handled separately)
        if (e.target.closest('.card .play')) return;
        
        const card = e.target.closest('.card');
        if (card) {
            const folder = card.dataset.folder;
            
            if (folder) {
                console.log("Folder clicked:", folder);
                
                // Add loading class to card
                card.classList.add('loading');
                
                // Highlight the selected folder (with visual effects)
                highlightSelectedFolder(folder);
                
                // STOP ANY CURRENTLY PLAYING SONG
                stopCurrentSong();
                
                // Display songs from the clicked folder
                let songs = await displaySongs(`songs/${folder}`);
                
                // Remove loading class
                card.classList.remove('loading');
                
                // Update the playSong function's default songs list
                if (songs && songs.length > 0) {
                    window.currentFolderSongs = songs;
                    
                    // Update currFolder
                    currFolder = `songs/${folder}`;
                    
                    // Update the folder name in UI with animation
                    let folderName = folder.toUpperCase();
                    console.log(`Now playing from: ${folderName}`);
                    
                    // Update song info to show folder selected with animation
                    let songInfo = document.querySelector(".songinfo");
                    if (songInfo) {
                        songInfo.style.transform = "scale(1.1)";
                        songInfo.textContent = `${songs.length} songs in ${folder}`;
                        setTimeout(() => {
                            songInfo.style.transform = "scale(1)";
                        }, 200);
                    }
                } else {
                    // No songs in folder
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

// Display albums function that properly extracts folder names
async function displayAlbums() {
    try {
        console.log("Fetching albums from songs directory...");
        
        // Fetch the songs directory listing
        let a = await fetch(`http://127.0.0.1:154/songs/`);
        let response = await a.text();
        
        // Parse the HTML response
        let div = document.createElement("div");
        div.innerHTML = response;
        
        // Get all anchor tags (links)
        let anchors = div.getElementsByTagName("a");
        let cardContainer = document.querySelector(".cardContainer");
        
        if (!cardContainer) {
            console.error("Card container not found!");
            return;
        }
        
        // Clear existing cards
        cardContainer.innerHTML = "";
        
        console.log("Found anchors:", anchors.length);
        
        // Process each anchor to find folders
        let folders = [];
        
        Array.from(anchors).forEach(anchor => {
            let href = anchor.getAttribute('href');
            
            // Check if it's a directory (ends with /) and not parent directory
            if (href && href.endsWith('/') && href !== '../' && href !== './') {
                // Extract folder name (remove trailing /)
                let folderName = href.slice(0, -1);
                
                // Decode the folder name (fixes %5C issues)
                folderName = decodeURIComponent(folderName);
                
                // Clean up the folder name - remove any backslashes and extra paths
                folderName = folderName.replace(/\\/g, '/').split('/').pop();
                
                // Skip if it's not a valid folder name
                if (folderName && folderName !== '..' && folderName !== '.' && !folderName.includes('?')) {
                    folders.push(folderName);
                    console.log("Found folder:", folderName);
                }
            }
        });
        
        console.log("Detected folders:", folders);
        
        // Process each folder
        for (let folder of folders) {
            try {
                // Default values
                let title = folder;
                let description = 'Click to play songs';
                let hasCover = false;
                
                // Try to fetch info.json
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
                
                // Check if cover.jpg exists
                try {
                    let coverResponse = await fetch(`http://127.0.0.1:154/songs/${encodeURIComponent(folder)}/cover.jpg`, { method: 'HEAD' });
                    hasCover = coverResponse.ok;
                    console.log(`Cover for ${folder}:`, hasCover ? 'Found' : 'Not found');
                } catch (coverError) {
                    console.log(`Error checking cover for ${folder}:`, coverError);
                }
                
                // Create card HTML with proper encoding
                let cardHtml = `<div data-folder="${folder}" class="card">
                    <div class="play" data-state="play">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="35" height="35" color="currentColor" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round">
                            <polygon points="9,7 17,12 9,17" fill="black" stroke="none" />
                        </svg>
                    </div>`;
                
                // Add image if cover exists, otherwise add a colored placeholder with folder initial
                if (hasCover) {
                    cardHtml += `<img src="/songs/${encodeURIComponent(folder)}/cover.jpg" alt="${title}" 
                        onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22200%22%20height%3D%22200%22%20viewBox%3D%220%200%20200%20200%22%3E%3Crect%20width%3D%22200%22%20height%3D%22200%22%20fill%3D%22%23333%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22%23fff%22%20font-size%3D%2250%22%3E${folder.charAt(0).toUpperCase()}%3C%2Ftext%3E%3C%2Fsvg%3E';">`;
                } else {
                    // Create a colored placeholder with the first letter of folder name
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
        
        // Highlight default folder if it exists
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
        
        // Display all albums on the page
        await displayAlbums();

        // Add hover styles
        addHoverStyles();
        
        // Setup hamburger menu
        setupHamburgerMenu();

        // Setup folder click events
        setupFolderClicks();
        
        // Setup folder card button click events
        setupFolderCardButtons();

        // Initial load - display songs from default folder
        let songs = await displaySongs(currFolder);
        
        if (songs && songs.length > 0) {
            console.log("Initial songs loaded:", songs);
            window.currentFolderSongs = songs;
            
            // Update song info to show initial folder
            let songInfo = document.querySelector(".songinfo");
            if (songInfo) {
                songInfo.textContent = `${songs.length} songs in ${currFolder.split('/').pop()}`;
            }
        }

        // Setup seekbar functionality
        setupSeekbar();

        // Setup volume control
        setupVolumeControl();

        // Play song function (defined in main scope to have access to songs and currFolder)
        window.playSong = function(songFile, songsList = window.currentFolderSongs || []) {
            // Clean the song file path
            let cleanSongFile = songFile.replace(/\\/g, '/');
            
            // Construct the correct URL
            let audioUrl = `http://127.0.0.1:154/${currFolder}/${encodeURIComponent(cleanSongFile)}`;
            
            if (window.currentAudio) {
                // Update the previously playing folder's button back to play
                if (currentlyPlayingFolder) {
                    updateFolderPlayButton(currentlyPlayingFolder, false);
                }
                
                window.currentAudio.pause();
                // Remove old event listeners
                window.currentAudio.removeEventListener("timeupdate", updateTimeDisplay);
            }
            
            window.currentAudio = new Audio(audioUrl);
            
            // Get current folder name from currFolder
            let currentFolderName = currFolder.split('/').pop();
            
            // Update the playing folder and its button
            currentlyPlayingFolder = currentFolderName;
            updateFolderPlayButton(currentFolderName, true);
            
            // Set volume from slider
            let volumeSlider = document.getElementById('volumeSlider');
            if (volumeSlider && window.currentAudio) {
                window.currentAudio.volume = volumeSlider.value / 100;
            }
            
            // Update song info in playbar
            let songInfo = document.querySelector(".songinfo");
            if (songInfo) {
                let displayName = formatSongName(songFile);
                songInfo.textContent = displayName;
                songInfo.title = displayName; // Add tooltip
            }
            
            // Play the audio
            window.currentAudio.play().catch(e => {
                console.error("Playback failed:", e);
                console.log("Failed URL:", audioUrl);
            });
            
            // Update play/pause button
            updatePlayPauseButton(true);
            
            // Add timeupdate event listeners
            window.currentAudio.addEventListener("timeupdate", updateTimeDisplay);
            
            // Handle song end - play next
            window.currentAudio.addEventListener("ended", function() {
                let currentSrc = this.src;
                let currentSongFile = decodeURIComponent(currentSrc.split('/').pop());
                let currentIndex = songsList.findIndex(s => s.includes(currentSongFile));
                
                if (currentIndex < songsList.length - 1) {
                    window.playSong(songsList[currentIndex + 1], songsList);
                    
                    // Highlight next song
                    let nextLi = document.querySelector(`.songList ul li[data-index="${currentIndex + 1}"]`);
                    highlightActiveSong(nextLi);
                } else {
                    // Last song ended, update button to play and reset seekbar
                    updatePlayPauseButton(false);
                    let circle = document.querySelector(".circle");
                    if (circle) circle.style.left = "0%";
                    
                    // Reset song time display
                    let songTime = document.querySelector(".songtime");
                    if (songTime) songTime.textContent = "0:00 / 0:00";
                    
                    // Update the playing folder's button back to play
                    if (currentlyPlayingFolder) {
                        updateFolderPlayButton(currentlyPlayingFolder, false);
                        currentlyPlayingFolder = null;
                    }
                }
            });
            
            // Initial time display
            updateTimeDisplay();
            
            // Reset seekbar position
            let circle = document.querySelector(".circle");
            if (circle) circle.style.left = "0%";
        }

        // Play/Pause button functionality
        let playButton = document.querySelector(".songbuttons img[src='play.svg'], .songbuttons img[src='pause.svg']");
        if (playButton) {
            playButton.addEventListener("click", function() {
                // Click effect
                this.style.transform = "scale(0.9)";
                setTimeout(() => {
                    this.style.transform = "";
                }, 100);
                
                if (window.currentAudio) {
                    if (window.currentAudio.paused) {
                        window.currentAudio.play();
                        updatePlayPauseButton(true);
                        
                        // Update folder button back to pause when resuming
                        if (currentlyPlayingFolder) {
                            updateFolderPlayButton(currentlyPlayingFolder, true);
                        }
                    } else {
                        window.currentAudio.pause();
                        updatePlayPauseButton(false);
                        
                        // Update folder button to play when pausing
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

        // Previous button functionality
        let prevButton = document.querySelector(".songbuttons img[src='previous.svg']");
        if (prevButton) {
            prevButton.addEventListener("click", function() {
                // Click effect
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

        // Next button functionality
        let nextButton = document.querySelector(".songbuttons img[src='next.svg']");
        if (nextButton) {
            nextButton.addEventListener("click", function() {
                // Click effect
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

        // Initialize button state when page loads
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

// Initialize the application when the page loads
document.addEventListener("DOMContentLoaded", main);