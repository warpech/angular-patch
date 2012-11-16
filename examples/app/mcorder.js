angular.module('McOrderApp', ['uiHandsontable', 'StarcounterLib'])

  /**
   * Angular Patch configuration
   */
  .value('StarcounterLib.config', {
    /**
     * getRequestUrl
     * This is needed if you want requests to be made relatively to current path.
     * If you want requests to be made in the absolute path, skip this part (default getRequestUrl will be used)
     */
    getRequestUrl: function(scope){
      var href = window.location.href;
      if (window.location.hash) {
        href = href.substring(0, href.length - window.location.hash.length)
      }
      return href + '/../__vm/' + scope['View-Model'];
    }
  })
  
  /**
   * Route configuration. Just to prove if Angular Patch works with ng-view (probably you don't need it)
   */
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

/**
 * App controller
 */
function MyCtrl($scope, $http, $location) {
  $scope.dumpItems = function(){
    console.log("dump", $scope.Items);
  }
}