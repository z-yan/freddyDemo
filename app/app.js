const freddyDemo = angular.module('freddyDemo', [
    'ngRoute',
    'ngAnimate',
    'ui.bootstrap',
    'ngTable',
    'angular-loading-bar'
]);

freddyDemo.controller('MainController', ['$scope', '$http', 'NgTableParams', function ($scope, $http, NgTableParams) {
    $scope.isSettingsCollapsed = true;
    $scope.isQueriesCollapsed = true;

    $scope.schemaOptions = ['IMDb', 'Discogs'];
    $scope.selectedSchema = $scope.schemaOptions[0];
    $scope.tables = {};

    $scope.indexOptions = ['RAW', 'PQ', 'IVFADC'];
    $scope.selectedIndex = $scope.indexOptions[0];
    $scope.usePv = false;

    $scope.selectedQueryName = 'Select query';

    $scope.isAccordionHeaderOpen = false;

    $scope.isQueryEditorCollapsed = true;

    // query editor
    let editorTextArea = document.getElementById('queryTextArea');
    let queryEditor = CodeMirror.fromTextArea(editorTextArea, {
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
                // console.log(response.data);
                $scope.currQueryResult = response.data.data;
                $scope.currQueryDuration = response.data.duration;

                $scope.cols = [];

                angular.forEach($scope.currQueryResult[0], function (value, key) {
                    $scope.cols.push({
                        title: key,
                        field: key,
                        sortable: key,
                        show: true
                    });
                });

                $scope.resultsTable = new NgTableParams({
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
        $scope.isQueryEditorCollapsed = false;

        updateEditor(query);

        $scope.selectedQuery = query;
        $scope.selectedQueryName = queryName;
    };

    $scope.setAttributeQuery = function (table, attr) {
        $scope.isQueryEditorCollapsed = false;

        $scope.selectedQueryName = 'Custom attribute query';

        updateEditor('SELECT ' + attr + ' FROM ' + $scope.selectedSchema.toLowerCase() + '.' + table + ' LIMIT 1000');
    };

    $scope.updateWe = function (we) {
        $scope.selectedIndex = we;
    };

    $scope.getTableList($scope.selectedSchema);
    $scope.getQueryList();
}]);