# Angular Patch

Synchronizes Angular scope with the server using JSON Patch protocol ([draft-ietf-appsawg-json-patch-10](http://tools.ietf.org/html/draft-ietf-appsawg-json-patch-10)).

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

Make sure the `starcounterLib` module (that comes from `angular-patch.js`) is loaded in `ngApp`. The basic usage is:

```html
<html ng-app="starcounterLib">
```

Even simplier, you can use the directive `ng-remoteapp` that will inject module `starcounterLib` for you.

```html
<html ng-remoteapp="list other modules here, divided by comma, starcounterLib does not have to be here">
```

From now on, changes in root scope will be sent to server.

*More docs will follow soon*

## Further development

This is work in progress and it is not yet considered production ready. Please submit your comments in GitHub Issues board.
