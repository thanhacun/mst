//TODO: pure javascript
(function(){
    //it take lessthan 500 miliseconds to crack
    var internal = {};
    var tesseract = require('node-tesseract');
    var request = require('request');
    var fs = require('fs');
    
    exports.crack = internal.crack = function(captcha_url, callback){
      request(captcha_url).pipe(fs.createWriteStream(__dirname + '/captcha.png')).on('finish', function(){
         tesseract.process(__dirname + '/captcha.png', {'psm':7}, function(err, text){
             if(err){
                 callback(false);
             } else {
                 callback(text.toLowerCase().slice(0,5));
             }
         });
      });
    };
    
    //Running standalone mode
    if (!module.parent){
        internal.crack(process.argv[2], function(data){
            console.log('Stand alone mode:', data);
        });
    }
})();



