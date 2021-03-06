//Written By: Monib Baray
//Last Updated: 5/11/2020, 12:51AM
//Version 1.0.0

//import all dependencies
const Discord = require('discord.js')
const {prefix ,token} = require('./config.json');
const ytdl = require('ytdl-core');

const client = new Discord.Client();

const queue = new Map();


//Basic listeners
client.once('ready', () => {console.log('Ready!');});
client.once('reconnecting', () => {console.log('Reconnecting');});
client.once('disconnect', () => {console.log('Disconnect!');});




//Reading command inputs and re-directing to the appropriate function
client.on('message', async message => {
    client.user.setActivity('!help for details', {type: 'PLAYING' });
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    const serverQueue = queue.get(message.guild.id);
    if (message.content.startsWith(`${prefix}play`)) {
        execute(message, serverQueue);
        return;
    }
    else if (message.content.startsWith(`${prefix}skip`)) {
        skip(message, serverQueue);
        return;
    }
    else if (message.content.startsWith(`${prefix}help`)) {
        help(message, serverQueue);
        return;
    }
    else if (message.content.startsWith(`${prefix}bad`)) {
        bad(message, serverQueue);
        return;
    }
    else if (message.content.startsWith(`${prefix}leave`)) {
        leave(message, serverQueue);
        return;
    }
    else if (message.content.startsWith(`${prefix}soundbytes`)) {
        soundbytes(message, serverQueue);
    }
    else if (message.content.startsWith(`${prefix}frustration`)) {
        frustration(message, serverQueue);
    }
    else
    {
        message.channel.send("Enter a valid command (!help for details)") ;
    }
});

async function execute(message, serverQueue)
{
    const args = message.content.split(" ");
    const voiceChannel = message.member.voice.channel;
        if (!voiceChannel)
        return message.channel.send("You need to be in a voice channel to play music!");
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {return message.channel.send("I need PERMISSIONS");}


    const songInfo = await ytdl.getInfo(args[1]);
    const song = {title: songInfo.title, url: songInfo.video_url} ;

    if (!serverQueue)
    {
        const queueConstruct = {
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true
        };

        queue.set(message.guild.id, queueConstruct);

        queueConstruct.songs.push(song);

        try 
        {
            var connection = await voiceChannel.join();
            queueConstruct.connection = connection;
            play(message.guild, queueConstruct.songs[0]);
        }
        catch (err) 
        {
            console.log(err);
            queue.delete(message.guild.id);
            return message.channel.send(err);
        }
    }
    else
    {
        serverQueue.songs.push(song);
        return message.channel.send(`${song.title} has been added to the queue!`);
    }
} //end execute
async function skip(message, serverQueue)
{
    if(!message.member.voice.channel)
        return message.channel.send("You have to be in a voice channel to stop the music");
    if (!serverQueue)
        return message.channel.send("There is no song to skip") ;
    serverQueue.connection.dispatcher.end() ;
} //end skip

async function help(message, serverQueue)
{
    return message.channel.send(
            "This bot is made to play music from youtube or sound bytes from a local folder. The following commands are currently available:" +
            `\n**!play youtube url**: The bot will join your current voice channel and play *youtube url*` +
            `\n**!skip**: This will skip the current song and move to the next song in queue (if there are no more songs, the bot will leave)` +
            `\n**!leave**: This will cause the bot to leave the voice channel` +
            `\n**!soundbytes**: This will list all possible sound bytes the bot can play`
        )
} //end help

async function soundbytes(message, serverQueue)
{
    return message.channel.send(
            "The following soundbytes are currently available:" +
            `\n**!bad**: This will play the soundbyte from *Recess* where Vince says "and when i say bad, I mean actually bad"`
        )
} //end help

function play(guild, song) 
{
    const serverQueue = queue.get(guild.id) ;
    if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }

    const dispatcher = serverQueue.connection
        .play(ytdl(song.url))
        .on("finish", () => {
            serverQueue.songs.shift();
            play(guild, serverQueue.songs[0]);
        })
        .on("error", error => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    serverQueue.textChannel.send(`Start playing: **${song.title}**`);
} //end play

async function bad(message, serverQueue)
{
    if (!message.member.voice.channel)
        return message.channel.send("You have to be in a voice channel to play audio bytes");
    var voiceChannel = message.member.voice.channel;
    voiceChannel.join().then(connection => 
    {
        const dispatcher = connection.play('./Audio/bad.mp3');
        //dispatcher.on("end", end => {voiceChannel.leave();});
    }).catch(err => console.log(err));

} //end bad

async function frustration(message, serverQueue)
{
    if (!message.member.voice.channel)
        return message.channel.send("You have to be in a voice channel to play audio bytes");
    var voiceChannel = message.member.voice.channel;
    voiceChannel.join().then(connection => 
    {
        const dispatcher = connection.play('./Audio/frustration.wav');
    }).catch(err => console.log(err));
    
} //end bad

async function leave(message, serverQueue)
{
    if (!message.member.voice.channel)
        return message.channel.send("You have to be in a voice channel to make me leave");

    message.member.voice.channel.leave();
    return message.channel.send("Goodbye.");
} //end leave

client.login(token);

