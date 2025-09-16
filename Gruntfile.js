module.exports = function(grunt) {

  grunt.initConfig({
    jshint: {
      options: {
        '-W079': true,
        "asi"           : false,
        "camelcase"     : false,
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
    },
    mochaTest: {
      unit: {
        options: {
          reporter: 'spec',
          timeout: 10000,
          require: function() {
            // Set environment variables for unit tests
            process.env.SP_USERNAME = process.env.SP_USERNAME || 'testuser';
            process.env.SP_PASSWORD = process.env.SP_PASSWORD || 'testpass';
            process.env.SP_AUTH_TYPE = process.env.SP_AUTH_TYPE || 'basic';
            process.env.SP_HOST = process.env.SP_HOST || 'https://test.sharepoint.com';
          }
        },
        src: ['test/unit/**/*.js']
      }
    }
  });

  //grunt.loadNpmTasks('grunt-fh-build');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  //grunt.registerTask('test', ['jshint', 'fh:unit']);
  grunt.registerTask('test', ['jshint']);
  //grunt.registerTask('integration', ['fh:integrate']);
  //grunt.registerTask('dist', ['test', 'fh:dist']);
  grunt.registerTask('default', 'test');
};
