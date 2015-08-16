//test setTimout

setTimeout(function(){
    console.log('1...');
    setTimeout(function(){
        console.log('3...');
    }, 2000)
},1000)