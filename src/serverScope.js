angular.module('StarcounterLib.config', []).value('StarcounterLib.config', {});

angular.module('StarcounterLib', ['panelApp', 'StarcounterLib.config'])
  .directive('ngApp', ['$http', 'appContext', '$rootScope', 'StarcounterLib.config', function ($http, appContext, $rootScope, uiConfig) {  
    
    var defaultConfig = {
      getRequestUrl: function(scope){
        return '/__vm/' + scope['View-Model'];
      }
    }
    uiConfig = $.extend({}, defaultConfig, uiConfig);
    
    var directiveDefinitionObject = {
      restrict: 'A',
      compile: function compile(tElement, tAttrs, transclude) {

        var remoteScope = {};
        var rootLoaded = false;

        function overwriteRoot(data) {
          remoteScope = angular.copy(data); //remote is current state of data on server
          for (var i in data) {
            if (data.hasOwnProperty(i)) {
              $rootScope[i] = data[i];
            }
          }
          findAndSetWatchers($rootScope);
        }

        function patchRoot(scope, patch) {
          if (patch.length) {
            jsonpatch.apply(remoteScope, angular.copy(patch)); //remote is current state of data on server
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

        function getRoot(scope) {
          $http({
            method: 'GET',
            url: uiConfig.getRequestUrl(scope)
          }).success(function (data, status, headers, config) {
            overwriteRoot(data);            
            rootLoaded = true;
          });
        }
        
        function updateServer(scope, update) {
          $http({
            method: 'PATCH',
            url: uiConfig.getRequestUrl(scope),
            data: update
          }).success(function (data, status, headers, config) {
            patchRoot(scope, data);
            if(!scope.$$phase) { //digest not in progress
              scope.$digest();                
            }
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
            if (angular.isArray(obj)) {
              // changed value
              if (obj.length < 3) {
                patch.push({
                  replace: path,
                  value: obj[obj.length - 1]
                });
              }
              else {
                if (obj[2] == 0) {
                  patch.push({
                    remove: path
                  });
                }
                else if (obj[2] == 2) {
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
                  var patch = diffToPatch(jsondiffpatch.diff(remoteScope[prop], current), jsonPointer);
                  
                  for(var i= 0, ilen=patch.length; i<ilen; i++) {
                    if(typeof patch[i].replace !== 'undefined' && patch[i].value === '$$null') {
                      /*
                      If value of a property was changed to string '$$null', it means that we want to send real null 
                      to server and keep null as the value in client side.
                      This is a workaround to null -> null changes being not detected by watch mechanism.
                      Null is used as button trigger in Starcounter.
                      */
                      patch[i].value = null; //set the change to null in JSON Patch
                      
                      /* determine if original value was false or null */
                      var test = jsonpatch.apply(remoteScope, [{ 
                        test: patch[i].replace, //check the original value
                        value: false //does original value equal false?
                      }]);
                      jsonpatch.apply(scope, [{ 
                        replace: patch[i].replace, //revert the change in current scope
                        value: (test ? false : null) //use original value from remoteScope cache (false or null)
                      }]);
                    }
                  }
                  
                  if(patch.length) {
                    updateServer(scope, patch);
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
              overwriteRoot(data);
              rootLoaded = true;
            }).error(function (data, status, headers, config) {
              console.log("ERROR: Loading " + attrs.serverScope + " (" + status + ")");
            });
            return;
          }

          if (typeof window.__elim_rq !== 'undefined') {
            overwriteRoot(window.__elim_rq);
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
  }])
  
  .directive('uiClick', ['$parse', function ($parse) {
    var directiveDefinitionObject = {
      restrict: 'A',
      compile: function compile(tElement, tAttrs, transclude) {
        var fn = $parse(tAttrs.uiClick + ' = "$$null"');
        return function postLink(scope, element, attrs, controller) {
          element.bind('click', function(event) {
            scope.$apply(function() {
              fn(scope, {
                $event:event
              });
            });
          });
        }
      }
    };
    return directiveDefinitionObject;
  }]);