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

    $scope.selectedQueryName = 'Select query';

    $scope.isAccordionHeaderOpen = false;

    $scope.isQueryEditorCollapsed = true;

    $scope.indexOptions = ['RAW', 'PQ', 'IVFADC'];

    $scope.vecsOptions = ['Google News'];
    $scope.selectedVecs = $scope.vecsOptions[0];

    $scope.analogyOptions = [{
        name: '3CosAdd',
        value: 'analogy_3cosadd'
    }, {
        name: 'Pair Direction',
        value: 'analogy_pair_direction'
    }, {
        name: '3CosMul',
        value: 'analogy_3cosmul'
    }];

    $scope.pvFacSliderOptions = {
        floor: 1,
        ceil: 1000,
        step: 5
    };

    $scope.wFacSliderOptions = {
        floor: 1,
        ceil: 100,
        step: 1
    };

    const defaultFreddySettings = {
        // default settings
        index: 'RAW',
        pv: false,
        pvFactor: 1,
        wFactor: 1,
        analogyType: 'analogy_3cosadd'
    };

    $scope.freddySettings = Object.assign({}, defaultFreddySettings);

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

    $scope.updateEditor = function (newValue) {
        if (queryEditor != null) {
            queryEditor.setValue(newValue);
            setTimeout(function () {
                queryEditor.refresh();
            }, 1);
        }
    };

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

    $scope.setQueryFromList = function (queryName, query) {
        if (queryEditor == null) {
            createEditor();
        }

        $scope.isQueryEditorCollapsed = false;

        $scope.updateEditor(query);

        $scope.selectedQuery = query;
        $scope.selectedQueryName = queryName;
    };

    $scope.setAttributeQuery = function (table, attr) {
        if (queryEditor == null) {
            createEditor();
        }

        $scope.isQueryEditorCollapsed = false;

        $scope.selectedQuery = 'SELECT ' + attr + ' FROM ' + $scope.selectedSchema.toLowerCase() + '.' + table + ' LIMIT 1000';
        $scope.selectedQueryName = 'Custom attribute query';

        $scope.updateEditor($scope.selectedQuery);
    };

    $scope.executeQuery = function () {
        $scope.prevQuery = $scope.currQuery;
        $scope.currQuery = queryEditor.getValue();

        $http.get('/api/custom_query?query=' + $scope.currQuery)
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

    $scope.changeResultsClass = function (collapsed) {
        if (collapsed) {
            $scope.resultsSize = 'col-md-10 col-lg-10';
        }
        else {
            $scope.resultsSize = 'col-md-8 col-lg-8';
        }
    };

    $scope.setVecs = function (vecs) {
        // TODO: apply setting to FREDDY
        $scope.selectedVecs = vecs;
    };

    $scope.setAnalogy = function (analogy, analogyName) {
        $scope.freddySettings.analogyType = analogy;
        $scope.selectedAnalogyName = analogyName;
    };

    $scope.applySettings = function () {
        $http({
            method: 'POST',
            url: '/api/settings',
            headers: {
                'Content-Type': 'application/json'
            },
            data: JSON.stringify($scope.freddySettings)
        })
            .then(function successCallback(response) {
                console.log('Posted following settings:\n' + JSON.stringify($scope.freddySettings));
            }, function errorCallback(response) {
                console.log('Cannot apply settings.');
            });
    };

    $scope.resetSettings = function () {
        $scope.selectedAnalogyName = $scope.analogyOptions[0].name;

        $scope.freddySettings = Object.assign({}, defaultFreddySettings);
        $scope.applySettings();
    };

    $scope.getTableList($scope.selectedSchema);
    $scope.getQueryList();
    $scope.resetSettings();
}]);