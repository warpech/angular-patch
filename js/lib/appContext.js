//excerpt from https://github.com/angular/angularjs-batarang/blob/master/js/services/appContext.js
angular.module('panelApp', []).factory('appContext', function () {
  // cycle.js
  // 2011-08-24
  // https://github.com/douglascrockford/JSON-js/blob/master/cycle.js

  // Make a deep copy of an object or array, assuring that there is at most
  // one instance of each object or array in the resulting structure. The
  // duplicate references (which might be forming cycles) are replaced with
  // an object of the form
  //      {$ref: PATH}
  // where the PATH is a JSONPath string that locates the first occurance.
  var decycle = function decycle(object) {
    var objects = [], // Keep a reference to each unique object or array
      paths = [];     // Keep the path to each unique object or array

    return (function derez(value, path) {
      var i, // The loop counter
        name, // Property name
        nu;         // The new object or array
      switch (typeof value) {
        case 'object':
          if (!value) {
            return null;
          }
          for (i = 0; i < objects.length; i += 1) {
            if (objects[i] === value) {
              return {$ref: paths[i]};
            }
          }
          objects.push(value);
          paths.push(path);
          if (Object.prototype.toString.apply(value) === '[object Array]') {
            nu = [];
            for (i = 0; i < value.length; i += 1) {
              nu[i] = derez(value[i], path + '[' + i + ']');
            }
          } else {
            nu = {};
            for (name in value) {
              if (Object.prototype.hasOwnProperty.call(value, name)) {
                nu[name] = derez(value[name],
                  path + '[' + JSON.stringify(name) + ']');
              }
            }
          }
          return nu;
        case 'number':
        case 'string':
        case 'boolean':
          return value;
      }
    }(object, '$'));
  };

  return {
    getScopeTree: function (scope) {
      var tree = {};
      var getScopeNode = function (scope, node) {

        // copy scope's locals
        node.locals = {};

        var scopeLocals = {};
        for (prop in scope) {
          if (scope.hasOwnProperty(prop) && prop !== 'this' && prop[0] !== '$') {
            scopeLocals[prop] = scope[prop];
          }
        }

        node.locals = decycle(scopeLocals);

        node.id = scope.$id;

        if (window.__ngDebug) {
          node.watchers = __ngDebug.watchers[scope.$id];
        }

        // recursively get children scopes
        node.children = [];
        var child;
        if (scope.$$childHead) {
          child = scope.$$childHead;

          do {
            getScopeNode(child, node.children[node.children.length] = {});
          } while (child = child.$$nextSibling);
        }
      };

      getScopeNode(scope, tree);
      return tree;
    }

  }
});
