var Nightmare = require('nightmare');
var request = require('request');
var ocr = require('./ocr.js');
//global variables
var homepage = 'http://tracuunnt.gdt.gov.vn';
var url = 'http://tracuunnt.gdt.gov.vn/tcnnt/mstdn.jsp';
var captcha;
var tracuu = new Nightmare({cookiesFile:'cookies'});
//getting mst as a input
var mst = process.argv[2];

tracuu
    .goto(url)
    .evaluate(function(){
        return $('img').attr('src');
    }, function(data){
        captcha = data;
    });

console.log(captcha);
tracuu
    .run(function(){
        console.log('DONE');
    })