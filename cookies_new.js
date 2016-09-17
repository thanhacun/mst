(function(){
    var internal = {};
    
    exports.cookies = internal.cookies = function(main_cb){
        //requires
        var phantom = require('phantom');
        var request = require('request');
        var cheerio = require('cheerio');
        
        //common variables
        var homepage = 'http://tracuunnt.gdt.gov.vn';
        var url = 'http://tracuunnt.gdt.gov.vn/tcnnt/mstdn.jsp';
        var cookies_str;
        var captcha;
        var pageLoading = false;
        //helper functions    
        
        //Open headless browser
        phantom.create(function(ph){
           ph.createPage(function(page){
               //page setings
               page.set('settings.resourceTimeout', 6000);
               
               //page events
               page.set('onLoadStarted', function(){
                   pageLoading = true;
               });
               page.set('onLoadFinished', function(){
                   pageLoading = false;
               });
               page.set('onResourceTimeout', function() {
                  console.log('timeout!');
               });
               page.open(url, function(status){
                   if (status !== 'success') {
                       console.log('Connection error!');
                   } else {
                       page.evaluate(function(){
                            return $('img').attr('src');
                       }, function(captchaUrl){
                            get_cook(function(cookies_str) {
                                ph.exit();
                                main_cb(homepage + captchaUrl, cookies_str); 
                            });
                       });
                   }
               });
                       
               
               //helper functions
                
               //get cookies
               function get_cook (cb) {
                    page.get('cookies', function(cook_arr) {
                        cookies_str = cook_arr.map(function(cookie){
                                      return cookie.name + '=' + cookie.value;
                                    }).join('; ');
                        cb(cookies_str);
                    });
                }
                
                //check captcha by request (callback)
                function check_capt (capt, callback) {
                    console.log('Checking captcha...');
                    var check_url = url + '?action=action&mst=0100112846&captcha=' + capt;
                    var req_options = {uri: check_url, headers: {'Cookie': cookies_str} };
                    request(req_options, function(error, response, body) {
                       if (!error && response.statusCode === 200) {
                           var $ = cheerio.load(body);
                           if ($('.ta_border').length > 0) {
                               console.log('Correct captcha, congratulation');
                               captcha = capt;
                               captChecking = false;
                               return callback(capt);
                           } else {
                               console.log('Wrong captcha, try again');
                               //captcha = '';
                               captChecking = false;
                               return callback(captcha);
                           }
                       } else {
                           //captcha = '';
                           captChecking = false;
                           return callback(capt);
                       }
                    });
                }
                
           });
        });
    };
    
    //running stand alone
    if (!module.parent) {
        internal.cookies(console.log);
    }
})();

