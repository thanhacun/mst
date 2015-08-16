(function(){
    //for using as module
    var internal = {};
    exports.tcmst = internal.tcmst = function(mst, callback){
    
    /////main logic here/////
    var phantom = require('phantom');
    //module cracking simple captcha
    var ocr = require('./ocr.js');

    var homepage = 'http://tracuunnt.gdt.gov.vn';
    var url = 'http://tracuunnt.gdt.gov.vn/tcnnt/mstdn.jsp';
    var captcha;
    phantom.create(function(ph){
       ph.createPage(function(page){
          //TODO: not working
          //page.set('settings.loadImages', false);
          
          //get status information
          page.open(url, function(status){
              if (status !== 'success'){
                  console.log('Connection Error');
                  ph.exit();
                  callback({mst: "", ten: "", diachi: "", thanhpho: "", quan: "", phuong: "", trangthai: "", ketqua:false, captcha:false});
              } else {
                  //get capcha_url
                  page.evaluate(function(){
                      var data = {'captcha_url':''};
                      data.captcha_url = document.getElementsByTagName('img').item(0).getAttribute('src');
                      return data;
                  }, function(data){
                      //crack captcha value
                      ocr.crack(homepage + data.captcha_url, function(result){
                          captcha = result;
                          console.log('Query:', mst);
                          console.log(captcha, ':', homepage + data.captcha_url);
                      });
                  });
                  //wait 0.5 seconds for cracking captcha
                  setTimeout(function(){
                      //preparing to query
                      var query = {'mst':mst, 'captcha':captcha};
                      page.evaluate(function(query){
                          document.getElementsByName('mst').item(0).value = query.mst;
                          document.getElementsByName('captcha').item(0).value = query.captcha;
                          document.getElementsByClassName('subBtn').item(0).click();
                      }, function(){}, query);
                  },500);
                  
                  setTimeout(function(){
                      //scrap result
                      page.includeJs('http://ajax.googleapis.com/ajax/libs/jquery/1.6.1/jquery.min.js', function(){
                         page.evaluate(function(){
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
                             //continue evaluate to get detail address information
                             if (data.ketqua){
                                 //delay 1 seconds to load information
                                 setTimeout(function(){
                                     page.evaluate(function(data){
                                        data.thanhpho = $('.ta_border tr').eq(4).find('td').eq(1).text();
                                        data.quan = $('.ta_border tr').eq(5).find('td').eq(1).text();
                                        data.phuong = $('.ta_border tr').eq(6).find('td').eq(1).text();
                                        return data;
                                     }, function(data){
                                         ph.exit();
                                         callback(data);
                                     }, data);                                 
                                 }, 1000);                                 
                             } else {
                                 ph.exit();
                                 console.log('Either wrong captcha or wrong mst');
                                 callback(data);
                             }
                         });
                      });
                  },1000);
              }
          });
       });
    });
    };
    
    //for running directly from script
    if (!module.parent){
        internal.tcmst(process.argv[2], function(data){
            console.log(data);
        });
    }
})();
    