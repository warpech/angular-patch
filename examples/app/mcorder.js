angular.module('McOrderApp', ['ui.directives', 'StarcounterLib'])
  .config(['$routeProvider', function($routeProvider) {
    $routeProvider.
    when('/grid', {
      templateUrl: '../examples/app/mcorder_grid.html', 
      controller: MyCtrl
    }).
    otherwise({
      redirectTo: '/grid'
    });
  }]);

function MyCtrl($scope, $http, $location) {
  $scope.dumpItems = function(){
    console.log("dump", $scope.Items);
  }
}