function MyCtrl($scope, $http, $location) {
  console.log("hi");

  $scope.restartSession = function () {
    console.log("restartSession");
    $http({method: 'GET', url: window.location.href + '?restartSession=true'}).success(function () {
      window.location.reload();
    });
  }
}