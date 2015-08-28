(function(){
    /*
    - Inspired by the idea from http://solvedstack.com/questions/how-to-submit-a-form-using-phantomjs
    to minimize using timeout which is very not correct to determine time a page load. Basically, using
    loadInProgress variable to determine which is time to run a function defined in steps array
    - In order to trigger page.on events, should not evaluate a click in webpage, instead use something 
    like changing document.location.href
    */
    //for using as module
    var internal = {};
    exports.tcmst = internal.tcmst = function(mst, callback){
    //////main logic here//////
    var phantom = require('phantom');
    var ocr = require('./ocr.js');

    var homepage = 'http://tracuunnt.gdt.gov.vn';
    var url = 'http://tracuunnt.gdt.gov.vn/tcnnt/mstdn.jsp';
    var result = {mst: "", ten: "", diachi: "", thanhpho: "", quan: "", phuong: "", trangthai: "", ketqua:false, captcha:false, spend:0};
    var captcha;
    var loadInProgress = false;
    var pageLoop;
    var pageOpen = false;
    phantom.create(function(ph){
        var startedTime = new Date();
        ph.createPage(function(page){
            //page settings
            page.set('onLoadStarted', function(){
               loadInProgress = true;
            });
            page.set('onLoadFinished', function(){
                loadInProgress= false;
            });
            
            //helper functions
            var stepindex = 0;
            
            var query_mst = function(){
                console.log('querying info...');
                var query = {'mst':mst, 'captcha':captcha};
                page.evaluate(function(query){
                   window.location.href = 'http://tracuunnt.gdt.gov.vn/tcnnt/mstdn.jsp?action=action&mst=' + query.mst + '&captcha=' + query.captcha;
                }, function(){}, query);
            };
            
            var company_info = function(){
                console.log('getting company info...');
                page.evaluate(function(result){
                    if ($('.ta_border').length > 0){
                        //correct captcha
                        result.captcha = true;
                    } else {
                        //wrong captcha
                        return result;
                    }
                    
                    if ($('.ta_border tr').length > 2){
                         var info = $('.ta_border tr').eq(1).find('td');
                        //correct captcha and mst
                        result.ketqua = true;
                        result.mst = $(info[1]).find('a').text();
                        result.ten = $(info[2]).find('a').text();
                        result.diachi = $(info[2]).find('a').attr('title').slice(16);
                        result.trangthai = $(info[5]).find('a').attr('alt');
                        //TODO return result will be delay
                        window.location.href = 'http://tracuunnt.gdt.gov.vn/tcnnt/mstdn.jsp?action=action&id=' + result.mst;
                        return result;
                     } else {
                        //no result
                        return result;
                     }
                }, function(data){
                    result = data;
                    if (!result.captcha) {
                        console.log('Wrong captcha');
                        //skip next steps
                        stepindex = steps.length;
                    } else {
                        if (!result.ketqua){
                            console.log('Wrong mst');
                            //skip next step
                            stepindex ++;
                        }
                    }
                }, result);
            };
            
            var address_info = function(){
                console.log('getting address info...');
                page.evaluate(function(result){
                    result.thanhpho = $('.ta_border tr').eq(4).find('td').eq(1).text();
                    result.quan = $('.ta_border tr').eq(5).find('td').eq(1).text();
                    result.phuong = $('.ta_border tr').eq(6).find('td').eq(1).text();
                    document.location.href = 'http://tracuunnt.gdt.gov.vn/tcnnt/mstdn.jsp';
                    return result;
                }, function(data){
                    result = data;
                }, result);
            };
            
            var finalize = function(){
                console.log('finalizing...');
                page.render('tcmst.png', function(){
                    //a trick to keep step 3 return data
                });
            };
            
            var steps = [query_mst, company_info, address_info, finalize];
            
            //repeating openning page until get correct result: result.ketqua = true
            //need check result.ketqua and need a flag of pageOpen
            pageLoop = setInterval(function() {
                if (!pageOpen) {
                    pageOpen = true;
                    page.open(url, function(status){
                        if (status !== 'success'){
                            console.log('Connection error');
                            ph.exit();
                            clearInterval(pageLoop);
                            callback(result);
                        } else {
                            //getting captcha
                            page.evaluate(function(){
                               console.log('Cracking captcha...');
                               return $('img').attr('src');
                            }, function(captcha_url){
                               ocr.crack(homepage + captcha_url, function(text){
                                  if (text){
                                      //captcha seem OK
                                      captcha = text;
                                      console.log(captcha, '\t', homepage + captcha_url);
                                      var stepLoop = setInterval(function(){
                                          if (!loadInProgress  && stepindex < steps.length){
                                              //time to run function in steps
                                              console.log("============================");
                                              console.log("Running step ", stepindex + 1);
                                              steps[stepindex]();
                                              stepindex ++;
                                          }
                                          if (!loadInProgress && stepindex === steps.length){
                                              clearInterval(stepLoop);
                                              if (result.captcha) {
                                                  //captcha OK, time to stop
                                                  //clearInterval(interval);
                                                  clearInterval(pageLoop);
                                                  ph.exit();
                                                  var finishedTime = new Date();
                                                  result.spend = finishedTime - startedTime;
                                                  console.log('Time elapse:', result.spend, 'miliseconds');
                                                  callback(result);
                                              } else {
                                                  //need to do again
                                                  console.log('<<<<<Reopen>>>>>');
                                                  stepindex = 0;
                                                  pageOpen = false;
                                              }
                                              //clearInterval(interval);
                                          }
                                      }, 50);
                                  } else {
                                      //captcha not good, try again
                                      console.log('Captcha not good');
                                      console.log('<<<<<Reopen>>>>>');
                                      ph.exit();
                                      stepindex = 0;
                                      pageOpen  = false;
                                  }
                               });
                            });
                        }
                    });
                } else {
                    //skip
                }
            }, 50);
                    
        });
    });
    
    };//end phantom function
    //////running directly from script//////
    if (!module.parent){
        internal.tcmst(process.argv[2], function(ketqua){
            console.log('Standalone mode');
            console.log('\n', ketqua);
        });
    }
})();
    