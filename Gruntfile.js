/*!
 * Bootlint's Gruntfile
 * https://github.com/twbs/bootlint
 * Copyright 2014-2017 The Bootlint Authors
 * Portions Copyright 2013-2014 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootlint/blob/master/LICENSE)
 */
/*eslint-env node */

module.exports = function (grunt) {
  'use strict';

  // Force use of Unix newlines
  grunt.util.linefeed = '\n';

  // Load all grunt tasks
  require('load-grunt-tasks')(grunt);
  // Show elapsed time at the end.
  require('time-grunt')(grunt);

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: (
      "/*!\n * Bootlint v<%= pkg.version %> (<%= pkg.homepage %>)\n" +
      " * <%= pkg.description %>\n" +
      " * Copyright (c) 2014-2016 The Bootlint Authors\n" +
      " * Licensed under the MIT License (https://github.com/twbs/bootlint/blob/master/LICENSE).\n" +
      " */\n"
    ),
    // Task configuration.
    browserify: {
      dist: {
        src: 'src/bootlint.js',
        dest: 'dist/browser/<%= pkg.name %>.js'
      }
    },
    usebanner: {
      options: {
        banner: '<%= banner %>'
      },
      dist: {
        src: ['dist/**/*.js']
      }
    },
    nodeunit: {
      files: ['test/**/*_test.js']
    },
    qunit: {
      options: {
        timeout: 10000
      },
      files: ['test/fixtures/**/*.html', '!test/fixtures/jquery/missing.html', '!test/fixtures/jquery/and_bs_js_both_missing.html', '!test/fixtures/charset/not-utf8.html']
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      web: {
        src: ['app.js', 'bin/www']
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      lib: {
        src: ['src/**/*.js']
      },
      test: {
        src: ['test/**/*.js', '!test/lib/**/*.js']
      }
    },
    jscs: {
      web: {
        src: '<%= jshint.web.src %>'
      },
      gruntfile: {
        src: '<%= jshint.gruntfile.src %>',
        options: {
          validateIndentation: 2
        }
      },
      lib: {
        src: '<%= jshint.lib.src %>'
      },
      test: {
        src: '<%= jshint.test.src %>'
      }
    },
    eslint: {
      options: {
        config: '.eslintrc'
      },
      web: {
        src: '<%= jshint.web.src %>'
      },
      gruntfile: {
        src: '<%= jshint.gruntfile.src %>'
      },
      lib: {
        src: '<%= jshint.lib.src %>'
      },
      test: {
        src: '<%= jshint.test.src %>'
      }
    },
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      lib: {
        files: '<%= jshint.lib.src %>',
        tasks: ['jshint:lib', 'nodeunit']
      },
      test: {
        files: '<%= jshint.test.src %>',
        tasks: ['jshint:test', 'nodeunit']
      }
    }
  });

  // Tasks
  grunt.registerTask('lint', ['jshint', 'jscs', 'eslint']);
  grunt.registerTask('dist', ['browserify', 'usebanner']);
  grunt.registerTask('test', ['lint', 'dist', 'nodeunit', 'qunit']);
  grunt.registerTask('default', ['test']);
};
