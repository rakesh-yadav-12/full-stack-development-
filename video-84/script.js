async function getSongs() {
    let a = await fetch("http://127.0.0.1:154/songs/");
    let response = await a.text();

    let div = document.createElement("div");
    div.innerHTML = response;

    let as = div.getElementsByTagName("a");
    let songs = [];

    for (let element of as) {
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.replace(/\\/g, "/"));
        }
    }
    return songs;
}

async function main() {
    let songs = await getSongs();
    console.log(songs);

    let audio = new Audio(songs[0]);
    audio.play();

    audio.addEventListener("loadeddata", () => {
        console.log(audio.duration, audio.currentSrc, audio.currentTime);
    });
}

main();