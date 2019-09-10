import { Message } from "discord.js"
import * as ytdl from "ytdl-core"
var YouTube = require("simple-youtube-api")

interface musicClient {
    google_api_key: string
    youtube: any
    queueList: any
}

class musicClient {
    public constructor(GoogleApiKey: string) {
        this.google_api_key = GoogleApiKey
        this.youtube = new YouTube(this.google_api_key)
        this.queueList = new Map()
    }
    public async play(msg: Message, searchString: string) {
        const youtube = this.youtube
        const url = searchString ? searchString.replace(/<(.+)>/g, '$1') : '';
        const voiceChannel = msg.member.voiceChannel;
        if (!voiceChannel) return msg.channel.send('I\'m sorry but you need to be in a voice channel to play music!').then((m: Message) => {
            return m.delete(10000)
        })
        const permissions = voiceChannel.permissionsFor(msg.client.user);
        if (!permissions.has('CONNECT'))
            return msg.channel.send('I cannot connect to your voice channel, make sure I have the proper permissions!').then((m: Message) => {
                return m.delete(10000)
            })
        if (!permissions.has('SPEAK'))
            return msg.channel.send('I cannot speak in this voice channel, make sure I have the proper permissions!').then((m: Message) => {
                return m.delete(10000)
            })
        if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
            const playlist = await youtube.getPlaylist(url);
            const videos = await playlist.getVideos();
            let video: any
            for (video of Object.values(videos)) {
                const video2 = await youtube.getVideoByID(video.id); // eslint-disable-line no-await-in-loop
                await musicFunctions.handleVideo(video2, msg, voiceChannel, true); // eslint-disable-line no-await-in-loop
            }
            return msg.channel.send(`✅ Playlist: **${playlist.title}** has been added to the queue!`).then((m: Message) => {
                return m.delete(10000)
            })
        } else {
            try {
                var video = await youtube.getVideo(url);
            } catch (error) {
                try {
                    var videos = await youtube.searchVideos(searchString, 10);
                    let index = 0;
                    msg.channel.send(`
__**Song selection:**__

${videos.map((video2) => { return `**${++index} -** ${video2.title}` }).join('\n')}

Please provide a value to select one of the search results ranging from 1-10.
					`).then((m: Message) => {
                        return m.delete(10000)
                    })
                    // eslint-disable-next-line max-depth
                    try {
                        var response = await msg.channel.awaitMessages((msg2) => { return msg2.content > 0 && msg2.content < 11 }, {
                            errors: ['time'],
                            maxMatches: 1,
                            time: 10000
                        });
                    } catch (err) {
                        console.error(err);
                        return msg.channel.send('No or invalid value entered, cancelling video selection.').then((m: Message) => {
                            return m.delete(10000)
                        })
                    }
                    const videoIndex = parseInt(response.first().content);
                    var video = await youtube.getVideoByID(videos[videoIndex - 1].id);
                } catch (err) {
                    console.error(err);
                    return msg.channel.send('🆘 I could not obtain any search results.').then((m: Message) => {
                        return m.delete(10000)
                    })
                }
            }
            return musicFunctions.handleVideo(video, msg, voiceChannel)
        }
    }
    public async playTop(msg: Message, searchString: string) {
        var youtube = this.youtube
        const url = searchString ? searchString.replace(/<(.+)>/g, '$1') : '';
        const voiceChannel = msg.member.voiceChannel;
        if (!voiceChannel)
            return msg.channel.send('I\'m sorry but you need to be in a voice channel to play music!').then((m: Message) => {
                return m.delete(10000)
            })
        const permissions = voiceChannel.permissionsFor(msg.client.user);
        if (!permissions.has('CONNECT'))
            return msg.channel.send('I cannot connect to your voice channel, make sure I have the proper permissions!').then((m: Message) => {
                return m.delete(10000)
            })
        if (!permissions.has('SPEAK'))
            return msg.channel.send('I cannot speak in this voice channel, make sure I have the proper permissions!').then((m: Message) => {
                return m.delete(10000)
            })
        if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
            return msg.channel.send("You cannot use +play-top with a playlist.").then((m: Message) => {
                return m.delete(10000)
            })
        } else {
            try {
                var video = await youtube.getVideo(url);
            } catch (error) {
                try {
                    var videos = await youtube.searchVideos(searchString, 10);
                    let index = 0;
                    msg.channel.send(`
__**Song selection:**__

${videos.map((video2) => { return `**${++index} -** ${video2.title}` }).join('\n')}

Please provide a value to select one of the search results ranging from 1-10.
					`).then((m: Message) => {
                        return m.delete(10000)
                    })
                    // eslint-disable-next-line max-depth
                    try {
                        var response = await msg.channel.awaitMessages((msg2) => { return msg2.content > 0 && msg2.content < 11 }, {
                            errors: ['time'],
                            maxMatches: 1,
                            time: 10000
                        });
                    } catch (err) {
                        console.error(err);
                        return msg.channel.send('No or invalid value entered, cancelling video selection.').then((m: Message) => {
                            return m.delete(10000)
                        })
                    }
                    const videoIndex = parseInt(response.first().content);
                    var video = await youtube.getVideoByID(videos[videoIndex - 1].id);
                } catch (err) {
                    console.error(err);
                    return msg.channel.send('🆘 I could not obtain any search results.').then((m: Message) => {
                        return m.delete(10000)
                    })
                }
            }
            return musicFunctions.handleVideo(video, msg, voiceChannel, false, true)
        }
    }
    public stop(msg: Message) {
        const queue = this.queueList
        const serverQueue = queue.get(msg.guild.id);
        if (!msg.member.voiceChannel) return msg.channel.send('You are not in a voice channel!').then((m: Message) => { return m.delete(10000) })
        if (!serverQueue) return msg.channel.send('There is nothing playing that I could stop for you.').then((m: Message) => { return m.delete(10000) })
        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end("Bot got stopped.")
    }
    public skip(msg: Message) {
        const queue = this.queueList
        const serverQueue = queue.get(msg.guild.id);
        if (!msg.member.voiceChannel) return msg.channel.send('You are not in a voice channel!').then((m: Message) => { return m.delete(10000) })
        if (!serverQueue) return msg.channel.send('There is nothing playing that I could skip for you.').then((m: Message) => { return m.delete(10000) })
        serverQueue.connection.dispatcher.end("Song got skipped.")
    }
    public showQueue(msg: Message) {
        const queue = this.queueList
        const serverQueue = queue.get(msg.guild.id);
        if (!serverQueue) return msg.channel.send('There is nothing playing.').then((m: Message) => { return m.delete(10000) })
        var index = 0
        var songArray = serverQueue.songs.map((song) => { return `**${++index}-** [${song.title}](${song.url})` })
        musicFunctions.addMusicQueueField(msg, songArray).then(async (results) => {
            for (let i = 0; i < results.length; i++) {
                await new Promise((r) => { return setTimeout(r, 500) })
                const element = results[i];
                msg.channel.send(element).then((m: Message) => { return m.delete(30000) })
            }
        })
    }
    public remove(msg, number) {
        const queue = this.queueList
        const serverQueue = queue.get(msg.guild.id);
        if (!serverQueue) return msg.channel.send('There is nothing playing.').then((m) => { return m.delete(10000).catch((e) => { if (e) console.log("Deleting a deleted message from #choose-song-area") }) })
        var deleteIndex = number - 1
        if (deleteIndex === 0) return msg.channel.send(`You cannot remove the song that is now playing. To remove it, use skip command instead.`).then((m) => { return m.delete(10000) })
        var removed = serverQueue.songs.splice(deleteIndex, 1)
        msg.channel.send(`**${removed[0].title}** has been removed from the queue.`).then((m) => { return m.delete(10000).catch((e) => { if (e) console.log("Deleting a deleted message from #choose-song-area") }) })
        var index = 0
        var songArray = serverQueue.songs.map((song) => { return `**${++index}-** [${song.title}](${song.url})` })
        musicFunctions.addMusicQueueField(msg, songArray).then(async (results) => {
            for (let i = 0; i < results.length; i++) {
                await new Promise((r) => { return setTimeout(r, 500) })
                const element = results[i];
                msg.channel.send(element).then((m) => { return m.delete(30000) })
            }
        })
    }
}

