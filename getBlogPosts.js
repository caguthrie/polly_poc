const dbConnection = require('./db.js');
const FeedParser = require('feedparser');
const request = require('request'); // for fetching the feed
const _ = require('lodash');
const Q = require('q');
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

// Gross hack for hackathon: After line 274 in node_modules/speaker/index.js
// self.doneWithChunk && self.doneWithChunk();
Player.doneWithChunk = () => {
	setTimeout(() => {
		const lastDeferred = _.find(deferred, (def) => def.promise.inspect().state === "pending");
		lastDeferred.resolve();
	}, 2000);
};

let AudioStream = new Stream.Readable();
AudioStream._read = () => {return {}};
AudioStream.pipe(Player);


let deferred = [];

/**
 * Use Amazon Polly
 * @param  {string} text    Text to speek
 * @param  {string} VoiceId (optional) Amazon Polly Voice
 */
let speak = (text) => {
	deferred = deferred.filter((def) => def.promise.inspect().state === "pending");
	deferred.push(Q.defer());
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
    });
    return Q.all(deferred.map((def) => def.promise));
};

/**
 * End Polly setup
 */

const blogs = [
    {
        url: 'http://larryfinkdoppleganger.blogspot.com/feeds/posts/default?alt=rss',
        title: "Larry Fink's Blog",
        dataLocations: {
            title: "title",
            description: "description",
            datetime: "date"
        }
    },
	{
        url: 'https://www.blackrockblog.com/feed/',
        title: "The BlackRock Blog",
        dataLocations: {
            title: "title",
            description: "description",
            datetime: "date"
        }
    } 
];

let item, currentlyReading;

button.watch((err, value) => {
  if( value == 1 && currentlyReading ){
	  let desc = _.get(currentlyReading.item, `${currentlyReading.blog.dataLocations.description}`, "Description not found!");
	  const strippedDesc = desc.replace(/<(?:.|\n)*?>/gm, '').replace(/&#8217;/g,"'");
	  let str = "Now reading from article: " + _.get(currentlyReading.item, `${currentlyReading.blog.dataLocations.title}`, "Title not found!");
	  str += strippedDesc.substring(0,1000);
	  currentlyReading = null;
	  speak(str);
  }
});

function processBlog(blogNumber){
	const blog = blogs[blogNumber];
	speak("Reading posts from " + blog.title, "").then(() => {;
		const req = request(blog.url);
		const feedparser = new FeedParser();
		let onlyReadOnce = true;
		
		req.on('error', (error) => {
			throw `can't' make http request ${error}`;
		});
		
		req.on('response', function(res){
			const stream = this; // `this` is `req`, which is a stream
		
			if (res.statusCode !== 200) {
				this.emit('error', new Error('Bad status code'));
			}
			else {
				stream.pipe(feedparser);
			}
		});
		
		feedparser.on('error', (error) => {
			throw `can't' read from feedparser ${error}`;
		});
		
		feedparser.on('readable', function(){
			// This is where the action is!
			const stream = this; // `this` is `feedparser`, which is a stream
			const meta = this.meta; // **NOTE** the "meta" is always available in the context of the feedparser instance
			if( onlyReadOnce ){
				onlyReadOnce = false;
				const def = Q.defer();
				streamPost( stream, blog, 1, def).then(() => {
					if( blogs.length > blogNumber + 1 )
						processBlog(blogNumber + 1)
					else
						process.exit(0);
				});
			}
		});
	});
}

processBlog(0);


let streamPost = (stream, blog, postNumber, def) => {
	const item = stream.read();
	if( item ){
		const postTitle =_.get(item, `${blog.dataLocations.title}`, "Title not found!");
		dbConnection.checkIfReadOrSavePost(blog.title, postTitle).then((alreadyRead) => {
			// If already read, go to the next post
			if( alreadyRead && !process.argv.includes("-nodb"))
				streamPost(stream, blog, postNumber, def);
			else{
				// If not read yet, speak it and go onto the next post when completed
				currentlyReading = {item, blog};
				speak(`#${postNumber}: ${postTitle}`).then(() => {
					streamPost(stream, blog, postNumber + 1, def);
				});
			}
		});
	}
	else{
		let finshedBlogStr;
		if( postNumber == 1 )
			finshedBlogStr = `That's unfortunate. There are no unread posts on ${blog.title}.`;
		else
			finshedBlogStr = `What a pity. That's all the articles I can find for ${blog.title}`;
		speak(finshedBlogStr).then(() => def.resolve());
	}
	return def.promise;
};
