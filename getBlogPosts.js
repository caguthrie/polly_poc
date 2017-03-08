const FeedParser = require('feedparser');
const request = require('request'); // for fetching the feed
const _ = require('lodash');
var Gpio = require('onoff').Gpio,
  button = new Gpio(18, 'in', 'both');

// Load the SDK
const AWS = require('aws-sdk');
const Stream = require('stream');
const Speaker = require('speaker');
require('/home/pi/Downloads/polly_poc/awsauth.js');

/**
 * Start Polly setup
 */


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
});

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

/**
 * End Polly setup
 */

const blogs = [
    {
        url: 'https://www.blackrockblog.com/feed/',
        dataLocations: {
            title: "title",
            summary: "summary",
            description: "description",
            datetime: "date"
        }
    }  
];

let item, currentDescription;

button.watch(function (err, value) {
  if( value == 1 ){
	  console.log("Button press: " + value);
  }
});

_.forEach(blogs, (blog, i) => {
    const req = request(blog.url);
    const feedparser = new FeedParser();
    
    req.on('error', function (error) {
        throw `can't' make http request ${error}`;
    });
    
    req.on('response', function (res) {
        const stream = this; // `this` is `req`, which is a stream
    
        if (res.statusCode !== 200) {
            this.emit('error', new Error('Bad status code'));
        }
        else {
            stream.pipe(feedparser);
        }
    });
    
    feedparser.on('error', function (error) {
        throw `can't' read from feedparser ${error}`;
    });
    
    feedparser.on('readable', function () {
        // This is where the action is!
        const stream = this; // `this` is `feedparser`, which is a stream
        const meta = this.meta; // **NOTE** the "meta" is always available in the context of the feedparser instance
        while (item = stream.read()) {
            speak(_.get(item, `${blog.dataLocations.title}`, "Title not found!"));
        }
    });
});

let streamPosts = function(stream, location){
	while( true ){
		if( readyToSpeak ) {
			speak(_.get(item, location, "Title not found!"));
		}
	}
	const item = stream.read();
	if( item ){
		
	}
};
