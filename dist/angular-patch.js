/**
 * angular-patch 0.1.8
 * 
 * Date: Tue Mar 19 2013 11:59:21 GMT+0100 (Central European Standard Time)
*/

angular.module('StarcounterLib.config', []).value('StarcounterLib.config', {});

function ngAppFactory() {
  return ['$http', 'appContext', '$rootScope', 'StarcounterLib.config', function ($http, appContext, $rootScope, appConfig) {

    var defaultConfig = {
      getRequestUrl: function (scope) {
        return '/__vm/' + scope['View-Model'];
      }
    }
    var config = {};
    angular.extend(config, defaultConfig, appConfig);

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
            url: config.getRequestUrl(scope)
          }).success(function (data, status, headers, config) {
              overwriteRoot(data);
              rootLoaded = true;
            });
        }

        function updateServer(scope, update) {
          $http({
            method: 'PATCH',
            url: config.getRequestUrl(scope),
            data: update
          }).success(function (data, status, headers, config) {
              patchRoot(scope, data);
              if (!scope.$$phase) { //digest not in progress
                scope.$apply();

              }
              else {
                setTimeout(function () {
                  scope.$apply();
                });
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
                  op: 'replace',
                  path: path,
                  value: obj[obj.length - 1]
                });
              }
              else {
                if (obj[2] == 0) {
                  patch.push({
                    op: 'remove'
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

                  for (var i = 0, ilen = patch.length; i < ilen; i++) {
                    if (typeof patch[i].op !== 'replace' && patch[i].value === '$$null') {
                      /*
                       If value of a property was changed to string '$$null', it means that we want to send real null
                       to server and keep null as the value in client side.
                       This is a workaround to null -> null changes being not detected by watch mechanism.
                       Null is used as button trigger in Starcounter.
                       */
                      patch[i].value = null; //set the change to null in JSON Patch

                      /* determine if original value was false or null */
                      var test = jsonpatch.apply(remoteScope, [
                        {
                          op: 'test',
                          path: patch[i].replace, //check the original value
                          value: false //does original value equal false?
                        }
                      ]);
                      jsonpatch.apply(scope, [
                        {
                          op: 'replace',
                          path: patch[i].replace, //revert the change in current scope
                          value: (test ? false : null) //use original value from remoteScope cache (false or null)
                        }
                      ]);
                    }
                  }

                  if (patch.length) {
                    updateServer(scope, patch);
                  }
                }
              })
            })(props[i]), true);
          }
        }

        return function postLink(scope, element, attrs, controller) {
          // Check if we should load local json file as a scope
          if (attrs.mockupData && typeof window.__elim_req == 'undefined') {
            // Load local file
            $http.get(attrs.mockupData).success(function (data, status, headers, config) {
              // json file loaded
              console.log("NOTICE: Local scope was loaded (" + attrs.mockupData + ")");
              // apply loaded data to scope
              overwriteRoot(data);
              rootLoaded = true;
            }).error(function (data, status, headers, config) {
                console.log("ERROR: Loading " + attrs.mockupData + " (" + status + ")");
              });
            return;
          }

          if (typeof window.__elim_req !== 'undefined') {
            overwriteRoot(window.__elim_req);
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
  }]
}

angular.module('StarcounterLib', ['panelApp', 'StarcounterLib.config'])
  .directive('ngApp', ngAppFactory())
  .directive('ngRemoteapp', ngAppFactory())
  .directive('uiClick', ['$parse', function ($parse) {
  var directiveDefinitionObject = {
    restrict: 'A',
    compile: function compile(tElement, tAttrs, transclude) {
      var fn = $parse(tAttrs.uiClick + ' = "$$null"');
      return function postLink(scope, element, attrs, controller) {
        element.bind('click', function (event) {
          scope.$apply(function () {
            fn(scope, {
              $event: event
            });
          });
        });
      }
    }
  };
  return directiveDefinitionObject;
}]);

