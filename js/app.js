var serverUrl = window.location.href + '/..';

function MyCtrl($scope, $http, $location) {
  $scope.restartSession = function () {
    console.log("restartSession");
    $http({method: 'GET', url: serverUrl + '?restartSession=true'}).success(function () {
      window.location.reload();
    });
  }
}