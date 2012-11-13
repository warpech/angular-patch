/**
 * angular-patch 0.1.1
 * 
 * Date: Tue Nov 13 2012 18:40:21 GMT+0100 (Central European Standard Time)
*/

angular.module('StarcounterLib', ['panelApp'])
  .directive('ngApp', ['$http', 'appContext', function ($http, appContext) {
    var directiveDefinitionObject = {
      restrict: 'A',
      compile: function compile(tElement, tAttrs, transclude) {

        var remoteScope = {};
        var rootLoaded = false;

        function overwriteRoot(scope, data) {
          remoteScope = angular.copy(data); //remote is current state of data on server
          for (var i in data) {
            if (data.hasOwnProperty(i)) {              
              scope[i] = data[i];
            }
          }
          findAndSetWatchers(scope);
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
              overwriteRoot(scope, data);
              rootLoaded = true;
            }).error(function (data, status, headers, config) {
              console.log("ERROR: Loading " + attrs.serverScope + " (" + status + ")");
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

// Generated by CoffeeScript 1.3.3
(function() {
  var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  (function(root, factory) {
    if (typeof exports !== 'undefined') {
      return factory(root, exports);
    } else if (typeof define === 'function' && define.amd) {
      return define(['exports'], function(exports) {
        return root.jsonpatch = factory(root, exports);
      });
    } else {
      return root.jsonpatch = factory(root, {});
    }
  })(this, function(root) {
    var InvalidPatchError, JSONPatch, JSONPatchError, JSONPointer, PatchConflictError, add, apply, compile, hasOwnProperty, isArray, isEqual, isObject, isString, memberProcessors, methodMap, move, operationMembers, remove, replace, test, toString, _isEqual;
    toString = Object.prototype.toString;
    hasOwnProperty = Object.prototype.hasOwnProperty;
    isArray = function(obj) {
      return toString.call(obj) === '[object Array]';
    };
    isObject = function(obj) {
      return toString.call(obj) === '[object Object]';
    };
    isString = function(obj) {
      return toString.call(obj) === '[object String]';
    };
    _isEqual = function(a, b, stack) {
      var className, key, length, result, size;
      if (a === b) {
        return a !== 0 || 1 / a === 1 / b;
      }
      if (a === null || b === null) {
        return a === b;
      }
      className = toString.call(a);
      if (className !== toString.call(b)) {
        return false;
      }
      switch (className) {
        case '[object String]':
          String(a) === String(b);
          break;
        case '[object Number]':
          a = +a;
          b = +b;
          if (a !== a) {
            b !== b;
          } else {
            if (a === 0) {
              1 / a === 1 / b;
            } else {
              a === b;
            }
          }
          break;
        case '[object Boolean]':
          +a === +b;
      }
      if (typeof a !== 'object' || typeof b !== 'object') {
        return false;
      }
      length = stack.length;
      while (length--) {
        if (stack[length] === a) {
          return true;
        }
      }
      stack.push(a);
      size = 0;
      result = true;
      if (className === '[object Array]') {
        size = a.length;
        result = size === b.length;
        if (result) {
          while (size--) {
            if (!(result = __indexOf.call(a, size) >= 0 === __indexOf.call(b, size) >= 0 && _isEqual(a[size], b[size], stack))) {
              break;
            }
          }
        }
      } else {
        if (__indexOf.call(a, "constructor") >= 0 !== __indexOf.call(b, "constructor") >= 0 || a.constructor !== b.constructor) {
          return false;
        }
        for (key in a) {
          if (hasOwnProperty.call(a, key)) {
            size++;
            if (!(result = hasOwnProperty.call(b, key) && _isEqual(a[key], b[key], stack))) {
              break;
            }
          }
        }
        if (result) {
          for (key in b) {
            if (hasOwnProperty.call(b, key) && !size--) {
              break;
            }
          }
          result = !size;
        }
      }
      stack.pop();
      return result;
    };
    isEqual = function(a, b) {
      return _isEqual(a, b, []);
    };
    JSONPatchError = (function(_super) {

      __extends(JSONPatchError, _super);

      function JSONPatchError(message) {
        this.name = 'JSONPatchError';
        this.message = message || 'JSON patch error';
      }

      return JSONPatchError;

    })(Error);
    InvalidPatchError = (function(_super) {

      __extends(InvalidPatchError, _super);

      function InvalidPatchError(message) {
        this.name = 'InvalidPatch';
        this.message = message || 'Invalid patch';
      }

      return InvalidPatchError;

    })(JSONPatchError);
    PatchConflictError = (function(_super) {

      __extends(PatchConflictError, _super);

      function PatchConflictError(message) {
        this.name = 'PatchConflictError';
        this.message = message || 'Patch conflict';
      }

      return PatchConflictError;

    })(JSONPatchError);
    JSONPointer = (function() {

      function JSONPointer(path, shouldExist) {
        var i, loc, steps, _i, _len;
        if (shouldExist == null) {
          shouldExist = true;
        }
        if (path && (steps = path.split('/')).shift() !== '') {
          throw new InvalidPatchError();
        }
        for (i = _i = 0, _len = steps.length; _i < _len; i = ++_i) {
          loc = steps[i];
          steps[i] = decodeURIComponent(loc);
        }
        this.accessor = steps.pop();
        this.path = steps;
      }

      JSONPointer.prototype.getObject = function(obj) {
        var loc, _i, _len, _ref;
        _ref = this.path;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          loc = _ref[_i];
          if (isArray(obj)) {
            loc = parseInt(loc, 10);
          }
          if (!(loc in obj)) {
            throw new PatchConflictError('Array location out of bounds or not an instance property');
          }
          obj = obj[loc];
        }
        return obj;
      };

      return JSONPointer;

    })();
    JSONPatch = (function() {

      function JSONPatch(patch) {
        var key, member, method, preproc, supp;
        for (key in patch) {
          if (!(method = methodMap[key])) {
            continue;
          }
          if (this.operation) {
            throw new InvalidPatchError();
          }
          if ((member = operationMembers[key]) && patch[member] === void 0) {
            throw new InvalidPatchError("Patch member " + member + " not defined");
          }
          this.operation = methodMap[key];
          this.pointer = new JSONPointer(patch[key]);
          supp = patch[member];
          if ((preproc = memberProcessors[key])) {
            supp = preproc(supp);
          }
          this.supplement = supp;
        }
        if (!this.operation) {
          throw new InvalidPatchError();
        }
      }

      JSONPatch.prototype.apply = function(obj) {
        return this.operation(obj, this.pointer, this.supplement);
      };

      return JSONPatch;

    })();
    add = function(root, pointer, value) {
      var acc, obj;
      obj = pointer.getObject(root);
      acc = pointer.accessor;
      if (isArray(obj)) {
        acc = parseInt(acc, 10);
        if (acc < 0 || acc > obj.length) {
          throw new PatchConflictError("Index " + acc + " out of bounds");
        }
        obj.splice(acc, 0, value);
      } else {
        if (acc in obj) {
          throw new PatchConflictError("Value at " + acc + " exists");
        }
        obj[acc] = value;
      }
    };
    remove = function(root, pointer) {
      var acc, obj;
      obj = pointer.getObject(root);
      acc = pointer.accessor;
      if (isArray(obj)) {
        acc = parseInt(acc, 10);
        if (!(acc in obj)) {
          throw new PatchConflictError("Value at " + acc + " does not exist");
        }
        obj.splice(acc, 1);
      } else {
        if (!(acc in obj)) {
          throw new PatchConflictError("Value at " + acc + " does not exist");
        }
        delete obj[acc];
      }
    };
    replace = function(root, pointer, value) {
      var acc, obj;
      obj = pointer.getObject(root);
      acc = pointer.accessor;
      if (isArray(obj)) {
        acc = parseInt(acc, 10);
        if (!(acc in obj)) {
          throw new PatchConflictError("Value at " + acc + " does not exist");
        }
        obj.splice(acc, 1, value);
      } else {
        if (!(acc in obj)) {
          throw new PatchConflictError("Value at " + acc + " does not exist");
        }
        obj[acc] = value;
      }
    };
    test = function(root, pointer, value) {
      var acc, obj;
      obj = pointer.getObject(root);
      acc = pointer.accessor;
      if (isArray(obj)) {
        acc = parseInt(acc, 10);
      }
      return isEqual(obj[acc], value);
    };
    move = function(root, from, to) {
      var acc, obj, value;
      obj = from.getObject(root);
      acc = from.accessor;
      if (isArray(obj)) {
        acc = parseInt(acc, 10);
        if (!(acc in obj)) {
          throw new PatchConflictError("Value at " + acc + " does not exist");
        }
        value = obj.splice(acc, 1)[0];
      } else {
        if (!(acc in obj)) {
          throw new PatchConflictError("Value at " + acc + " does not exist");
        }
        value = obj[acc];
        delete obj[acc];
      }
      obj = to.getObject(root);
      acc = to.accessor;
      if (isArray(obj)) {
        acc = parseInt(acc, 10);
        if (acc < 0 || acc > obj.length) {
          throw new PatchConflictError("Index " + acc + " out of bounds");
        }
        obj.splice(acc, 0, value);
      } else {
        if (acc in obj) {
          throw new PatchConflictError("Value at " + acc + " exists");
        }
        obj[acc] = value;
      }
    };
    methodMap = {
      add: add,
      remove: remove,
      replace: replace,
      move: move,
      test: test
    };
    operationMembers = {
      add: 'value',
      remove: null,
      replace: 'value',
      test: 'value',
      move: 'to'
    };
    memberProcessors = {
      move: function(to) {
        return new JSONPointer(to);
      }
    };
    apply = function(root, patchDocument) {
      return compile(patchDocument)(root);
    };
    compile = function(patchDocument) {
      var operations, patch, _i, _len;
      operations = [];
      for (_i = 0, _len = patchDocument.length; _i < _len; _i++) {
        patch = patchDocument[_i];
        operations.push(new JSONPatch(patch));
      }
      return function(root) {
        var op, result, _j, _len1;
        for (_j = 0, _len1 = operations.length; _j < _len1; _j++) {
          op = operations[_j];
          result = op.apply(root);
        }
        return result;
      };
    };
    root.apply = apply;
    root.compile = compile;
    root.JSONPatchError = JSONPatchError;
    root.InvalidPatchError = InvalidPatchError;
    root.PatchConflictError = PatchConflictError;
    return root;
  });

}).call(this);
