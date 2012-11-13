/**
 * This file is used to build Angular Patch from `src/*`
 *
 * Installation:
 * 1. Install Grunt (`npm install -g grunt`)
 *
 * Build:
 * Execute `grunt` from root directory of this directory (where grunt.js is)
 * To execute automatically after each change, execute `grunt --force default watch`
 *
 * Result:
 * building Angular Patch will create files:
 *  - dist/angular-patch.js
 *  - dist/angular-patch.min.js
 *
 * See https://github.com/cowboy/grunt for more information about Grunt
 */
module.exports = function (grunt) {
  grunt.initConfig({
    pkg: '<json:package.json>',
    meta: {
      banner: '/**\n' +
        ' * <%= pkg.name %> <%= pkg.version %>\n' +
        ' * \n' +
        ' * Date: <%= (new Date()).toString() %>\n' +
        '*/'
    },
    concat: {
      full_js: {
        src: [
          '<banner>',
          'src/serverScope.js',
          'src/3rdparty/appContext.js',
          'src/3rdparty/jsondiffpatch.js',
          'src/3rdparty/jsonpatch.js'
        ],
        dest: 'dist/angular-patch.js'
      }
    },
    min: {
      "dist/angular-patch.min.js": [ "<banner>", "dist/angular-patch.js" ]
    },
    watch: {
      files: ['src/serverScope.js'],
      tasks: 'concat min'
    }
  });

  // Default task.
  grunt.registerTask('default', 'concat min');
};