const fs = require('fs');
const request = require('request');
const Player = require('player');
const _ = require('lodash');
const getmac = require('getmac');

const SERVER_ROOT = "http://";

let download = function (url, dest, cb) {
	console.log(url);
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

fs.readFile('./newClips.json', 'utf8', function (err, data) {
    if (err) throw err; // we'll not consider error handling for now
    const clips = JSON.parse(data);
    
    if( clips.length == 0 ){
        console.log("No clips to play!");
        process.exit(0);
    }
    else{
        require('getmac').getMac(function(err,macAddress) {
            // TODO this is a hack -- only play the first clip found
            download(SERVER_ROOT + clips[0].clip.substring(2,99999), 'out.mp3', () => {
                const player = new Player('./out.mp3');
                request.get(`http://rockstore.herokuapp.com/history/${clips[0].id}/${macAddress}`);
                // play now and callback when playend
                player.play(function (err, player) {
                    console.log('playend!');
                }).on('error', function (err) {
                    // Dont care about this
                });

            });
        });
    }
});

