let currSong = new Audio();
let songs = [];
let currFolder = "";

// Utility to convert seconds to mm:ss format
function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
    const secs = String(Math.floor(seconds % 60)).padStart(2, '0');
    return `${minutes}:${secs}`;
}

// Load songs from a folder and populate UI
async function getSongs(folder) {
    try {
        currFolder = folder;
        const response = await fetch(`${folder}/`);
        const text = await response.text();
        const div = document.createElement("div");
        div.innerHTML = text;

        const anchors = div.getElementsByTagName("a");
        songs = [];
        for (const a of anchors) {
            if (a.href.endsWith(".mp3")) {
                songs.push(a.href.split(`${folder}/`)[1]);
            }
        }

        const songUl = document.querySelector(".songList ul");
        songUl.innerHTML = "";
        for (const song of songs) {
            const cleanName = decodeURIComponent(song.replaceAll("%20", " "));
            songUl.innerHTML += `
                <li>
                    <img class="invert" src="/imgs/music.svg" alt="music">
                    <div class="info">
                        <div>${cleanName}</div>
                        <div>Bhagyesh</div>
                    </div>
                    <img class="invert" src="/imgs/play.svg" alt="play">
                </li>`;
        }

        // Attach click listeners
        document.querySelectorAll(".songList li").forEach(li => {
            li.addEventListener("click", () => {
                const songName = li.querySelector(".info div").innerText.trim();
                playMusic(songName);
            });
        });

        return songs;
    } catch (error) {
        console.error("Error loading songs:", error);
    }
}

// Play music
function playMusic(track, pause = false) {
    currSong.src = `${currFolder}/${track}`;
    if (!pause) {
        currSong.play();
        document.getElementById("play").src = "/imgs/pause.svg";
    }
    document.querySelector(".songinfo").innerText = decodeURIComponent(track);
    document.querySelector(".songtime").innerText = "00:00 / 00:00";
}

// Display album cards dynamically
async function displayAlbums() {
    try {
        const response = await fetch(`songs/`);
        const text = await response.text();
        const div = document.createElement("div");
        div.innerHTML = text;

        const anchors = Array.from(div.getElementsByTagName("a"));
        const cardContainer = document.querySelector(".cardContainer");

        for (const anchor of anchors) {
            if (anchor.href.includes("songs/") && !anchor.href.includes(".htaccess")) {
                const folder = anchor.href.split("/").slice(-1)[0];
                try {
                    const res = await fetch(`songs/${folder}/info.json`);
                    const json = await res.json();

                    cardContainer.innerHTML += `
                        <div data-folder="${folder}" class="card">
                            <div class="play">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                                    <path d="M18.9 12.8c-.35 1.34-2.02 2.29-5.37 4.18-3.23 1.83-4.84 2.75-6.14 2.38a3.12 3.12 0 01-1.42-.84C5 17.6 5 15.74 5 12c0-3.74 0-5.61.96-6.58.4-.4.89-.7 1.43-.84 1.3-.37 2.91.55 6.14 2.38 3.35 1.9 5.02 2.84 5.37 4.18.15.56.15 1.14 0 1.7z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
                                </svg>
                            </div>
                            <img src="songs/${folder}/cover.jpg" alt="Album Cover"/>
                            <h2>${json.title}</h2>
                            <p>${json.description}</p>
                        </div>`;
                } catch (e) {
                    console.warn(`Could not load info.json for ${folder}`);
                }
            }
        }

        document.querySelectorAll(".card").forEach(card => {
            card.addEventListener("click", async () => {
                songs = await getSongs(`songs/${card.dataset.folder}`);
                playMusic(songs[0]);
            });
        });
    } catch (err) {
        console.error("Error displaying albums:", err);
    }
}

// App main logic
async function main() {
    await getSongs("songs/bollywood");
    playMusic(songs[0], true);
    await displayAlbums();

    // Play / Pause toggle
    document.getElementById("play").addEventListener("click", () => {
        if (currSong.paused) {
            currSong.play();
            play.src = "imgs/pause.svg";
        } else {
            currSong.pause();
            play.src = "imgs/play.svg";
        }
    });

    // Time and seekbar
    currSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerText = `${secondsToMinutesSeconds(currSong.currentTime)} / ${secondsToMinutesSeconds(currSong.duration)}`;
        document.querySelector(".circle").style.left = `${(currSong.currentTime / currSong.duration) * 100}%`;
    });

    document.querySelector(".seekbar").addEventListener("click", (e) => {
        const percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        currSong.currentTime = (currSong.duration * percent) / 100;
        document.querySelector(".circle").style.left = `${percent}%`;
    });

    // Sidebar toggles
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    // Previous button
    document.getElementById("previous").addEventListener("click", () => {
        const index = songs.indexOf(currSong.src.split("/").slice(-1)[0]);
        if (index > 0) {
            playMusic(songs[index - 1]);
        } else {
            playMusic(songs[0]);
        }
    });

    // Next button
    document.getElementById("next").addEventListener("click", () => {
        const index = songs.indexOf(currSong.src.split("/").slice(-1)[0]);
        if (index < songs.length - 1) {
            playMusic(songs[index + 1]);
        } else {
            playMusic(songs[0]);
        }
    });

    // Volume range input
    document.querySelector(".range input").addEventListener("input", (e) => {
        const vol = parseInt(e.target.value) / 100;
        currSong.volume = vol;
        if (vol > 0) {
            document.querySelector(".volume img").src = "imgs/volume.svg";
        }
    });

    // Volume mute toggle
    document.querySelector(".volume img").addEventListener("click", (e) => {
        if (e.target.src.includes("volume.svg")) {
            e.target.src = "imgs/mute.svg";
            currSong.volume = 0;
            document.querySelector(".range input").value = 0;
        } else {
            e.target.src = "imgs/volume.svg";
            currSong.volume = 0.1;
            document.querySelector(".range input").value = 10;
        }
    });
}

main();
