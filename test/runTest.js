var musicClient = require("../core")
// Do NOT ever use this setting
const musicPlayer = new musicClient("This-is-not-an-api-key", {
    earProtections: false,
    loop          : true,
    volume        : 100
})
console.log(musicClient)
console.log(musicPlayer.youtube)
console.log(musicPlayer.google_api_key)
console.log(musicPlayer.queueList)
console.log(musicPlayer.settings)
console.log("Test passed !")
