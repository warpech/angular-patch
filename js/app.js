function MyCtrl($scope, $http, $location) {
  $scope.clientChange = function () {
    $scope.FirstName = "Changed By";
    $scope.LastName = "Controller";
  }

  $scope.$watch('FirstName', function (value) {
    console.log("First name is now:", value);
  });
}