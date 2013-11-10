module.exports = function(grunt) {
  var couchconfig = grunt.file.readJSON('couchconfig.json');

  var couch = grunt.option('couch') || 'localhost';
  var couchpushopts = null;
  if (couch) {
    couchpushopts = {
      options: {
        user: couchconfig.couches[couch].user,
        pass: couchconfig.couches[couch].pass
      }
    };
    couchpushopts[couch] = {};
    var files = {};
    files[couchconfig.couches[couch].database] = 'tmp/couchmap-api.json';
    couchpushopts[couch] = { files: files};
  };

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    // lint js files
    jshint: {
      options: {
        '-W025': true // Missing name in function declaration.
      },
      files: ['ddoc/**/*.js', 'vendor/**/*.js']
    },
    replace: {
      glue: {
        options: { patterns: [ {
          match: 'module', replacement: 'couchmap-common'
        }]},
        files: [
          {
            src: ['couchdb-browserify-glue-module.js'],
            dest: 'tmp/couchmap-common.glue'
          }
        ]
      },
    },
    browserify: {
      glue: {
        dest: 'tmp/couchmap-common.js',
        src: ['tmp/couchmap-common.glue'],
        options: {
        }
      }
    },
    concat: {
      glue: {
        src: ['tmp/couchmap-common.js', 'couchdb-browserify-glue-footer.js'],
        dest: 'tmp/merge/views/lib/couchmap-common.js'
      }
    },
    'couch-compile': {
      'couchmap-api': {
        options: {
          merge: 'tmp/merge'
        },
        files: {
          'tmp/couchmap-api.json': 'ddoc'
        }
      }
    },
    'couch-push': couchpushopts
  });
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-replace');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-couch');

  // Default task(s).
  grunt.registerTask('default', ['jshint']);
  grunt.registerTask('push', ['jshint', 'replace:glue', 'browserify', 'concat', 'couch']);
};
