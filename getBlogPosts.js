const FeedParser = require('feedparser');
const request = require('request'); // for fetching the feed
const _ = require('lodash');
const speaker = require("./app2.js");

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



_.forEach(blogs, blog => {
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
        let item;
    
        while (item = stream.read()) {
            speaker.speak(_.get(item, `${blog.dataLocations.title}`, "Title not found!"));
        }
    });
});