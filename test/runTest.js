const musicClient = require("../index")
const music = new musicClient("Some-API-keys-here", {
    awaitSongChoose: 15,
    earProtections: false,
    loop: true,
    volume: 40
})
console.log(music)
console.log("Test completed !")
