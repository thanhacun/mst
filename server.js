var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var cheerio = require('cheerio');
var tracuu = require('./tcmst.js');
var cook = require('./cookies.js');

var app = express();
app.set('views', __dirname + '/client/views');
app.set('view engine', 'jade');
//config express to use body-parser
app.use(express.static(__dirname + '/client'));
app.use(bodyParser.urlencoded({extended: false}));

//global variables
//var homepage = 'http://tracuunnt.gdt.gov.vn';
var url = 'http://tracuunnt.gdt.gov.vn/tcnnt/mstdn.jsp';
var captcha;
var cookies;
var count = 0;
var getCookCapt = true; //to keep run when start
var readyGet = false;

function cook_capt(callback) {
  cook.cookies(function(capt, cook, time) {
    captcha = capt;
    cookies = cook;
    readyGet = true;
    console.log (captcha, cookies);
    console.log ('It took', time, 'miliseconds to get captcha and cookies');
    console.log ('Now, it should be READY to serve');
    console.log ('=======================================================');
  });  
}

//keep updating cookies and captcha every timeToReGet
/*
setInterval(function() {
  var now = new Date();
  //TODO: request to keep server awake and to update captcha and cookies
  console.log(now.toLocaleString(), ': Send a ping');
  request(url + '?action=action&mst=0100112846&captcha=' + captcha, function(error, response, body){
    if (!error) {
      console.log(response.statusCode);
    } else {
      console.log('Connection error, reget the captcha anyway');
      getCookCapt = true;
    }
  });
  //getCookCapt = true;
}, timeToReGet);
*/

//getting cookie and captcha by listening getCookCapt flag
setInterval(function() {
  if (getCookCapt) {
      getCookCapt = false;
      //prevent getting info while captcha not available
      //readyGet = false;
      cook_capt();
  }
}, 50);

/*
app.route('/mst')
  .get(function(req, res){
    res.render('index');
  })
  .post(function(req,res){
    captcha = req.body.captcha;
    cookies = req.body.cookies || cookies;
    console.log('Getting capcha and cookies');
    res.render('index');
  });
*/

app.get('/mst/:mst', function(req, res){
  //variables
  var mst = req.params.mst;
  console.log('> Received request for', mst);
  
  //json result
  var json = {mst: "", ten: "", diachi: "", thanhpho: "", quan: "", phuong: "", trangthai: "", ketqua:false, captcha:false};
  var tryInterval;
  var tryIntervalTick = 0;
  
  function get_info () {
    var query = '?action=action&mst=' + mst + '&captcha=';
    var options = {uri: url + query + captcha, headers: {'Cookie': cookies} };    
    
    request(options, function(error, response, body){

      function send_res (statusCode, msg) {
        clearInterval(tryInterval);
        readyGet = true;
        var now = new Date();
        var timeSpend = tryIntervalTick * 50;
        json.spend = timeSpend;
        console.log (now.toISOString(), '|', count ++, mst, msg, '| took', timeSpend, 'ms');
        console.log ('=====================');
        res.status(statusCode).jsonp(json);
      }

      console.log('>> getting company status');
      if(!error && response.statusCode === 200){
         $ = cheerio.load(body);
        //make sure ta_border exists
        if ($('.ta_border').length > 0){
          //captcha correct
          console.log('>>> captcha OK');
          json.captcha = true;
          if ($('.ta_border').find('tr').length > 2) {//having result
            json.ketqua = true;
            var info = $('.ta_border tr').eq(1).find('td');
            json.mst = $(info[1]).find('a').text();
            json.ten = $(info[2]).find('a').text();
            json.diachi = $(info[2]).find('a').attr('title').slice(16);
            json.trangthai = $(info[5]).find('a').attr('alt');
            
            //getting address detail by request with id
            request({uri: url + '?action=action&id=' + json.mst, headers: {'Cookie':cookies }}, function(error, response, body){
              console.log('>>>> Getting address detail');
              //console.log(response.statusCode);
              if(!error && response.statusCode === 200){
                $ = cheerio.load(body);
                json.thanhpho = $('.ta_border').find('tr').eq(4).find('td').eq(1).text();
                json.quan = $('.ta_border').find('tr').eq(5).find('td').eq(1).text();
                json.phuong = $('.ta_border').find('tr').eq(6).find('td').eq(1).text();
                send_res(200, 'OK');
              }
            });
          } else {
            //no result
            send_res(200, 'no result');
          }
        } else {
          readyGet = false;
          getCookCapt = true;
          console.log('<<< captcha err: trying again >>>');
        }
      } else {
        send_res(400, 'conn err');
      }
    });
  }
  
  tryInterval = setInterval(function() {
    tryIntervalTick ++;
    if (readyGet) {
      readyGet = false;
      get_info();
    }
  }, 50);
  
});

app.get('/tracuu/:mst', function(req, res){
  tracuu.tcmst(req.params.mst, function(data){
    res.jsonp(data);
    console.log(req.params.mst, count ++, data.ketqua);
  });
});

app.listen(process.env.PORT || '3880');
console.log('========================================');
console.log('Helpers supporting getting data from TCT');

exports = module.exports = app;