angular.element(document).ready(function () {

  // 1. After the page and all of the code is loaded, find the root of the HTML template, which is typically the root of the document.
  // 2. Call api/angular.bootstrap to compile the template into an executable, bi-directionally bound application.

  function angularRemoteInit(element) {
    var elements = [element],
    appElement,
    module,
    names = ['ng:remoteapp', 'ng-remoteapp', 'x-ng-remoteapp', 'data-ng-remoteapp'],
    NG_APP_CLASS_REGEXP = /\sng[:\-]remoteapp(:\s*([\w\d_]+);?)?\s/;

    function append(element) {
      element && elements.push(element);
    }

    angular.forEach(names, function (name) {
      names[name] = true;
      append(document.getElementById(name));
      name = name.replace(':', '\\:');
      if (element.querySelectorAll) {
        angular.forEach(element.querySelectorAll('.' + name), append);
        angular.forEach(element.querySelectorAll('.' + name + '\\:'), append);
        angular.forEach(element.querySelectorAll('[' + name + ']'), append);
      }
    });

    angular.forEach(elements, function (element) {
      if (!appElement) {
        var className = ' ' + element.className + ' ';
        var match = NG_APP_CLASS_REGEXP.exec(className);
        if (match) {
          appElement = element;
          module = (match[2] || '').replace(/\s+/g, ',');
        } else {
          angular.forEach(element.attributes, function (attr) {
            if (!appElement && names[attr.name]) {
              appElement = element;
              module = attr.value;
            }
          });
        }
      }
    });

    if (appElement) {
      var modules = module ? module.split(" ") : [];
      modules.unshift('StarcounterLib'); // Insert StarcounterLib module
      angular.bootstrap(appElement, modules);
    }
  }

  angularRemoteInit(document);
});
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

