var tesseract = require('node-tesseract');

console.log(__dirname + '/Downloads/captcha')

tesseract.process(__dirname + '/Downloads/captcha/captcha.png',{'psm':7}, function(err, text){
    if(err){
        console.error(err);
    } else {
        var captcha = text.slice(0,5);
        console.log(text);
        console.log(captcha);
    }
    
})