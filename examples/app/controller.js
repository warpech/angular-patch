angular.module('uiHandsontableApp', ['StarcounterLib','uiHandsontable'])

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
  });

/**
 * App controller
 */
function MyCtrl($scope, $http, $location) {
  $scope.dumpItems = function(){
    console.log("dump", $scope.Items);
  }
}