# Changelog

## 0.1.2-dev

- attach server scope data to $rootScope which allows to put `ng-app` to `<html>`
- upgrade Angular UI Handsontable to 0.1.2-dev
- update mcorder.html to use `ng-view`
- View-Model url now also works if hash URL was used

## 0.1.1

- no need to use `server-scope` directive anymore. Angular Patch will now be applied to the application scope (where `ng-app` is declared). You still have to include `StarcounterLib` module in your your app module dependencies.
- new directive `ui-click` that triggers `null` change to the server (see `mcorder` app for the example)

## 0.1.0

Changes since Nov 5, 2012:

- now Angular Patch is built with Grunt
- 2 distributions (in [dist/](https://github.com/warpech/angular-patch/tree/master/dist) directory): regular and min. For development purposes I think it is better to use regular for now.