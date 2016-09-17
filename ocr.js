//no longer needed because captcha is too hard to crack
(function(){
    //it take lessthan 500 miliseconds to crack
    var internal = {};

    exports.crack = internal.crack = function(captcha_name, callback) {
        /*
        Because MST has changed the captcha which is very difficult to do the scanning
        May need to find another way
        - Showing the captcha
        - Get captcha by user input
        */
        
        var tesseract = require('node-tesseract');
        var fs = require('fs');
        tesseract.process(__dirname + '/' + captcha_name, {'psm':7}, function(err, text) {
            if(err) {
                callback('');
            } else {
                callback(text.toLowerCase().slice(0.5));
            }
        })
    }
    /*
    exports.crack = internal.crack = function(captcha_url, callback){
        var tesseract = require('node-tesseract');
        var request = require('request');
        var fs = require('fs');
        request(captcha_url).pipe(fs.createWriteStream(__dirname + '/captcha.png')).on('finish', function(){
             tesseract.process(__dirname + '/captcha.png', {'psm':7}, function(err, text){
                 if(err){
                     callback('');
                 } else {
                     callback(text.toLowerCase().slice(0,5));
                 }
             });
          });
        };
        */
    
    //Running standalone
    if (!module.parent){
        internal.crack(process.argv[2], function(data){
            console.log('Stand alone mode:', data);
        });
    }
})();



