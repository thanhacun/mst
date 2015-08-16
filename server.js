var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var cheerio = require('cheerio');
var mst = require('./tcmst.js');

var app = express();
app.set('views', __dirname + '/client/views');
app.set('view engine', 'jade');
//config express to use body-parser
app.use(express.static(__dirname + '/client'));
app.use(bodyParser.urlencoded({extended: false}));

//global variables
var captcha;
var cookies;

//using phantom and phantomjs
app.get('/tc/:mst', function(req, res){
  //because cracking captcha is not always correct
  //TODO will try a few times
  console.log('Total queries:', count++);
  mst.tcmst(req.params.mst, function(data){
    res.json(data);
  });
});

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


var count = 0;
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
  var mst, ten, diachi, thanhpho, quan, phuong,  trangthai, ketqua;
  var json = {mst: "", ten: "", diachi: "", thanhpho: "", quan: "", phuong: "", trangthai: "", ketqua:""};
  
  //open a browser to get cookie and capcha first
  request(options, function(error, response, body){
    if(!error && response.statusCode === 200){
       $ = cheerio.load(body);
      //make sure ta_border exists
      if ($('.ta_border').length > 0){//captcha correct
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
          //getting address detail
          //by request with id
          request({uri: url + '?action=action&id=' + mst}, function(error, response, body){
            //console.log(response.statusCode);
            if(!error && response.statusCode === 200){
              $ = cheerio.load(body);
              thanhpho = $('.ta_border').find('tr').eq(4).find('td').eq(1).text();
              json.thanhpho = thanhpho;
              quan = $('.ta_border').find('tr').eq(5).find('td').eq(1).text();
              json.quan = quan;
              phuong = $('.ta_border').find('tr').eq(6).find('td').eq(1).text();
              json.phuong = phuong;
              res.json(json);
              console.log(mst, count++, response.statusCode);
            }
          });
        }
      } else {
        console.log('Resubmit captcha and cookies');
        ketqua = false;
        json.captcha_url = ketqua;
        res.json(json);
      }
      //res.json(json);     
    }
  });
});

app.listen(process.env.PORT || '8080');

console.log('Helpers supporting getting data from TCT');

exports = module.exports = app;
