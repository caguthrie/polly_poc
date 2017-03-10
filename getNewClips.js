const fs = require('fs');
const fetch = require('node-fetch');
const getmac = require('getmac');

require('getmac').getMac(function(err,macAddress){
    if (err)  throw err;
    console.log(macAddress);
    fetch(`http://localhost:3000/is_there_new_clip/${macAddress}`)
        .then(res => res.json())
        .then(json => {
            if( json.length > 0 ){
                // CALL SOME LIGHT THING
            }
            fs.writeFile("./newClips.json", JSON.stringify(json), function(err) {
                if(err) {
                    return console.log(err);
                }
                console.log("The file was saved!");
            });
        });
});