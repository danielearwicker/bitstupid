module.exports = function(grunt) {
    grunt.initConfig({
        concat: {
            options: {
                separator: ';'
            },
            dist: {
                src: [
                    'static/lib/jquery-2.1.1.min.js', 
                    'static/lib/knockout-3.1.0.js', 
                    'static/lib/moment.min.js',
                    'static/client.js'],
                dest: 'static/bitstupid.js',
            }
        }
    });
    
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.registerTask('default', 'concat');
};