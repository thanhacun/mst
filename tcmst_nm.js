/*using nightmare wrapper for phantomjs instead of 
phantom-node which is too much callback*/

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
    //open tcmst website
    .goto(url)
        //get the captcha link
        .evaluate(function(q1){
            var uid = $('img').eq(0).attr('src').split('?uid=')[1];
            $.getJSON('http://mst-thanhacun-1.c9.io/captcha/' + uid + '?callback=?', function(data){
                console.log(data.captcha);
                $('input[name="mst"]').val(q1);
                $('input#captcha').val(data.captcha);
                $('.subBtn').click();
            });
        }, function(){}, mst) //end evaluate
        .wait()
        .evaluate(function(){
            //get the first result
            //page.evaluate does not response to click on <a> elm and may by some of other
            //need to init a mouse event and dispatch it to the elm
            //http://stackoverflow.com/questions/15739263/phantomjs-click-an-element
            function click(el){
                var ev = document.createEvent("MouseEvent");
                ev.initMouseEvent("click", true /* bubble */, true /* cancelable */, window, null,
                0, 0, 0, 0, /* coordinates */ false, false, false, false, /* modifier keys */ 0 /*left*/, null
                );
                el.dispatchEvent(ev);
            }                           
            var data = {mst: "", ten: "", diachi: "", thanhpho: "", quan: "", phuong: "", trangthai: "", ketqua:false, captcha:false};
            //wrong captcha
            if ($('p').eq(0).text().slice(0,3) !== 'Vui'){
            data.captcha = true;
            } 
            if ($('.ta_border tr').length > 2){
                var info = $('.ta_border tr').eq(1).find('td');
                //correct captcha and mst
                data.ketqua = true;
                data.mst = $(info[1]).find('a').text();
                data.ten = $(info[2]).find('a').text();
                data.diachi = $(info[2]).find('a').attr('title').slice(16);
                data.trangthai = $(info[5]).find('a').attr('alt');
         
                //follow company link to get detail address infomation
                click($(info[2]).find('a')[0]);
            } else {
            //wrong mst
            data.ketqua = false;
            }
            return data;
        }, function(data){
            return data;
        });
        tracuu.wait()
        .screenshot('tcmst.png')
        .run(function(){
            console.log(captcha);
        });
 






//get address detail result