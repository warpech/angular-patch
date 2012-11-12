# Angular Patch

Synchronizes Angular scope with the server using JSON Patch protocol ([draft-ietf-appsawg-json-patch-04](http://tools.ietf.org/html/draft-ietf-appsawg-json-patch-04)).

## Demo

The current version should be deployed here: 

  - http://nextgen.pl/_/ng-patch/index.php/test
  - http://nextgen.pl/_/ng-patch/index.php/mcorder

## Usage

Include the library files (see [dist/](https://github.com/warpech/angular-patch/tree/master/dist) directory):

```html
<script src="examples/js/angular.min.js"></script>
<script src="dist/angular-patch.js"></script>
```

Place `server-scope` directive in the scope that you want to be synchronized with the server:

```html
<body ng-controller="MyCtrl" server-scope>
```

From now on, changes in that scope will be sent to server.

*More docs will follow soon*

## Further development

This is work in progress and it is not yet considered production ready. Please submit your comments in GitHub Issues board.