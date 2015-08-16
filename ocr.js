//TODO: pure javascript
var tesseract = require('node-tesseract');
var request = require('request');
var fs = require('fs');

exports.crack = function(captcha_url, callback){
  request(captcha_url).pipe(fs.createWriteStream(__dirname + '/captcha.png')).on('finish', function(){
     tesseract.process(__dirname + '/captcha.png', {'psm':7}, function(err, text){
         if(err){
             callback(false);
         } else {
             callback(text.slice(0,5).toLowerCase());
         }
     });
  });
};

exports.tong = function(a, b) {
    return a + b;
};


