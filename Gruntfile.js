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
  }

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    // lint js files
    jshint: {
      options: {
        '-W025': true // Missing name in function declaration.
      },
      files: ['Gruntfile.js', 'ddoc/**/*.js', 'src/**/*.js']
    },
    copy: {
      webui: {
        files: [
          {
            expand: true,
            cwd: 'src',
            src: ['index.html', 'css/couchmap.css'],
            dest: 'build-webui'
          }
        ]
      },
      'ddoc-webui': {
        files: [
          {
            expand: true,
            cwd: 'build-webui',
            src: '**/*',
            dest: 'build-ddoc/_attachments'
          }
        ]
      },
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
      },
      'webui-vendor': {
        src: [],
        dest: 'build-webui/js/vendor.js',
        options: {
          shim: {
            jquery: {
              path: 'bower_components/jquery/jquery.min.js',
              exports: '$'
            },
            leaflet: {
              path: 'vendor/leaflet/leaflet.js',
              exports: 'L'
            }
          }
        }
      },
      // browserify couchmap.js
      webui: {
        dest: 'build-webui/js/couchmap.js',
        src: [ 'src/js/couchmap.js' ],
        options: {
          debug: grunt.option('debug'),
          external: ['jquery', 'bootstrap', 'leaflet'],
        }
      }
    },
    concat: {
      glue: {
        src: ['tmp/couchmap-common.js', 'couchdb-browserify-glue-footer.js'],
        dest: 'build-ddoc/views/lib/couchmap-common.js'
      },
      // concat vendor css files
      'webui-vendor-css': {
        files: {
          'build-webui/css/vendor.css': [
            'vendor/leaflet/leaflet.css'
          ]
        }
      }
    },
    'couch-compile': {
      'couchmap-api': {
        options: {
          merge: 'build-ddoc'
        },
        files: {
          'tmp/couchmap-api.json': 'ddoc'
        }
      }
    },
    'couch-push': couchpushopts
  });
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-replace');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-couch');

  // Default task(s).
  grunt.registerTask('default', ['jshint']);
  grunt.registerTask('webui', ['jshint', 'copy:webui', 'concat:webui-vendor-css', 'browserify:webui-vendor', 'browserify:webui']);
  grunt.registerTask('push', ['webui', 'copy:ddoc-webui', 'replace:glue', 'browserify', 'concat', 'couch']);
};
