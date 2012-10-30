angular.module('McOrderApp', ['ui.directives', 'StarcounterLib']);

function MyCtrl($scope, $http, $location) {
  $scope.dumpItems = function(){
    console.log("dump", $scope.Items);
  }
  
  $scope.triggerNull = function(path) {
    window.updateServer($scope, [{
      "replace": path, 
      value: null
    }]);
  }

  $scope.getOptions = function (options) {
    var out = [];
    if (options !== null && typeof options === 'object' && options.length) {
      for (var i = 0, ilen = options.length; i < ilen; i++) {
        out.push(options[i].Description);
      }
    }
    return out;
  };
}