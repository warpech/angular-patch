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

      return function postLink(scope, element, attrs, controller) {



        if (typeof scope.FirstName === 'undefined') {
          getRoot(scope);
        }

        function updateServer(path, value) {
          var data = {
            "replace": path,
            "value": value
          };
          $http({method: 'POST', url: 'php/server.php', data: data}).success(function (data, status, headers, config) {
            patchRoot(scope, data);
          }).error(function (data, status, headers, config) {
              console.log("error", data);
            });
        }

        scope.$watch('FirstName', function (current, previous, scope) {
          if(rootLoaded) {
            console.log("FirstName changed", current);
            updateServer('/FirstName', current);
          }
          else {
            console.log("ignoring FirstName because root not loaded", current);
          }
        }, false);

        scope.$watch('LastName', function (current, previous, scope) {
          if(rootLoaded) {
            console.log("LastName changed", current);
            updateServer('/LastName', current);
          }
          else {
            console.log("ignoring LastName because root not loaded", current);
          }
        }, false);

        scope.$watch('FullName', function (current, previous, scope) {
          if(rootLoaded) {
            console.log("FullName changed", current);
            //updateServer('/FullName', current);
          }
          else {
            console.log("ignoring FullName because root not loaded", current);
          }
        }, false);
      }
    }
  };
  return directiveDefinitionObject;
}]);