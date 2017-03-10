const fs = require('fs');
const fetch = require('node-fetch');
const getmac = require('getmac');
const child_process = require('child_process');

require('getmac').getMac(function(err,macAddress){
    if (err)  throw err;
    console.log(macAddress);
    fetch(`http://rockstore.herokuapp.com/is_there_new_clip/${macAddress}`)
        .then(res => res.json())
        .then(json => {
            if( json.length > 0 ){
				let cmd = "sudo python /home/pi/Downloads/rpi_ws281x/python/examples/glow_pulse.py pulse"
				const process = child_process.exec(cmd);
				fs.appendFile('/home/pi/pids', process.pid + "\n", function (err) {});
            }
            fs.writeFile("./newClips.json", JSON.stringify(json), function(err) {
                if(err) {
                    return console.log(err);
                }
                console.log("The file was saved!");
                process.exit(0);
            });
        });
});
