async function getSongsFromFolder(folderName) {
    let a = await fetch(`http://127.0.0.1:154/Day-23/video-84/songs/${encodeURIComponent(folderName)}/`)
    let response = await a.text()

    let div = document.createElement("div")
    div.innerHTML = response

    let as = div.getElementsByTagName("a")
    let songs = []

    for (let index = 0; index < as.length; index++) {
        const element = as[index]
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href)
        }
    }
    return songs
}

async function main() {
    let folder1Songs = await getSongsFromFolder("Folder1")
    let folder2Songs = await getSongsFromFolder("Folder 2")

    let allSongs = [...folder1Songs, ...folder2Songs]

    console.log(allSongs)
}

main()