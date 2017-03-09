const fs = require('fs');
const request = require('request');
const Player = require('player');

let download = function (url, dest, cb) {
    let file = fs.createWriteStream(dest);
    let sendReq = request.get(url);

    // verify response code
    sendReq.on('response', function (response) {
        if (response.statusCode !== 200) {
            console.log('Response status was ' + response.statusCode);
            process.exit(0);
        }
    });

    // check for request errors
    sendReq.on('error', function (err) {
        fs.unlink(dest);
        console.log(err.message);
        process.exit(1);
    });

    sendReq.pipe(file);

    file.on('finish', function () {
        file.close(cb);  // close() is async, call cb after close completes.
    });

    file.on('error', function (err) { // Handle errors
        fs.unlink(dest); // Delete the file async. (But we don't check the result)
        console.log(err.message);
        process.exit(1);
    });
};

download("http://rockstore.herokuapp.com/latest_unread/0e:bc:32:d3:64:6c", 'out.mp3', () => {
    const player = new Player('./out.mp3');

    // play now and callback when playend
    player.play(function(err, player){
        console.log('playend!');
    });

});

