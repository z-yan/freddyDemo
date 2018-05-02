const freddyDemo = angular.module('freddyDemo', [
    'ngRoute',
    'ngAnimate',
    'ui.bootstrap',
    'ngTable',
    'angular-loading-bar',
    'rzModule'
]);

freddyDemo.controller('MainController', ['$scope', '$http', 'NgTableParams', function ($scope, $http, NgTableParams) {
    let editorTextArea;
    let queryEditor;

    $scope.resultsSize = 'col-md-10 col-lg-10';

    $scope.isSettingsCollapsed = true;
    $scope.isQueriesCollapsed = true;

    $scope.schemaOptions = ['IMDb', 'Discogs'];
    $scope.selectedSchema = $scope.schemaOptions[0];
    $scope.tables = {};

    $scope.vecsOptions = ['Google News'];
    $scope.selectedVecs = $scope.vecsOptions[0];

    $scope.indexOptions = ['RAW', 'PQ', 'IVFADC'];
    $scope.selectedIndex = $scope.indexOptions[0];
    $scope.usePv = false;

    $scope.selectedQueryName = 'Select query';

    $scope.isAccordionHeaderOpen = false;

    $scope.isQueryEditorCollapsed = true;

    // TODO use actual values
    $scope.pvFacSlider = {
        value: 0,
        options: {
            stepsArray: [0, 0.2, 0.4, 0.6, 0.8, 1]
        }
    };
    $scope.wFacSlider = {
        value: 0,
        options: {
            stepsArray: [0, 1, 2, 3, 4]
        }
    };

    function createEditor() {
        editorTextArea = document.getElementById('queryTextArea');
        queryEditor = CodeMirror.fromTextArea(editorTextArea, {
            value: '',
            mode: 'text/x-pgsql',
            //theme: 'github',
            lineWrapping: true
        });

        queryEditor.on("beforeChange", function (instance, change) {
            let newtext = change.text.join("").replace(/\n/g, "");
            change.update(change.from, change.to, [newtext]);
            return true;
        });

        queryEditor.on("change", function (instance, change) {
            $(".CodeMirror-hscrollbar").css('display', 'none');
        });

        $(".CodeMirror-scroll").css('overflow', 'hidden');
    }

    function updateEditor(newValue) {
        queryEditor.setValue(newValue);
        setTimeout(function () {
            queryEditor.refresh();
        }, 1);
    }

    $scope.getTableList = function (schemaName) {
        $scope.selectedSchema = schemaName;

        if (!$scope.tables[schemaName]) {
            $http.get('/api/tables?schema=' + schemaName.toLowerCase())
                .then(function successCallback(response) {
                    $scope.tables[schemaName] = response.data.data;
                }, function errorCallback(response) {
                    console.log("Unable to fetch tables in schema.");
                });
        }
    };

    $scope.getQueryList = function () {
        $http.get('queries.json')
            .then(function successCallback(response) {
                $scope.queryList = response.data;
            }, function errorCallback() {
                console.log("Unable to load query JSON file.");
            });
    };

    $scope.executeQuery = function () {
        $http.get('/api/custom_query?query=' + queryEditor.getValue())
            .then(function successCallback(response) {
                if ($scope.currResultsTable != null) {
                    $scope.prevQueryResult = $scope.currQueryResult;
                    $scope.prevQueryExecTime = $scope.currQueryExecTime;
                    $scope.prevResultsTable = $scope.currResultsTable;
                    $scope.prevCols = $scope.currCols;
                }

                $scope.currQueryResult = response.data.data;
                $scope.currQueryExecTime = response.data.duration;

                $scope.currCols = [];

                angular.forEach($scope.currQueryResult[0], function (value, key) {
                    $scope.currCols.push({
                        title: key,
                        field: key,
                        sortable: key,
                        show: true
                    });
                });

                $scope.currResultsTable = new NgTableParams({
                    page: 1,
                    count: 10,
                }, {
                    dataset: $scope.currQueryResult
                });

            }, function errorCallback(response) {
                console.log("Unable to fetch query results.");
            });
    };

    $scope.setSelectedQuery = function (queryName, query) {
        if (queryEditor == null) {
            createEditor();
        }

        $scope.isQueryEditorCollapsed = false;

        updateEditor(query);

        $scope.selectedQuery = query;
        $scope.selectedQueryName = queryName;
    };

    $scope.setAttributeQuery = function (table, attr) {
        if (queryEditor == null) {
            createEditor();
        }

        $scope.isQueryEditorCollapsed = false;

        $scope.selectedQueryName = 'Custom attribute query';

        updateEditor('SELECT ' + attr + ' FROM ' + $scope.selectedSchema.toLowerCase() + '.' + table + ' LIMIT 1000');
    };

    $scope.setVecs = function (vecs) {
        // TODO: apply setting to FREDDY
        $scope.selectedVecs = vecs;
    };

    $scope.changeResultsClass = function (collapsed) {
        if (collapsed) {
            $scope.resultsSize = 'col-md-10 col-lg-10';
        }
        else {
            $scope.resultsSize = 'col-md-8 col-lg-8';
        }
    };

    $scope.getTableList($scope.selectedSchema);
    $scope.getQueryList();
}]);