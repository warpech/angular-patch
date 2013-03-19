# Changelog

## 0.1.8 (Mar 19, 2012)

- switch JavaScript JSON Patch library to https://github.com/Starcounter-Jack/JSON-Patch
- upgrade JsonPatch.inc (PHP) to version that supports JSON Patch Draft 10 (https://github.com/warpech/json-patch-php/tree/draft10)
- update `serverScope.js` to use the JSON Patch Draft 10 syntax
- update tests to use the JSON Patch Draft 10 syntax

## 0.1.7 (Mar 19, 2012)

- upgrade Angular UI Handsontable in the examples to version 0.3.4
- upgrade build system to Grunt 0.4.0 (read instructions how to upgrade here: http://gruntjs.com/upgrading-from-0.3-to-0.4)

## 0.1.6 (Nov 27, 2012)

- rename `serverScope` directive to `mockupData`

## 0.1.5 (Nov 22, 2012)

- restore `uiClick` directive which was removed by mistake in 0.1.3
- fix for removing rows in grid data source (Angular UI Handsontable 0.1.5)
- rename `window.__elim_rq` to `window.__elim_req`

## 0.1.4 (Nov 16, 2012)

- upgrade Angular UI Handsontable to 0.1.3-dev (changes module name to `uiHandsontable`, fixes namespace conflict with Angular UI)

## 0.1.3 (Nov 16, 2012)

- new `ngRemoteapp` directive that bootstraps the application modules without a need ngApp + JavaScript file. See bootstrap.html for an example
- serverScope.js is not dependent on jQuery.extend anymore (switched to use angular.extend)
- fix test.html (configure request URL for mockup server)

## 0.1.2 (Nov 16, 2012)

- attach server scope data to $rootScope which allows to put `ng-app` to `<html>`
- upgrade Angular UI Handsontable to 0.1.2
- update mcorder.html to use `ng-view`
- View-Model url now also works if hash URL was used
- allow to reconfigure request URL depending on application needs (by default it request URL is now using absolute host path)

## 0.1.1 (Nov 13, 2012)

- no need to use `server-scope` directive anymore. Angular Patch will now be applied to the application scope (where `ng-app` is declared). You still have to include `StarcounterLib` module in your your app module dependencies.
- new directive `ui-click` that triggers `null` change to the server (see `mcorder` app for the example)

## 0.1.0 (Nov 12, 2012)

Changes since Nov 5, 2012:

- now Angular Patch is built with Grunt
- 2 distributions (in [dist/](https://github.com/warpech/angular-patch/tree/master/dist) directory): regular and min. For development purposes I think it is better to use regular for now.