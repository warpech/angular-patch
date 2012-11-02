angular.module('McOrderApp', ['ui.directives', 'StarcounterLib']);

function MyCtrl($scope, $http, $location) {
  $scope.dumpItems = function(){
    console.log("dump", $scope.Items);
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
    
  $scope.autocompleteSelect = function () {
    /* modified version of typeahead.select from jquery.handsontable.js */
    var val = this.$menu.find('.active').attr('data-value') || keyboardProxy.val();
    var options = $scope.Items[$scope.currentRow].Product._Options;
    for(var i=0,ilen=options.length; i<ilen; i++) {
      if(options[i].Description === val){
        options[i].Pick$ = '$$null';
        $scope.$digest();
        $('.dataTable').data('handsontable').destroyEditor();
        break;
      }
    }   
    return this.hide();
  }
  
  $scope.autocompleteLookup = function (event) {
    /* modified version of typeahead.lookup from jquery.handsontable.js */
    var items;
    var query = this.query = $.trim(this.$element.val());
    $scope.$apply(function(){
      $scope.Items[$scope.currentRow].Product._Search$ = query;
    });
    items = $.isFunction(this.source) ? this.source(this.query, $.proxy(this.process, this)) : this.source;
    return items ? this.process(items) : this;
  }
}