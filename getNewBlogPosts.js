const fs = require('fs');
const Q = require('q');
const request = require('request'); // for fetching the feed
const FeedParser = require('feedparser');
const _ = require("lodash");

fs.readFile('most_recently_read_blog_date', 'utf8', function (err, data) {
  const recentDate = new Date(data);
  fs.readFile('./blogs.json', 'utf8', function (err, data) {
    const blogs = JSON.parse(data);
    let newPosts = [], latestDate = recentDate;
    const deferredArr = [];
    _.each(blogs, (blog) => {
      const req = request(blog.url);
      const deferred = Q.defer();
      deferredArr.push(deferred.promise);
      const feedparser = new FeedParser();
    
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
        let item;
        while (	item = stream.read() ){
          if( recentDate < item.date ){
            if( latestDate < item.date )
              latestDate = item.date;
            newPosts.push(item);
          }
        }
        deferred.resolve();
      });
    });
    Q.all(deferredArr).then(() => {
      fs.writeFile("./newBlogPosts.json", JSON.stringify(newPosts), function(err) {
        if( recentDate != latestDate ){
          fs.writeFile("./most_recently_read_blog_date", latestDate, function(err) {
            console.log("most_recently_read_blog_date written!");
          });
        }
        console.log("New blog posts file was saved!");
      });
    });
  });
});