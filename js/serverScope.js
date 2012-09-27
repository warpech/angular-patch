angular.module('StarcounterLib', [])
  .directive('serverScope', ['$http', function ($http) {
  var directiveDefinitionObject = {
    restrict: 'A',
    compile: function compile(tElement, tAttrs, transclude) {

      var rootLoaded = false;

      function overwriteRoot(scope, data) {
        for (var i in data) {
          if (data.hasOwnProperty(i)) {
            scope[i] = data[i];
          }
        }
      }

      function patchRoot(scope, patch) {
        jsonpatch.apply(scope, patch);
      }

      function getRoot(scope) {
        $http({method: 'GET', url: 'php/server.php'}).success(function (data, status, headers, config) {
          overwriteRoot(scope, data);
          rootLoaded = true;
        }).error(function (data, status, headers, config) {
            console.error("server error", arguments);
          });
      }

      function updateServer(scope, path, value) {
        var data = {
          "replace": path,
          "value": value
        };
        $http({method: 'PATCH', url: 'php/server.php', data: data}).success(function (data, status, headers, config) {
          patchRoot(scope, data);
        }).error(function (data, status, headers, config) {
            console.log("error", data);
          });
      }

      function setWatchers(scope, props) {
        for (var i = 0, ilen = props.length; i < ilen; i++) {
          scope.$watch(props[i], (function(prop){return (function (current, previous, scope) {
            if (rootLoaded) {
              console.log(prop, "changed", current);
              updateServer(scope, '/' + prop, current);
            }
            else {
              console.log("ignoring", prop, "because root not loaded", current);
            }
          })})(props[i]), false);
        }
      }

      return function postLink(scope, element, attrs, controller) {
        if (typeof scope.FirstName === 'undefined') {
          getRoot(scope);
        }

        setWatchers(scope, ['FirstName', 'LastName']);
      }
    }
  };
  return directiveDefinitionObject;
}]);