/*
*   Json Diff Patch
*   ---------------
*   https://github.com/benjamine/JsonDiffPatch
*   by Benjamin Eidelman - beneidel@gmail.com
*/
(function(){

    var jdp = {};
    if (typeof jsondiffpatch != 'undefined'){
        jdp = jsondiffpatch;
    }
    
    jdp.config = {
        textDiffMinLength: 60
    };
    

    jdp.dateReviver = function(key, value){
        var a;
        if (typeof value === 'string') {
            a = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)(Z|([+\-])(\d{2}):(\d{2}))$/.exec(value);
            if (a) {
                return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4], +a[5], +a[6]));
            }
        }
        return value;
    }
    
    var diff_match_patch_autoconfig = function(){
        var dmp;
        
        if (jdp.config.diff_match_patch) {
            dmp = new jdp.config.diff_match_patch.diff_match_patch();
        }
        if (typeof diff_match_patch != 'undefined') {
            if (typeof diff_match_patch == 'function') {
                dmp = new diff_match_patch();
            }
            else 
                if (typeof diff_match_patch == 'object' &&
                typeof diff_match_patch.diff_match_patch == 'function') {
                    dmp = new diff_match_patch.diff_match_patch();
                }
        }
        
        if (dmp) {
            jdp.config.textDiff = function(txt1, txt2){
                return dmp.patch_toText(dmp.patch_make(txt1, txt2));
            }
            jdp.config.textPatch = function(txt1, patch){
                var results = dmp.patch_apply(dmp.patch_fromText(patch), txt1);
                for (var i = 0; i < results[1].length; i++) {
                    if (!results[1][i]) {
                        throw new Error('text patch failed');
                    }
                }
                return results[0];
            };
            return true;
        }
    }

    var isArray = (typeof Array.isArray == 'function') ?
        // use native function
        Array.isArray :
        // use instanceof operator
        function(a) {
            return typeof a == 'object' && a instanceof Array;
        };

    var isDate = function(d){
        return d instanceof Date || Object.prototype.toString.call(d) === '[object Date]';
    };

    var arrayDiff = function(o, n){
        var adiff, i, idiff, nl = n.length, ol = o.length, addItemDiff;
        
        addItemDiff = function(index){
            idiff = diff(o[index], n[index]);
            if (typeof idiff != 'undefined') {
                if (typeof adiff == 'undefined') {
                    adiff = {
                        _t: 'a'
                    };
                }
                adiff[index] = idiff;
            }
        };
        
        for (i = 0; i < Math.max(nl, ol); i++) {
            addItemDiff(i);
        }
        return adiff;
    };
    
    var arrayDiffByKey = function(o, n, itemKey){
        var adiff, ol = o.length, nl = n.length, getKey, dcount = 0;
        
        if (typeof itemKey == 'function') {
            getKey = itemKey;
        }
        else {
            getKey = function(item){
                return item[itemKey];
            }
        }
        
        for (var i = 0; i < nl; i++) {
            if (typeof adiff == 'undefined') {
                adiff = {
                    _t: 'a'
                };
            }
            // added, changed or unchanged
            adiff[getKey(n[i])] = [n[i]];
            dcount++;
        }
        for (var i = 0; i < ol; i++) {
            var key = getKey(o[i]);
            if (typeof adiff == 'undefined' || typeof adiff[key] == 'undefined') {
                if (typeof adiff == 'undefined') {
                    adiff = {
                        _t: 'a'
                    };
                }
                // deleted
                adiff[key] = [o[i], 0, 0];
                dcount++;
            }
            else {
                var d = diff(o[i], adiff[key][0]);
                if (typeof d == 'undefined') {
                    // unchanged
                    delete adiff[key];
                    dcount--;
                }
                else {
                    // changed
                    adiff[key] = d;
                }
            }
        }
        if (dcount > 0) {
            return adiff;
        }
        else {
            // no changes
            return;
        }
    };
    
    var objectDiff = function(o, n){
    
        var odiff, pdiff, prop, addPropDiff;
        
        addPropDiff = function(name){
        
            if (isArray(n[prop]) && (n[prop + '_key'] || n['_' + prop + '_key'])) {
                n[prop]._key = n[prop + '_key'] || n['_' + prop + '_key'];
            }
            if (isArray(o[prop]) && (o[prop + '_key'] || o['_' + prop + '_key'])) {
                o[prop]._key = o[prop + '_key'] || o['_' + prop + '_key'];
            }
            
            pdiff = diff(o[prop], n[prop]);
            if (typeof pdiff != 'undefined') {
                if (typeof odiff == 'undefined') {
                    odiff = {};
                }
                odiff[prop] = pdiff;
            }
        };
        
        for (prop in n) {
            if (n.hasOwnProperty(prop)) {
                addPropDiff(prop);
            }
        }
        for (prop in o) {
            if (o.hasOwnProperty(prop)) {
                if (typeof n[prop] == 'undefined') {
                    addPropDiff(prop);
                }
            }
        }
        return odiff;
    };
    
    var diff = jdp.diff = function(o, n){
        var ntype, otype, nnull, onull, d;
        
        if (o === n) {
            return;
        }
        ntype = typeof n;
        otype = typeof o;
        nnull = n === null;
        onull = o === null;

        // handle Date objects
        if (otype == 'object' && isDate(o)){
            otype = 'date';
        }
        if (ntype == 'object' && isDate(n)){
            ntype = 'date';
            if (otype == 'date'){
                // check if equal dates
                if (o.getTime() === n.getTime()){
                    return;
                }
            }
        }
        
        if (nnull || onull || ntype == 'undefined' || ntype != otype ||
        ntype == 'number' ||
        otype == 'number' ||
        ntype == 'boolean' ||
        otype == 'boolean' ||
        ntype == 'string' ||
        otype == 'string' ||
        ntype == 'date' ||
        otype == 'date' ||
        ((ntype === 'object') && (isArray(n) != isArray(o)))) {
            // value changed
            d = [];
            if (typeof o != 'undefined') {
                if (typeof n != 'undefined') {
                    var longText = (ntype == 'string' && otype == 'string' && Math.min(o.length, n.length) > jdp.config.textDiffMinLength);
                    if (longText && !jdp.config.textDiff) {
                        diff_match_patch_autoconfig();
                    }
                    if (longText && jdp.config.textDiff) {
                        // get changes form old value to new value as a text diff
                        d.push(jdp.config.textDiff(o, n), 0, 2);
                    }
                    else {
                        // old value changed to new value
                        d.push(o);
                        d.push(n);
                    }
                }
                else {
                    // old value has been removed
                    d.push(o);
                    d.push(0, 0);
                }
            }
            else {
                // new value is added
                d.push(n);
            }
            return d;
        }
        else {
            if (isArray(n)) {
                // diff 2 arrays	
                if (n._key || o._key) {
                    return arrayDiffByKey(o, n, n._key || o._key);
                }
                else {
                    return arrayDiff(o, n);
                }
            }
            else {
                // diff 2 objects
                return objectDiff(o, n);
            }
        }
    };
    
    var objectGet = function(obj, key){
        if (isArray(obj) && obj._key) {
            var getKey = obj._key;
            if (typeof obj._key != 'function') {
                getKey = function(item){
                    return item[obj._key];
                }
            }
            for (var i = 0; i < obj.length; i++) {
                if (getKey(obj[i]) === key) {
                    return obj[i];
                }
            }
            return;
        }
        return obj[key];
    };
    
    jdp.getByKey = objectGet;
    
    var objectSet = function(obj, key, value){
        if (isArray(obj) && obj._key) {
            var getKey = obj._key;
            if (typeof obj._key != 'function') {
                getKey = function(item){
                    return item[obj._key];
                }
            }
            for (var i = 0; i < obj.length; i++) {
                if (getKey(obj[i]) === key) {
                    if (typeof value == 'undefined') {
                        obj.splice(i, 1);
                        i--;
                    }
                    else {
                        obj[i] = value;
                    }
                    return;
                }
            }
            if (typeof value != 'undefined') {
                obj.push(value);
            }
            return;
        }
        if (typeof value == 'undefined') {
            if (isArray(obj)) {
                obj.splice(key, 1);
            } else { 
                delete obj[key];
            }
        }
        else {
            obj[key] = value;
        }
    }

    var textDiffReverse = function(td){

        if (!jdp.config.textDiffReverse){
            jdp.config.textDiffReverse = function(d){

                var i, l, lines, line, lineTmp, header = null, headerRegex = /^@@ +\-(\d+),(\d+) +\+(\d+),(\d+) +@@$/, lineHeader, lineAdd, lineRemove;

                var diffSwap = function() {
                    // swap
                    if (lineAdd !== null) {
                        lines[lineAdd] = '-' + lines[lineAdd].slice(1);
                    }
                    if (lineRemove !== null) {
                        lines[lineRemove] = '+' + lines[lineRemove].slice(1);
                        if (lineAdd !== null) {
                            lineTmp = lines[lineAdd];
                            lines[lineAdd] = lines[lineRemove];
                            lines[lineRemove] = lineTmp;
                        }
                    }

                    // fix header
                    lines[lineHeader] = '@@ -' + header[3] + ',' + header[4] + ' +' + header[1] + ',' + header[2] + ' @@';

                    header = null;
                    lineHeader = null;
                    lineAdd = null;
                    lineRemove = null;
                }

                lines = d.split('\n');
                for (i = 0, l = lines.length; i<l; i++) {
                    line = lines[i];
                    var lineStart = line.slice(0,1);
                    if (lineStart==='@'){
                        if (header !== null) {
                            //diffSwap();
                        }
                        header = headerRegex.exec(line);
                        lineHeader = i;
                        lineAdd = null;
                        lineRemove = null;

                        // fix header
                        lines[lineHeader] = '@@ -' + header[3] + ',' + header[4] + ' +' + header[1] + ',' + header[2] + ' @@';
                    } else if (lineStart == '+'){
                        lineAdd = i;
                        lines[i] = '-' + lines[i].slice(1);
                    } else if (lineStart == '-'){
                        lineRemove = i;
                        lines[i] = '+' + lines[i].slice(1);
                    }
                }
                if (header !== null) {
                    //diffSwap();
                }
                return lines.join('\n');
            };
        }
        return jdp.config.textDiffReverse(td);
    }

    var reverse = jdp.reverse = function(d){

        var prop, rd;

        if (typeof d == 'undefined')
        {
            return;
        } else if (d === null){
            return null;
        } else if (typeof d == 'object' && !isDate(d)) {
            if (isArray(d)){
                if (d.length < 3) {
                    if (d.length == 1) {
                        // add => delete
                        return [d[0], 0, 0];
                    } else {
                        // modify => reverse modify
                        return [d[1], d[0]];
                    }
                }
                else {
                    if (d[2] == 0) {
                        // undefined, delete value => add value
                        return [d[0]];
                    }
                    else
                        if (d[2] == 2) {
                            return [textDiffReverse(d[0]), 0, 2];
                        }
                        else {
                            throw new Error("invalid diff type");
                        }
                }
            }else {
                rd = {};
                for (prop in d) {
                    if (d.hasOwnProperty(prop)) {
                        rd[prop] = reverse(d[prop]);
                    }
                }
                return rd;
            }
        } else if (typeof d === 'string' && d.slice(0,2) === '@@'){
            return textDiffReverse(d);
        }
        return d;
    }
    
    var patch = jdp.patch = function(o, pname, d, path) {
    
        var p, nvalue, subpath = '', target;
        
        if (typeof pname != 'string') {
            path = d;
            d = pname;
            pname = null;
        }
        else {
            if (typeof o != 'object') {
                pname = null;
            }
        }
        
        if (path) {
            subpath += path;
        }
        subpath += '/';
        if (pname !== null) {
            subpath += pname;
        }
        
        
        if (typeof d == 'object') {
            if (isArray(d)) {
                // changed value
                if (d.length < 3) {
                    nvalue = d[d.length - 1];
                    if (pname !== null) {
                        objectSet(o, pname, nvalue);
                    }
                    return nvalue;
                }
                else {
                    if (d[2] == 0) {
                        // undefined, delete value
                        if (pname !== null) {
                            objectSet(o, pname);
                        }
                        else {
                            return;
                        }
                    }
                    else 
                        if (d[2] == 2) {
                            // text diff
                            if (!jdp.config.textPatch) {
                                diff_match_patch_autoconfig();
                            }
                            if (!jdp.config.textPatch) {
                                throw new Error("textPatch function not found");
                            }
                            try {
                                nvalue = jdp.config.textPatch(objectGet(o, pname), d[0]);
                            } 
                            catch (text_patch_err) {
                                throw new Error('cannot apply patch at "' + subpath + '": ' + text_patch_err);
                            }
                            if (pname !== null) {
                                objectSet(o, pname, nvalue);
                            }
                            return nvalue;
                        }
                        else {
                            throw new Error("invalid diff type");
                        }
                }
            }
            else {
                if (d._t == 'a') {
                    // array diff
                    target = pname === null ? o : objectGet(o, pname);
                    if (typeof target != 'object' || !isArray(target)) {
                        throw new Error('cannot apply patch at "' + subpath + '": array expected');
                    }
                    else {
                        for (p in d) {
                            if (p !== '_t' && d.hasOwnProperty(p)) {
                                patch(target, p, d[p], subpath);
                            }
                        }
                    }
                }
                else {
                    // object diff
                    target = pname === null ? o : objectGet(o, pname);
                    if (typeof target != 'object' || isArray(target)) {
                        throw new Error('cannot apply patch at "' + subpath + '": object expected');
                    }
                    else {
                        for (p in d) {
                            if (d.hasOwnProperty(p)) {
                                patch(target, p, d[p], subpath);
                            }
                        }
                    }
                }
            }
        }
        
        return o;
    }

    var unpatch = jdp.unpatch = function(o, pname, d, path){
        
        if (typeof pname != 'string') {
            return patch(o, reverse(pname), d);
        }

        return patch(o, pname, reverse(d), path);
    }
    
    if (typeof require === 'function' && typeof exports === 'object' && typeof module === 'object') {
        // CommonJS, eg: node.js
        module.exports = jdp;
    } else if (typeof define === 'function' && define['amd']) {
        // AMD
        define(jdp);
    } else {
        // browser global
        window.jsondiffpatch = jdp;
    }

})();

