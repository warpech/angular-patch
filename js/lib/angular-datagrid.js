/**
 * https://github.com/warpech/angular-ui-handsontable
 */
angular.module('ui.directives', [])
  .directive('uiDatagrid', function () {
    var directiveDefinitionObject = {
      restrict: 'A',
      compile: function compile(tElement, tAttrs, transclude) {

        var defaultSettings = {
          startRows: 0,
          startCols: 3,
          outsideClickDeselects: false,
          autoComplete: []
        };

        var $container = $('<div class="dataTable"></div>');
        
        var expression = tAttrs.datarows;
        var match = expression.match(/^\s*(.+)\s+in\s+(.*)\s*$/),
        lhs, rhs, valueIdent, keyIdent;
        if (!match) {
          throw Error("Expected datarows in form of '_item_ in _collection_' but got '" +
            expression + "'.");
        }
        lhs = match[1];
        rhs = match[2];
        tElement.data("uiDatagrid", {
          lhs: lhs,
          colHeaders: [],
          columns: [],
          settings: angular.extend({}, defaultSettings),
          $container: $container
        });

        return function postLink(scope, element, attrs, controller) {       
          var uiDatagrid = element.data("uiDatagrid");
          uiDatagrid.settings = angular.extend(uiDatagrid.settings, scope.$eval(attrs.uiDatagrid));

          $(element).append($container);

          if (typeof scope[rhs] !== 'undefined') {
            uiDatagrid.settings['data'] = scope[rhs];
            if (uiDatagrid.columns.length > 0) {
              uiDatagrid.settings['columns'] = uiDatagrid.columns;
              uiDatagrid.settings['startCols'] = uiDatagrid.columns.length;
            }
          }

          if (uiDatagrid.colHeaders.length > 0) {
            uiDatagrid.settings['colHeaders'] = uiDatagrid.colHeaders;
          }

          $container.handsontable(uiDatagrid.settings);

          $container.on('datachange.handsontable', function (event, changes, source) {
            if (!scope.$$phase) { //if digest is not in progress
              scope.$digest(); //programmatic change does not trigger digest in AnuglarJS so we need to trigger it automatically
            }
          });

          $container.on('selectionbyprop.handsontable', function (event, r, p, r2, p2) {
            scope.$emit('datagridSelection', $container, r, p, r2, p2);
          });

          scope.$watch(rhs, function (value) {
            if (scope[rhs] !== $container.handsontable('getData') && uiDatagrid.columns.length > 0) {
              $container.handsontable('updateSettings', {
                data: scope[rhs],
                columns: uiDatagrid.columns,
                startCols: uiDatagrid.columns.length
              });
            }
            else {
              $container.handsontable('loadData', scope[rhs]);
            }
          }, true);
        }
      }
    };
    return directiveDefinitionObject;
  })
  .directive('datacolumn', function () {
    var directiveDefinitionObject = {
      restrict: 'E',
      priority: 500,
      compile: function compile(tElement, tAttrs, transclude) {
        return function postLink(scope, element, attrs, controller) {          
          var uiDatagrid = element.inheritedData("uiDatagrid");
          
          /*get element index*/
          var index;
          var children = element.parent().children();
          for (var i = 0, ilen = children.length; i < ilen; i++) {
            if(children[i] === element[0]) {
              index = i;
            }
          }
            
          var $this = element
          , pattern = new RegExp("^(" + uiDatagrid.lhs + "\\.)")
          , value = attrs.value.replace(pattern, '')
          , title = attrs.title
          , type = scope.$eval(attrs.type)
          , options = attrs.options
          , tmp;
              
          var childScope = scope.$new();

          var column = scope.$eval(options) || {};
          column.data = value;

          uiDatagrid.colHeaders[index] = title;

          var deregister
          , deinterval;

          switch (type) {
            case 'autocomplete':
              if(!uiDatagrid.settings['autoComplete']) {
                uiDatagrid.settings['autoComplete'] = [];
              }
              uiDatagrid.settings['autoComplete'].push({
                match: function (row, col) {
                  if (col === index) {
                    return true;
                  }
                },
                source: function (row, col) {
                  var fn;
                  if (deregister) {
                    deregister();
                    clearInterval(deinterval);
                  }
                  var parsed;
                  childScope.item = uiDatagrid.$container.data('handsontable').getData()[row];
                  scope.currentRow = row;
                  deinterval = setInterval(function () {
                    childScope.item = uiDatagrid.$container.data('handsontable').getData()[row];
                    childScope.$digest();
                  }, 100);
                  deregister = childScope.$watch(options, function (oldVal, newVal) {
                    parsed = childScope.$eval(options)
                    if (fn) {
                      fn(parsed);
                    }
                  }, true);
                  return function (query, process) {
                    fn = process;
                    if (parsed) {
                      fn(parsed);
                    }
                  }
                }
              });
              break;

            case 'checkbox':
              column.type = Handsontable.CheckboxCell;
              tmp = attrs.checkedTemplate;
              if (typeof tmp !== 'undefined') {
                column.checkedTemplate = scope.$eval(tmp); //if undefined then defaults to Boolean true
              }
              tmp = attrs.uncheckedTemplate;
              if (typeof tmp !== 'undefined') {
                column.uncheckedTemplate = scope.$eval(tmp); //if undefined then defaults to Boolean true
              }
              break;

            default:
              if (typeof type === 'object') {
                column.type = type;
              }
          }

          if (typeof attrs.readOnly !== 'undefined') {
            column.readOnly = true;
          }

          if (typeof attrs.live !== 'undefined') {
            column.live = true;
          }
            
          for (var i in attrs){
            if(attrs.hasOwnProperty(i)) {
              column[i] = childScope.$eval(attrs[i]);
            }
          }

          uiDatagrid.columns[index] = column;
        }
      }
    };
    return directiveDefinitionObject;
  });