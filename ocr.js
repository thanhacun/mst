//TODO: pure javascript
(function(){
    var internal = {};
    var tesseract = require('node-tesseract');
    var request = require('request');
    var fs = require('fs');
    
    exports.crack = internal.crack = function(captcha_url, callback){
      var start = new Date().getTime();
      request(captcha_url).pipe(fs.createWriteStream(__dirname + '/captcha.png')).on('finish', function(){
         tesseract.process(__dirname + '/captcha.png', {'psm':7}, function(err, text){
             if(err){
                 callback(false);
             } else {
                 var end = new Date().getTime();
                 console.log(text.slice(0,5), 'Time to crack: ', end - start);
                 callback(text.toLowerCase().slice(0,5));
             }
         });
      });
    };
    
    exports.tong = internal.tong = function(a, b) {
        return a + b;
    };
    
    //Running standalone mode
    if (!module.parent){
        internal.crack(process.argv[2], function(data){
            console.log('Stand alone mode:', data);
        });
    }
})();



