angular.module('StarcounterLib', ['panelApp'])
  .directive('serverScope', ['$http', 'appContext', function ($http, appContext) {
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
          findAndSetWatchers(scope);
        }

        function patchRoot(scope, patch) {
          if (patch.length) {
            console.log("patch", patch);
            jsonpatch.apply(scope, patch);
          }
        }

        function parseViewModelId(scope) {
          var meta = document.getElementsByTagName('meta');
          for (var i = 0, ilen = meta.length; i < ilen; i++) {
            if (angular.element(meta[i]).attr('name') == 'View-Model') {
              scope['View-Model'] = angular.element(meta[i]).attr('content');
              break;
            }
          }
        }

        function getRequestUrl(scope) {
          return window.location.href + '/../__vm/' + scope['View-Model'];
        }

        function getRoot(scope) {
          $http({
            method: 'GET', 
            url: getRequestUrl(scope)
          }).success(function (data, status, headers, config) {
            overwriteRoot(scope, data);
            rootLoaded = true;
          });
        }

        function updateServer(scope, update) {
          $http({
            method: 'PATCH', 
            url: getRequestUrl(scope), 
            data: update
          }).success(function (data, status, headers, config) {
            patchRoot(scope, data);
          });
        }
        
        window.updateServer = updateServer;
        
        function findAndSetWatchers(scope) {
          var tree = appContext.getScopeTree(scope);
          var watched = [];
          for (var i in tree.locals) {
            if (i == "View-Model") {
              continue;
            }
            if (tree.locals.hasOwnProperty(i)) {
              watched.push(i);
            }
          }
          setWatchers(scope, watched);
        }
        
        function diffToPatch(obj, path, patch) {
          var path = path || '';
          var patch = patch || [];  
        
          if (typeof path !== '' && typeof obj == 'object') {
            if ($.isArray(obj)) {
              // changed value
              if (obj.length < 3) {
                patch.push({
                  replace: path, 
                  value:obj[obj.length - 1]
                });
              }
              else {
                if (obj[2] == 0) {
                  patch.push({
                    remove: path
                  });
                }
                else 
                if (obj[2] == 2) {
                  // text diff
                  throw new Error("text diff not implemented")
                }
                else {
                  throw new Error("invalid diff type");
                }
              }
            }
            else {
              var p;
              if (obj._t == 'a') {
                // array diff
                for (p in obj) {
                  if (p !== '_t' && obj.hasOwnProperty(p)) {
                    diffToPatch(obj[p], path + '/' + p, patch);
                  }
                }
              }
              else {
                // object diff
                for (p in obj) {
                  if (obj.hasOwnProperty(p)) {
                    diffToPatch(obj[p], path + '/' + p, patch);
                  }
                }
              }
            }
          }
          return patch;
        }

        function setWatchers(scope, props) {
          for (var i = 0, ilen = props.length; i < ilen; i++) {
            scope.$watch(props[i], (function (prop) {
              return (function (current, previous, scope) {
                if (rootLoaded) {
                  // Quick fix for not sending patch to server when watch is set.
                  if (current === previous) {
                    return;
                  }
                  var jsonPointer = '/' + prop.replace(/\./g, '/');
                  if($.isArray(current)) {
                    updateServer(scope, diffToPatch(jsondiffpatch.diff(previous, current), jsonPointer));
                  }
                  else {
                    updateServer(scope, [{
                      "replace": jsonPointer,
                      "value": current
                    }]);
                  }
                }
              })
            })(props[i]), true);
          }
        }

        return function postLink(scope, element, attrs, controller) {
          // Check if we should load local json file as a scope
          if (attrs.serverScope) {
            // Load local file
            $http.get(attrs.serverScope).success(function (data, status, headers, config) {
              // json file loaded
              console.log("NOTICE: Local scope was loaded (" + attrs.serverScope + ")");
              // apply loaded data to scope
              overwriteRoot(scope, data);
            }).error(function (data, status, headers, config) {
              console.log("ERROR: Loading "+attrs.serverScope+" ("+status+")");
            });
            return;
          }

          if (typeof window.__elim_rq !== 'undefined') {
            overwriteRoot(scope, window.__elim_rq);
            rootLoaded = true;
          }
          else {
            parseViewModelId(scope);
            getRoot(scope);
          }
        }
      }
    };
    return directiveDefinitionObject;
  }]);