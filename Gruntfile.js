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
      'vendor': {
        files: [
          {
            expand: true,
            cwd: 'bower_components/leaflet/dist/images',
            src: '**/*',
            dest: 'build-webui/images/vendor/leaflet'
          }
        ]
      }
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
            },
            'leaflet-markercluster': {
              path: 'vendor/leaflet.markercluster/leaflet.markercluster.js',
              exports: 'L',
              depends: {
                'leaflet': 'L'
              }
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
          external: ['jquery', 'bootstrap', 'leaflet', 'leaflet-markercluster'],
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
            'vendor/leaflet/leaflet.css',
            'vendor/leaflet.markercluster/MarkerCluster.css',
            'vendor/leaflet.markercluster/MarkerCluster.Default.css',
            'node_modules/couchmap-leaflet/css/couchmap-leaflet.css'
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
    'couch-push': couchpushopts,
    connect: {
      webui: {
        options: {
          port: 9000,
          hostname: '*',
          base: 'build-webui',
          livereload: 31337
        }
      }
    },
    watch: {
      options: {
        livereload: 31337
      },
      webui_config: {
        files: ['config.json'],
        tasks: ['webui']
      },
      webui_static: {
        files: ['index.html', 'css/couchmap.css'],
        tasks: ['copy:webui'],
        options: {
          cwd: 'src'
        }
      },
      webui_js: {
        files: ['src/**/*.js'],
        tasks: ['jshint', 'browserify:webui']
      }
    }
  });
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-couch');
  grunt.loadNpmTasks('grunt-replace');

  // Default task(s).
  grunt.registerTask('default', ['webui', 'connect', 'watch']);
  grunt.registerTask('webui', ['jshint', 'copy:webui', 'copy:vendor', 'concat:webui-vendor-css', 'browserify:webui-vendor', 'browserify:webui']);
  grunt.registerTask('push', ['webui', 'copy:ddoc-webui', 'replace:glue', 'browserify', 'concat', 'couch']);
};
