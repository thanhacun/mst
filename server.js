var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var cheerio = require('cheerio');
var phantom = require('phantom');
//var mst = require('./tcmst.js');
var ocr = require('./ocr.js');
//var cook_capt = require('./cookie.js');


var app = express();
app.set('views', __dirname + '/client/views');
app.set('view engine', 'jade');
//config express to use body-parser
app.use(express.static(__dirname + '/client'));
app.use(bodyParser.urlencoded({extended: false}));

//global variables
var homepage = 'http://tracuunnt.gdt.gov.vn';
var url = 'http://tracuunnt.gdt.gov.vn/tcnnt/mstdn.jsp';
var captcha;
var cookies;
var capt_correct = true;
var tick = 0;
var pageLoading = false;
var count = 0;

var cook_capt = function(){
    phantom.create(function(ph){
       ph.createPage(function(page){
            //page settings
            page.set('onLoadStarted', function(){
              console.log('Loading...');
              pageLoading = true;
            });
            page.set('onLoadFinished', function(){
              console.log('Finised.');
              pageLoading = false;
            });
            //helper functions
            //get captcha
            function get_capt(){
              page.evaluate(function(){
                return $('img').attr('src');
              }, function(captcha_url){
                  ocr.crack(homepage + captcha_url, function(text){
                    captcha = text;
                    console.log(captcha, homepage + captcha_url);
                    capt_correct = true;
                    ph.exit();
                  });
                });
            }
            page.open(url, function(status){
                page.get('cookies', function(cookies_obj){
                    cookies = cookies_obj[0].name + '=' + cookies_obj[0].value + '; ' + cookies_obj[1].name + '=' + cookies_obj[1].value;
                });
                get_capt();
                //TODO: make sure captcha correct
                });
            });
       });  
};

cook_capt();

app.get('/captcha/:uid', function(req, res){
  var captcha_url = 'http://tracuunnt.gdt.gov.vn/tcnnt/captcha.png?uid=' + req.params.uid;
  ocr.crack(captcha_url, function(captcha){
    res.jsonp({'captcha': captcha});
  });
});

app.route('/mst')
  .get(function(req, res){
    res.render('index');
  })
  //TODO: using phantomjs to get cookies and captcha
  .post(function(req,res){
    captcha = req.body.captcha;
    cookies = req.body.cookies || cookies;
    console.log('Getting capcha and cookies');
    res.render('index');
  });

app.get('/mst/:mst', function(req, res){
  //variables
  var mst = req.params.mst;
  var query = '?action=action&mst=' + mst + '&captcha=';
  var options = {
    uri: url + query + captcha,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.130 Safari/537.36',
      'Cookie': cookies
    }
  };
  
  //result
  //var mst, ten, diachi, thanhpho, quan, phuong,  trangthai, ketqua;
  var json = {mst: "", ten: "", diachi: "", thanhpho: "", quan: "", phuong: "", trangthai: "", ketqua:false, captcha:false};
  
  //open a browser to get cookie and capcha first
  request(options, function(error, response, body){
    if(!error && response.statusCode === 200){
       $ = cheerio.load(body);
      //make sure ta_border exists
      if ($('.ta_border').length > 0){//captcha correct
        json.captcha = true;
        if ($('.ta_border').find('tr').length > 2) {//having result
          json.ketqua = true;
          var info = $('.ta_border tr').eq(1).find('td');
          json.mst = $(info[1]).find('a').text();
          json.ten = $(info[2]).find('a').text();
          json.diachi = $(info[2]).find('a').attr('title').slice(16);
          json.trangthai = $(info[5]).find('a').attr('alt');
          //getting address detail
          //by request with id
          request({uri: url + '?action=action&id=' + mst}, function(error, response, body){
            //console.log(response.statusCode);
            if(!error && response.statusCode === 200){
              $ = cheerio.load(body);
              json.thanhpho = $('.ta_border').find('tr').eq(4).find('td').eq(1).text();
              json.quan = $('.ta_border').find('tr').eq(5).find('td').eq(1).text();
              json.phuong = $('.ta_border').find('tr').eq(6).find('td').eq(1).text();
              res.jsonp(json);
              console.log(mst, count++, response.statusCode);
            }
          });
        }
      } else {
        console.log('Resubmit captcha and cookies');
        cook_capt();
        res.jsonp(json);
      }
    }
  });
});

app.listen(process.env.PORT || '8080');

console.log('Helpers supporting getting data from TCT');

exports = module.exports = app;
