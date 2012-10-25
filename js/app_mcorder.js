function MyCtrl($scope, $http, $location) {
  $scope.Items = __elim_rq.Items;
  
  $scope.dumpItems = function(){
    console.log("dump", $scope.Items);
  }
}