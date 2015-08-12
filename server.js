var express = require('express');
var bodyParser = require('body-parser');
var fs = require("fs");
var request = require('request');
var cheerio = require('cheerio');
var tesseract = require('node-tesseract');

var app = express();
app.set('views', __dirname + '/client/views');
app.set('view engine', 'jade');
//config express to use body-parser
app.use(express.static(__dirname + '/client'));
app.use(bodyParser.urlencoded({extended: false}));

//global variables
var captcha;
var cookies;

app.route('/mst')
  .get(function(req, res){
    res.render('index');
  })
  .post(function(req,res){
    captcha = req.body.captcha;
    cookies = req.body.cookies || cookies;
    console.log('Getting capcha and cookies');
    res.render('index')
  })


app.get('/mst/captcha/:uid', function(req, res){
  var url = 'http://tracuunnt.gdt.gov.vn/tcnnt/captcha.png?uid=' + req.params.uid;
  //save captcha image to local folder
  request(url).pipe(fs.createWriteStream(__dirname + '/captcha.png')).on('finish', function(){
    //Wait until file created
    tesseract.process(__dirname + '/captcha.png',{'psm':7}, function(err, text){
        if(err){
            console.error(err);
        } else {
            //console.log(text);
            res.send(text);
        }
    })
  });

})

app.get('/mst/:mst', function(req, res){
  //variables
  var homepage = 'http://tracuunnt.gdt.gov.vn';
  var url = 'http://tracuunnt.gdt.gov.vn/tcnnt/mstdn.jsp';
  var query = '?action=action&mst=' + req.params.mst + '&captcha=';
  var options = {
    uri: url + query + captcha,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.130 Safari/537.36',
      'Cookie': cookies
    }
  };
  
  //result
  var mst, ten, diachi, trangthai, ketqua
  var json = {mst: "", ten: "", diachi: "", trangthai: "", ketqua:""};
  
  //open a browser to get cookie and capcha first
  request(options, function(error, response, body){
    $ = cheerio.load(body);
    //make sure ta_border exists
    console.log($('.ta_border').length);
    if ($('.ta_border').length > 0){//captcha correct
      console.log("Captcha and cookies OK");
      ketqua = true;
      json.ketqua = ketqua;
      if ($('.ta_border').find('tr').length > 2) {//having result
        var info = $('.ta_border tr').eq(1).find('td');
        mst = $(info[1]).find('a').text();
        json.mst = mst;
        ten = $(info[2]).find('a').text();
        json.ten = ten;
        diachi = $(info[2]).find('a').attr('title').slice(16);
        json.diachi = diachi;
        trangthai = $(info[5]).find('a').attr('alt');
        json.trangthai = trangthai;
      }
      
    } else {
      console.log('Should resubmit captcha and cookies');
      ketqua = false;
      json.captcha_url = ketqua;
    }
    res.json(json);
  })
})


app.listen(process.env.PORT || '8081');

console.log('Helpers supporting getting data from TCT');

exports = module.exports = app;
