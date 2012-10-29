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
}