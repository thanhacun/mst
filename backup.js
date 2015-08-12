//TODO need to rewrite
var express = require('express');
var bodyParser = require('body-parser');
var fs = require("fs");
var request = require('request');
var cheerio = require('cheerio');
var tesseract = require('node-tesseract');

var app = express();

function crack(captcha_url, callback){
  //given the captcha link, return its value
  request
    .get(captcha_url)
    .on('response', function(response){
      console.log(response.statusCode);
    })
    .pipe(fs.createWriteStream(__dirname + '/captcha.png')).on('finish', function(){
      tesseract.process(__dirname + '/captcha.png', function(error, result){
        if (error){
          console.err(error);
          return callback(error);
        } else {
          return callback((result.slice(0,5)).toLowerCase());
        }
      });
    });
}

var captcha ='2ccp4';
var cookie = 'NSC_UsbDvvOOU=ffffffff09485db245525d5f4f58455e445a4a421548; JSESSIONID=0000ILCUuI86erIto4unZ3Ctad5:19ciqlppd';
var options = {};
  
app.get('/test/:mst', function(req, res){
  //getting mst testing with 0100112846
  var homepage = 'http://tracuunnt.gdt.gov.vn';
  var url = 'http://tracuunnt.gdt.gov.vn/tcnnt/mstdn.jsp';
  var query = '?action=action&mst=' + req.params.mst + '&captcha=';
  var mst = req.params.mst;

  //init and get cookie; and captcha
  options = {
    uri: url,
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.130 Safari/537.36'
    }
  }
  request(options, function(err1, res1, body1){
    if (!err1){
      if (res1.headers['set-cookie']){
        var raw_cookie = res1.headers['set-cookie'];
        //preparing cookie for next request
        //cookie = raw_cookie[1].split(';')[0] + '; ' + raw_cookie[0].split(';')[0];
        cookie = 'NSC_UsbDvvOOU=ffffffff09485db345525d5f4f58455e445a4a421548; ' + raw_cookie[0].split(';')[0];
        //cookie = raw_cookie[0].split(';')[0];
        
        var $ = cheerio.load(body1);
        var captcha_url = homepage + $('img').attr('src');
        //console.log(raw_cookie);
        
        //download captcha image and decode it
        request(captcha_url).pipe(fs.createWriteStream(__dirname + '/captcha.png')).on('finish', function(){
          tesseract.process(__dirname + '/captcha.png', {'psm':7}, function(err, text){
            if (err){
             console.log('Cannot crack the captcha, try again!'); 
            } else {
              captcha = text.toLowerCase().slice(0,5);
              console.log(captcha, captcha.length);
              
              //another request
              //console.log(url + query + captcha);
              options = {
                uri: url,
                method: 'POST',
                qs: {
                  action: 'action',
                  mst: mst,
                  captcha: captcha
                },
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.130 Safari/537.36',
                  'Cookie': cookie
                }
              };
              request(options, function(err2, res2, body2){
                //var $ = cheerio.load(body2);
                console.log(cookie);
                //console.log($('img').attr('src'));
                res.send(body2);
              });
            }
          });
        });
      }
    }
  });
});

app.listen('8080');
console.log('OK');