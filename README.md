# discord-music-player

This is currently under heavy development.

This package can help you with playing music in a discord.js bot.

## musicClientOptions

| Option |Default|Description|
|---|---|---|
|`earProtections`|`true`|Using `false` will by pass the limit on the volume command, making volumes higher than `100` also work.|
|`loop`|`false`|Using `true` will set the loop setting enabled upon queue creation|
|`volume`|`20`|Volume based on `100`, such that the default setting will be `20/100` and thus make the volume safe for turning the music bot volume in discord to 100%. Tuning up the volume higher than `50` is not recommended. |