const musicFunctions = {
    async addMusicQueueField(msg, content) {
        const { Discord, queue } = require("../../core/exports")
        const videoTotalLength = require("./videoTotalLength")
        const serverQueue = queue.get(msg.guild.id);
        var toSendEmbed = []
        var color = Math.floor(Math.random() * 16777214) + 1
        let i = 0
        var totalLength = videoTotalLength(content)
        while (i < content.length) {
            var embed = new Discord.RichEmbed()
            let index = 0
            while (i < content.length && index < 25) {
                var list = []
                const element0 = content[i];
                index++
                i++
                const element1 = content[i];
                index++
                i++
                const element2 = content[i];
                index++
                i++
                const element3 = content[i];
                index++
                i++
                const element4 = content[i];
                index++
                i++
                list.push(element0)
                element1 ? list.push(element1) : console.log("Empty element")
                element1 ? list.push(element2) : console.log("Empty element")
                element1 ? list.push(element3) : console.log("Empty element")
                element1 ? list.push(element4) : console.log("Empty element")
                if (i < 25) {
                    embed.setTitle(`Song queue for ${msg.guild.name}`)
                    embed.setDescription(`There are ${serverQueue.songs.length} songs in total.\nThe play back will ends in **${totalLength.hours}:${totalLength.minutes}:${totalLength.seconds}**.`)
                    embed.setAuthor(msg.author.username, msg.author.avatarURL)
                }
                embed.setTimestamp()
                embed.setFooter(`Now playing : ${serverQueue.songs[0].title}`)
                embed.addField("** **", list.join("\n"))
                embed.setColor(color)
            }
            toSendEmbed.push(embed)
        }
        return toSendEmbed
    },
    async handleVideo(video, msg, voiceChannel, playlist = false, top = false) {
        const serverQueue = this.queue.get(msg.guild.id);
        const song = {
            guild: msg.guild.name,
            icon: video.thumbnails.default.url,
            id: video.id,
            length: {
                hrs: video.duration.hours,
                mins: video.duration.minutes,
                secs: video.duration.seconds
            },
            title: video.title,
            url: `https://www.youtube.com/watch?v=${video.id}`
        };
        if (!serverQueue) {
            const queueConstruct = {
                connection: null,
                loop: false,
                playing: true,
                repeat: false,
                songs: [],
                textChannel: msg.channel,
                voiceChannel,
                volume: 30
            };
            this.queue.set(msg.guild.id, queueConstruct);
            queueConstruct.songs.push(song);
            console.log("Song added to queue.")
            try {
                var connection = await voiceChannel.join();
                queueConstruct.connection = connection;
                this.playMusic(msg.guild, queueConstruct.songs[0]);
            } catch (error) {
                console.error(`I could not join the voice channel: ${error}`);
                this.queue.delete(msg.guild.id);
                return msg.channel.send(`I could not join the voice channel: ${error}`).then((m) => {
                    return m.delete(10000)
                })
            }
        } else {
            if (top) {
                serverQueue.songs.splice(1, 0, song)
                if (playlist) return undefined;
                else return msg.channel.send(`✅ **${song.title}** has been added to the queue!`).then((m) => {
                    return m.delete(10000)
                })
            } else {
                serverQueue.songs.push(song);
                if (playlist) return undefined;
                else return msg.channel.send(`✅ **${song.title}** has been added to the queue!`).then((m) => {
                    return m.delete(10000)
                })
            }
        }
        return undefined;
    },
    playMusic(guild, song) {
        const serverQueue = this.queue.get(guild.id);
        try {
            if (!song) {
                serverQueue.voiceChannel.leave();
                this.queue.delete(guild.id);
                return;
            }
        } catch (error) {
            console.log(error)
        }
        const dispatcher = serverQueue.connection.playStream(ytdl(song.url, {
            filter: "audioonly",
            highWaterMark: 1024 * 512,
            quality: "highestaudio"
        })).on('end', (reason) => {
            if (serverQueue.loop === true) {
                console.log("Song ended, but looped")
                var toPush = serverQueue.songs[0]
                serverQueue.songs.push(toPush)
                serverQueue.songs.shift();
                this.playMusic(guild, serverQueue.songs[0]);
            } else if (serverQueue.repeat === true) {
                console.log("Song ended, but repeated")
                this.playMusic(guild, serverQueue.songs[0]);
            } else {
                if (reason === 'Stream is not generating quickly enough.') console.log('Song ended.')
                else console.log(reason)
                serverQueue.songs.shift();
                this.playMusic(guild, serverQueue.songs[0]);
            }
        }).on('error', (error) => { return console.error(error) });
        dispatcher.setVolumeLogarithmic(serverQueue.volume / 100);
        serverQueue.textChannel.send(`🎶 Start playing: **${song.title}**`).then((m) => {
            return m.delete(10000)
        })
    }
}

module.exports = musicClient