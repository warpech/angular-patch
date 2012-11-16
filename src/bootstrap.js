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