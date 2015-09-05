module.exports = function(grunt) {
    var grunt = require('grunt');
    //jit-grunt is used to load plugins for grunt
    //so no need to use grunt.loadNpmTasks('pluginName')
    require('jit-grunt')(grunt, {
        express: 'grunt-express-server', 
    });
    require('time-grunt')(grunt);
    
    grunt.initConfig({
        //keep express server running
        express: {
           options: {},
           prod: {
               options: {
                   script: './server.js',
               }
           },
        },
        //watch files change
        watch: {
           express: {
               files: ['*.js'],
               tasks: ['serve'],
               options: {
                   liverload: true,
                   nospawn: true
               }
           }
       }
    });
    
    grunt.registerTask('default', 'Hello world', function() {
       console.log('Hello World!'); 
    });
    
    grunt.registerTask('keepalive', 'Keep running/ or reloading', function() {
        grunt.log.ok('Keep or reload server...');
        this.async();
    });
    grunt.registerTask('wait', 'Waiting for server to load...', function() {
       var done = this.async();
       
       setTimeout(function() {
           grunt.log.writeln('Done waiting!');
           done();
       }, 8000);
    });
    grunt.registerTask('serve', function() {
        grunt.task.run(['express:prod', 'wait', 'watch', 'keepalive']);
    });
};

