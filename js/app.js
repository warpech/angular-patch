function MyCtrl($scope, $http) {
  console.log("hi");

  $scope.restartSession = function() {
    console.log("restartSession");
    $http({method: 'GET', url: 'php/server.php?restartSession=true'}).success(function(){
      window.location.reload();
    });
  }
}