//module that can run from command line
(function(){
    var internal = {}
    exports.showme = internal.showme = function(m){
      console.log(m);  
    };
    
    if(!module.parent){
        internal.showme (process.argv[2]);
    }
})();