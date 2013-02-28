/**
 * This file is used to build Angular Patch from `src/*`
 *
 * Installation:
 * 1. Install Grunt CLI (`npm install -g grunt-cli`)
 * 1. Install Grunt 0.4.0 and other dependencies (`npm install`)
 *
 * Build:
 * Execute `grunt` from root directory of this directory (where Gruntfile.js is)
 * To execute automatically after each change, execute `grunt --force default watch`
 *
 * Result:
 * building Angular Patch will create files:
 *  - dist/angular-patch.js
 *  - dist/angular-patch.min.js
 *
 * See http://gruntjs.com/getting-started for more information about Grunt
 */
module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        banner: '/**\n' +
          ' * <%= pkg.name %> <%= pkg.version %>\n' +
          ' * \n' +
          ' * Date: <%= (new Date()).toString() %>\n' +
          '*/\n\n'
      },
      full_js: {
        src: [
          'src/serverScope.js',
          'src/bootstrap.js',
          'src/3rdparty/appContext.js',
          'src/3rdparty/jsondiffpatch.js',
          'src/3rdparty/jsonpatch.js'
        ],
        dest: 'dist/angular-patch.js'
      }
    },
    uglify: {
      options: {
        banner: '/**\n' +
          ' * <%= pkg.name %> <%= pkg.version %>\n' +
          ' * \n' +
          ' * Date: <%= (new Date()).toString() %>\n' +
          '*/\n\n'
      },
      "dist/angular-patch.min.js": [ "dist/angular-patch.js" ]
    },
    watch: {
      files: ['src/*'],
      tasks: ['concat', 'uglify']
    }
  });

  // Default task.
  grunt.registerTask('default', ['concat', 'uglify']);

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
};