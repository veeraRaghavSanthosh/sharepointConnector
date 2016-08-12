module.exports = function(grunt) {

  grunt.initConfig({
    jshint: {
      options: {
        '-W079': true,
        "asi"           : false,
        "camelcase"     : true,
        "bitwise"       : false,
        "unused"        : true,
        "laxbreak"      : true,
        "laxcomma"      : true,
        "curly"         : false,
        "eqeqeq"        : true,
        "evil"          : true,
        "forin"         : false,
        "immed"         : true,
        "latedef"       : false,
        "newcap"        : false,
        "noarg"         : true,
        "noempty"       : true,
        "nonew"         : true,
        "plusplus"      : false,
        "regexp"        : true,
        "undef"         : false,
        "strict"        : false,
        "sub"           : true,
        "trailing"      : true,
        "node"          : true,
        "maxerr"        : 100,
        "es3"           : true,
        "esnext"        : true,
        "indent"        : 2
      },
      all: ['index.js', 'lib/**/*.js', 'test/**/**/*.js']
    }
    // ,
    // unit: ['export SP_USERNAME="foo"; export SP_PASSWORD="foo"; export SP_AUTH_TYPE="basic"; export SP_HOST="https://www.example.com"', './node_modules/mocha/bin/mocha -A -u exports --recursive -t 10000 ./test/unit'],
    // integrate : ['./node_modules/mocha/bin/mocha -A -u exports --recursive -t 25000 ./test/integration ']
  });

  //grunt.loadNpmTasks('grunt-fh-build');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  //grunt.registerTask('test', ['jshint', 'fh:unit']);
  grunt.registerTask('test', ['jshint']);
  //grunt.registerTask('integration', ['fh:integrate']);
  //grunt.registerTask('dist', ['test', 'fh:dist']);
  grunt.registerTask('default', 'test');
};
