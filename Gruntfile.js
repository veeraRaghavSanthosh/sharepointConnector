module.exports = function(grunt) {

  grunt.initConfig({
    jshint: {
      all: ['index.js', 'lib/**/*.js', 'test/**/**/*.js']
    }
    // ,
    // unit: ['export SP_USERNAME="foo"; export SP_PASSWORD="foo"; export SP_AUTH_TYPE="basic"; export SP_HOST="https://www.example.com"', './node_modules/mocha/bin/mocha -A -u exports --recursive -t 10000 ./test/unit'],
    // integrate : ['./node_modules/mocha/bin/mocha -A -u exports --recursive -t 25000 ./test/integration ']
  });

  grunt.loadNpmTasks('grunt-fh-build');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.registerTask('test', ['jshint']);
//  grunt.registerTask('integration', ['fh:integrate']);
  grunt.registerTask('dist', ['test', 'fh:dist']);
  grunt.registerTask('default', 'test');
};
