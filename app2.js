// Load the SDK
const AWS = require('aws-sdk');
const Stream = require('stream');
const Speaker = require('speaker');
require('/home/pi/Downloads/polly_poc/awsauth.js');

// Create an Polly client
const Polly = new AWS.Polly({
    signatureVersion: 'v4',
    region: 'us-east-1'
});

// Create the Speaker instance
let Player = new Speaker({
    channels: 1,
    bitDepth: 16,
    sampleRate: 8000
})

Player.doneWithChunk = function(){
	console.log("donezo");
};

var AudioStream = new Stream.Readable();
AudioStream._read = function () {};
AudioStream.pipe(Player);



/**
 * Use Amazon Polly
 * @param  {string} text    Text to speek
 * @param  {string} VoiceId (optional) Amazon Polly Voice
 */
let speak = function(text){
    let params = {
        'Text': text,
        'SampleRate': "8000",
        'OutputFormat': 'pcm',
        'VoiceId': 'Brian'
    };

    Polly.synthesizeSpeech(params, (err, data) => {
        if (err) {
            console.log(err.code)
        } else if (data) {
            if (data.AudioStream instanceof Buffer) {
                AudioStream.push(data.AudioStream)
            }
        }
    })
};

exports.speak = speak;

// speak("hello, I am the Blackrock Black Rock. I was built by Matt Sahn and Chris Guthrie to win the hackathon. I know all sorts of shit about financial markets, stocks, bonds, rocks, stones, and pebbles. ");
