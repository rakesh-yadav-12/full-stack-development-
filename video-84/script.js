async function getSongs() {
    try {
        let a = await fetch("http://127.0.0.1:154/songs/");
        let response = await a.text();

        let div = document.createElement("div");
        div.innerHTML = response;

        let as = div.getElementsByTagName("a");
        let songs = [];
        
        for (let index = 0; index < as.length; index++) {
            const element = as[index];
            if (element.href && element.href.endsWith(".mp3")) {
                let fullPath = decodeURIComponent(element.href);
                
                let songName;
                if (fullPath.includes('\\')) {
                    songName = fullPath.split('\\').pop();
                } else {
                    songName = fullPath.split('/').pop();
                }
                
                songName = songName.replace(/^songs[\\/]/, '');
                songs.push(songName);
            }
        }
        return songs;
    } catch (error) {
        console.error("Error fetching songs:", error);
        return [];
    }
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

// Function to update play/pause button - FIXED
function updatePlayPauseButton(isPlaying) {
    let playButton = document.querySelector(".songbuttons img[src='play.svg'], .songbuttons img[src='pause.svg']");
    if (playButton) {
        if (isPlaying) {
            playButton.src = "pause.svg"; // Show pause when playing
        } else {
            playButton.src = "play.svg"; // Show play when paused (FIXED)
        }
    }
}

// Add CSS for hover effects
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
    `;
    document.head.appendChild(styleSheet);
}

async function main() {
    try {
        let songs = await getSongs();
        console.log("Songs found:", songs);

        if (songs.length === 0) {
            console.log("No songs found!");
            return;
        }

        // Add hover styles
        addHoverStyles();

        // Get the song list container
        let songUL = document.querySelector(".songList ul");
        
        if (!songUL) {
            console.error("No song list ul found in HTML!");
            return;
        }

        // Clear existing items
        songUL.innerHTML = "";

        // Create and append all song items
        songs.forEach((song, index) => {
            let li = createSongItem(song, index, songs);
            songUL.appendChild(li);
        });

        // Play song function
        window.playSong = function(songFile, songsList = songs) {
            let cleanSongFile = songFile.replace(/\\/g, '/').replace(/^songs\//, '');
            
            if (window.currentAudio) {
                window.currentAudio.pause();
            }
            
            window.currentAudio = new Audio(`http://127.0.0.1:154/songs/${encodeURIComponent(cleanSongFile)}`);
            
            // Update song info in playbar
            let songInfo = document.querySelector(".songinfo");
            if (songInfo) {
                let displayName = formatSongName(songFile);
                songInfo.textContent = displayName;
                songInfo.title = displayName; // Add tooltip
            }
            
            // Play the audio
            window.currentAudio.play().catch(e => console.error("Playback failed:", e));
            
            // Update play/pause button
            updatePlayPauseButton(true);
            
            // Handle song end - play next
            window.currentAudio.addEventListener("ended", function() {
                let currentSrc = this.src;
                let currentSongFile = decodeURIComponent(currentSrc.split('/').pop());
                let currentIndex = songsList.findIndex(s => s.includes(currentSongFile));
                
                if (currentIndex < songsList.length - 1) {
                    playSong(songsList[currentIndex + 1], songsList);
                    
                    // Highlight next song
                    let nextLi = document.querySelector(`.songList ul li[data-index="${currentIndex + 1}"]`);
                    highlightActiveSong(nextLi);
                } else {
                    // Last song ended, update button to play
                    updatePlayPauseButton(false);
                }
            });
            
            // Update time periodically
            window.currentAudio.addEventListener("timeupdate", updateTimeDisplay);
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
            }
        }

        // Play/Pause button functionality - FIXED with click effect
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
                    } else {
                        window.currentAudio.pause();
                        updatePlayPauseButton(false);
                    }
                } else if (songs.length > 0) {
                    playSong(songs[0], songs);
                    highlightActiveSong(document.querySelector('.songList ul li:first-child'));
                    updatePlayPauseButton(true);
                }
            });
        }

        // Previous button functionality - ADDED click effect
        let prevButton = document.querySelector(".songbuttons img[src='previous.svg']");
        if (prevButton) {
            prevButton.addEventListener("click", function() {
                // Click effect
                this.style.transform = "scale(0.9)";
                setTimeout(() => {
                    this.style.transform = "";
                }, 100);
                
                if (window.currentAudio && songs.length > 0) {
                    let currentSrc = window.currentAudio.src;
                    let currentSongFile = decodeURIComponent(currentSrc.split('/').pop());
                    let currentIndex = songs.findIndex(song => song.includes(currentSongFile));
                    
                    if (currentIndex > 0) {
                        playSong(songs[currentIndex - 1], songs);
                        let prevLi = document.querySelector(`.songList ul li[data-index="${currentIndex - 1}"]`);
                        highlightActiveSong(prevLi);
                    }
                }
            });
        }

        // Next button functionality - ADDED click effect
        let nextButton = document.querySelector(".songbuttons img[src='next.svg']");
        if (nextButton) {
            nextButton.addEventListener("click", function() {
                // Click effect
                this.style.transform = "scale(0.9)";
                setTimeout(() => {
                    this.style.transform = "";
                }, 100);
                
                if (window.currentAudio && songs.length > 0) {
                    let currentSrc = window.currentAudio.src;
                    let currentSongFile = decodeURIComponent(currentSrc.split('/').pop());
                    let currentIndex = songs.findIndex(song => song.includes(currentSongFile));
                    
                    if (currentIndex < songs.length - 1) {
                        playSong(songs[currentIndex + 1], songs);
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

    } catch (error) {
        console.error("Error in main function:", error);
    }  
}

// Initialize the application when the page loads
document.addEventListener("DOMContentLoaded", main);