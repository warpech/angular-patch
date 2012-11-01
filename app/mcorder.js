angular.module('McOrderApp', ['ui.directives', 'StarcounterLib']);

function MyCtrl($scope, $http, $location) {
  $scope.dumpItems = function(){
    console.log("dump", $scope.Items);
  }

  /*$scope.getOptions = function (options) {
    var out = [];
    if (options !== null && typeof options === 'object' && options.length) {
      for (var i = 0, ilen = options.length; i < ilen; i++) {
        out.push(options[i].Description);
      }
    }
    return out;
  };*/
    
  $scope.autocompleteSorter = function (items) {
    var beginswith = []
    , caseSensitive = []
    , caseInsensitive = []
    , item;

    while (item = items.shift()) {
      if(item.Description !== null) {
        if (!item.Description.toLowerCase().indexOf(this.query.toLowerCase())) beginswith.push(item);
        else if (~item.Description.indexOf(this.query)) caseSensitive.push(item);
        else caseInsensitive.push(item);
      }
    }

    return beginswith.concat(caseSensitive, caseInsensitive);
  }
  
  $scope.autocompleteHighlighter = function (item) {
    var query = this.query.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
    return item.Description.replace(new RegExp('(' + query + ')', 'ig'), function ($1, match) {
      return '<strong>' + match + '</strong>';
    });
  }
  
  var dataCache = {};
    
  $scope.autocompleteSelect = function () {
    var val = this.$menu.find('.active').attr('data-value');
    var item = dataCache[val];
    $('.dataTable').data('handsontable').selection.refreshBorders();    
    item.Pick$ = '$$null';
    $scope.$digest();
    return this.hide();
  }
    
  $scope.autocompleteRender = function (items) {
    var that = this

    items = $(items).map(function (i, item) {
      i = $(that.options.item).attr('data-value', item.Description);
      dataCache[item.Description] = item;
      i.find('a').html(that.highlighter(item))
      return i[0]
    })

    items.first().addClass('active')
    this.$menu.html(items)
    return this
  }
  
  $scope.autocompleteLookup = function (event) {
      var items;
      var query = this.query = $.trim(this.$element.val());
      
      $scope.$apply(function(){
        $scope.Items[$scope.currentRow].Product._Search$ = query;
      });

      if (!this.query || this.query.length < this.options.minLength) {
        return this.shown ? this.hide() : this
      }

      items = $.isFunction(this.source) ? this.source(this.query, $.proxy(this.process, this)) : this.source

      return items ? this.process(items) : this
    }
}