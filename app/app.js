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
        step: 1
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
        pvFactor: 20,
        wFactor: 3,
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
                $scope.appliedSettings = Object.assign({}, $scope.freddySettings);
                console.log('Applied following settings:\n' + JSON.stringify($scope.freddySettings));
            }, function errorCallback(response) {
                console.log('Cannot apply settings.');
            });
    };

    $scope.resetSettings = function () {
        $scope.selectedAnalogyName = $scope.analogyOptions[0].name;

        $scope.freddySettings = Object.assign({}, defaultFreddySettings);
        $scope.applySettings();
    };

    let chartExists = false;
    $scope.noOfPerfQueries = 1;
    $scope.perfKParam = 1000;

    $scope.updateChart = function () {
        $http.get('/api/test_knn?query_number=' + $scope.noOfPerfQueries + '&k=' + $scope.perfKParam)
            .then(function successCallback(response) {
                // create chart if it doesn't exist yet
                if (!chartExists) {
                    let rawTrace = {
                        name: 'RAW',
                        mode: 'markers',
                        type: 'scatter',
                        x: [],
                        y: [],
                        marker: {size: 12},
                        cliponaxis: false,
                        text: []
                    };

                    let pqTrace = {
                        name: 'PQ',
                        mode: 'markers',
                        type: 'scatter',
                        x: [],
                        y: [],
                        marker: {size: 12},
                        cliponaxis: false,
                        text: []
                    };

                    let ivfadcTrace = {
                        name: 'IVFADC',
                        mode: 'markers',
                        type: 'scatter',
                        x: [],
                        y: [],
                        marker: {size: 12},
                        cliponaxis: false,
                        text: []
                    };

                    let data = [rawTrace, pqTrace, ivfadcTrace];

                    let layout = {
                        xaxis: {
                            title: 'Time (in s)',
                            range: [1, 30],
                            showline: true
                        },
                        yaxis: {
                            title: 'Precision',
                            range: [0, 1],
                            showline: true
                        },
                        showlegend: true,
                        title: 'kNN Performance',
                    };

                    let config = {
                        displayModeBar: false
                    };

                    // chart code
                    Plotly.plot('perfChart', data, layout, config);
                    chartExists = true;
                }

                // update chart with new data
                let graphDiv = document.getElementById('perfChart');
                let traceIndex;
                let infoText;

                if ($scope.appliedSettings.pv && ['PQ', 'IVFADC'].includes($scope.appliedSettings.index)) {
                    infoText = 'PV: ' + $scope.appliedSettings.pvFactor;
                }

                if ($scope.appliedSettings.index === 'RAW') {
                    traceIndex = 0;
                }
                else if ($scope.appliedSettings.index === 'PQ') {
                    traceIndex = 1;
                }
                else if ($scope.appliedSettings.index === 'IVFADC') {
                    traceIndex = 2;
                }

                // add new point to chart
                Plotly.extendTraces('perfChart', {
                    x: [[response.data.avgDuration / 1000]],
                    y: [[response.data.avgPrecision]],
                    text: [[infoText]]
                }, [traceIndex]);

                if ($scope.appliedSettings.pv && ['PQ', 'IVFADC'].includes($scope.appliedSettings.index)) {
                    let lastIndex = graphDiv.data[traceIndex].x.length - 1;
                    Plotly.restyle('perfChart', {
                        [`marker.line.color[${lastIndex}]`]: 'rgb(0, 0, 0)',
                        [`marker.line.width[${lastIndex}]`]: 2
                    }, traceIndex);
                }
            }, function errorCallback(response) {
                console.log('Unable to update chart.');
            });
    };

    $scope.getTableList($scope.selectedSchema);
    $scope.getQueryList();
    $scope.resetSettings();
}]);