var jsonpatch;
(function (jsonpatch) {
    var objOps = {
        add: function (obj, key) {
            obj[key] = this.value;
        },
        remove: function (obj, key) {
            delete obj[key];
        },
        replace: function (obj, key) {
            obj[key] = this.value;
        },
        move: function (obj, key, tree) {
            var temp = {
                op: "_get",
                path: this.from
            };
            apply(tree, [
                temp
            ], undefined);
            apply(tree, [
                {
                    op: "remove",
                    path: this.from
                }
            ], undefined);
            apply(tree, [
                {
                    op: "add",
                    path: this.path,
                    value: temp.value
                }
            ]);
        },
        copy: function (obj, key, tree) {
            var temp = {
                op: "_get",
                path: this.from
            };
            apply(tree, [
                temp
            ], undefined);
            apply(tree, [
                {
                    op: "add",
                    path: this.path,
                    value: temp.value
                }
            ]);
        },
        test: function (obj, key) {
            if(JSON.stringify(obj[key]) != JSON.stringify(this.value)) {
                throw "";
            }
        },
        _get: function (obj, key) {
            this.value = obj[key];
        }
    };
    var arrOps = {
        add: function (arr, i) {
            arr.splice(i, 0, this.value);
        },
        remove: function (arr, i) {
            arr.splice(i, 1);
        },
        replace: function (arr, i) {
            arr[i] = this.value;
        },
        move: objOps.move,
        copy: objOps.copy,
        test: objOps.test,
        _get: objOps._get
    };
    var observeOps = {
        new: function (patches, path) {
            var patch = {
                op: "iadd",
                path: path + this.name,
                value: this.object[this.name]
            };
            patches.push(patch);
            //console.log( patch );
                    },
        deleted: function (patches, path) {
            var patch = {
                op: "iremove",
                path: path + this.name
            };
            patches.push(patch);
            //console.log( patch );
                    },
        updated: function (patches, path) {
            var patch = {
                op: "ireplace",
                path: path + this.name,
                value: this.object[this.name]
            };
            patches.push(patch);
            //console.log( patch );
                    }
    };
    /// Listen to changes on an object tree, accumulate patches
    function listenTo(obj, patches, callback) {
        _listenTo(obj, patches, callback, null);
    }
    jsonpatch.listenTo = listenTo;
    function _listenTo(obj, patches, callback, parent) {
        //parents[obj] = path;
        Object.observe(obj, function (arr) {
            arr.forEach(function (elem) {
                observeOps[elem.type].call(elem, arr, "?");
            });
            if(callback) {
                callback.call(obj, patches);
            }
        });
        //path += "/";
        for(var key in obj) {
            if(obj.hasOwnProperty(key)) {
                var v = obj[key];
                if(v && typeof (v) === "object") {
                    _listenTo(v, patches, callback, obj)//path+key);
                    ;
                }
            }
        }
    }
    /// Apply a json-patch operation on an object tree
    function apply(tree, patches, listen) {
        try  {
            patches.forEach(function (patch) {
                //console.log(patch);
                // Find the object
                var keys = patch.path.split('/');
                keys.shift()// Remove empty element
                ;
                var obj = tree;
                var t = 0;
                var len = keys.length;
                while(true) {
                    if(obj instanceof Array) {
                        var index = parseInt(keys[t], 10);
                        t++;
                        if(t >= len) {
                            arrOps[patch.op].call(patch, obj, index, tree)// Apply patch
                            ;
                            break;
                        }
                        obj = obj[index];
                    } else {
                        var key = keys[t];
                        if(key.indexOf('~') != -1) {
                            key = key.replace('~1', '/').replace('~0', '~');
                        }// escape chars
                        
                        t++;
                        if(t >= len) {
                            objOps[patch.op].call(patch, obj, key, tree)// Apply patch
                            ;
                            break;
                        }
                        obj = obj[key];
                    }
                }
            });
        } catch (e) {
            return false;
        }
        return true;
    }
    jsonpatch.apply = apply;
})(jsonpatch || (jsonpatch = {}));
//@ sourceMappingURL=json-patch.js.map
