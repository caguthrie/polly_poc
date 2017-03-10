const fs = require('fs');
const http = require('http');
const getmac = require('getmac');
const child_process = require('child_process');

require('getmac').getMac(function(err,macAddress){
    if (err)  throw err;
    console.log(macAddress);
    const result = child_process.execSync(`curl http://rockstore.herokuapp.com/is_there_new_clip/${macAddress}`);
    console.log(result.toString());
    fs.writeFile("./newClips.json", result.toString(), function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("The file was saved!");
        process.exit(0);
    });
});
