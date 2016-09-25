var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var cheerio = require('cheerio');
var cook = require('./cookies_new.js');

var app = express();
app.set('views', __dirname + '/client/views');
app.set('view engine', 'jade');

//config express to use body-parser
app.use(express.static(__dirname + '/client'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

//global variables
var url = 'http://tracuunnt.gdt.gov.vn/tcnnt/mstdn.jsp';
var captcha;
var cookies;
var count = 0;
var mst;

app.post('/mst/info', function(req, res){
  captcha = req.body.captcha;
  console.log('Getting:', captcha, cookies);
  res.redirect('/mst/' + mst);
});

app.get('/mst/:mst', function(req, res){
  //variables and helper functions
  mst = req.params.mst;
  var startedTime = new Date();
  
  var get_capt = function(){
    console.log('> Getting captcha');
    cook.cookies(function(captchaUrl, cookies_str){
      cookies = cookies_str;
      res.status(300).render('index', {captchaUrl:captchaUrl, cookies_str:cookies_str});
    });
  };
  
  //json result
  //var json = {mst: "", ten: "", diachi: "", thanhpho: "", quan: "", phuong: "", trangthai: "", ketqua:false, captcha:false};
  var json = {mst: "", ten: "", diachi: "", thanhpho: "", quan: "", phuong: "", trangthai: "", thaydoi: "", dongmst: "", ketqua:false, captcha:false};
  
  //getting captcha and cookies
  if (!captcha) {
    //first running
    get_capt();
    
  } else {
    console.log('> Received request for', mst, 'from:', req.ip);
    get_info();
  }
  
  function get_info () {
    var query = '?action=action&mst=' + mst + '&captcha=';
    var options = {uri: url + query + captcha, headers: {'Cookie': cookies} };    
    
    request(options, function(error, response, body){

      function send_res (statusCode, msg) {
        //clearInterval(tryInterval);
        //readyGet = true;
        var finishedTime = new Date();
        var timeSpend = finishedTime - startedTime;
        json.spend = timeSpend;
        console.log (finishedTime.toISOString(), '|', count ++, mst, msg, '| took', timeSpend, 'ms');
        console.log ('=====================');
        res.status(statusCode).jsonp(json);
      }

      console.log('>> getting company status');
      if(!error && response.statusCode === 200){
         var $ = cheerio.load(body);
        //make sure ta_border exists
        if ($('.ta_border').length > 0){
          //captcha correct
          console.log('>>> captcha OK');
          json.captcha = true;
          if ($('.ta_border').find('tr').length > 2) {
            //having result
            json.ketqua = true;
            var info = $('.ta_border tr').eq(1).find('td');
            json.mst = $(info[1]).find('a').text();
            json.ten = $(info[2]).find('a').text();
            json.diachi = $(info[2]).find('a').attr('title').slice(16);
            json.trangthai = $(info[5]).find('a').attr('alt');
            //short address
            json.thaydoi = $(info[5]).find('a').text();
            json.trangthai = $(info[6]).find('a').attr('alt');            
            
            //getting address detail by request with id
            request({uri: url + '?action=action&id=' + json.mst, headers: {'Cookie':cookies }}, function(error, response, body){
              console.log('>>>> Getting address detail');
              if(!error && response.statusCode === 200){
                $ = cheerio.load(body);
                //json.thanhpho = $('.ta_border').find('tr').eq(4).find('td').eq(1).text();
                //json.quan = $('.ta_border').find('tr').eq(5).find('td').eq(1).text();
                //json.phuong = $('.ta_border').find('tr').eq(6).find('td').eq(1).text();
                //full address
                json.diachi = $('.ta_border').find('tr').eq(3).find('td').eq(0).text() || json.diachi;
                json.dongmst = $('.ta_border').find('tr').eq(0).find('td').eq(2).text();                
                send_res(200, 'OK');
              }
            });
          } else {
            //no result
            send_res(200, 'no result');
          }
        } else {
          console.log('<<< captcha err: trying again >>>');
          get_capt();
        }
      } else {
        send_res(400, 'conn err');
      }
    });
  }
  
});

app.listen(process.env.PORT || '8888');
console.log(process.env.PORT || '8888');
console.log('========================================');
console.log('Helpers supporting getting data from TCT');

exports = module.exports = app;
