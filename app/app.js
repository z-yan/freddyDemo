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

    $scope.schemaOptions = ['IMDb', 'dblp', 'Discogs'];
    $scope.selectedSchema = $scope.schemaOptions[0];
    $scope.tables = {};

    $scope.isAccordionHeaderOpen = false;

    $scope.isQueryEditorCollapsed = true;

    $scope.indexOptions = ['RAW', 'PQ', 'IVFADC'];

    $scope.vecsOptions = ['Google News', 'Wikidata', 'GloVe'];
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
        step: 1,
        logScale: true
    };

    $scope.wFacSliderOptions = {
        floor: 1,
        ceil: 100,
        step: 1,
        logScale: true
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

    $scope.activeView = 'queries';

    $scope.currError = null;

    function createEditor() {
        editorTextArea = document.getElementById('queryTextArea');
        queryEditor = CodeMirror.fromTextArea(editorTextArea, {
            value: '',
            mode: 'text/x-pgsql',
            //theme: 'github',
            lineWrapping: true
        });

        /*        queryEditor.on("beforeChange", function (instance, change) {
                    let newtext = change.text.join("").replace(/\n/g, "");
                    change.update(change.from, change.to, [newtext]);
                    return true;
                });*/

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

    $scope.setActiveView = function (viewName) {
        $scope.activeView = viewName;
    };

    $scope.selectSchema = function (schemaName) {
        $scope.selectedSchema = schemaName;
        $scope.selectedQuery = null;
        $scope.isQueryEditorCollapsed = true;

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

    $scope.setQueryFromList = function (query) {
        if (queryEditor == null) {
            createEditor();
        }

        $scope.isQueryEditorCollapsed = false;

        $scope.updateEditor(query.query);

        $scope.selectedQuery = query;
    };

    $scope.setAttributeQuery = function (table, attr) {
        if (queryEditor == null) {
            createEditor();
        }

        $scope.isQueryEditorCollapsed = false;

        $scope.selectedQuery = {};
        $scope.selectedQuery.query = 'SELECT ' + attr + ' FROM ' + $scope.selectedSchema.toLowerCase() + '.' + table + ' LIMIT 1000';
        $scope.selectedQuery.description = 'Custom attribute query';
        $scope.selectedQuery.type = 'attr';

        $scope.updateEditor($scope.selectedQuery.query);
    };

    $scope.executeQuery = function () {
        if (!(JSON.stringify($scope.freddySettings) === JSON.stringify($scope.appliedSettings))) {
            $scope.applySettings();
        }

        $scope.prevQuery = $scope.currQuery;
        $scope.currQuery = queryEditor.getValue();

        // replace line breaks with space
        let queryParam = $scope.currQuery.replace(/\n/g, " ");
        // replace % with %25 to avoid request parsing problems
        queryParam = queryParam.replace(/%/g, "%25");
        // replace tabs with spaces
        queryParam = queryParam.replace(/\t/g, " ");

        $http.get('/api/custom_query?query=' + queryParam)
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
                console.log('Failed to execute query:\n' + JSON.stringify(response.data.error));
                $scope.currError = response.data.error;
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
        // TODO: apply selected word embeddings to FREDDY via init function
        $scope.selectedVecs = vecs;
    };

    $scope.setAnalogy = function (analogy, analogyName) {
        $scope.freddySettings.analogyType = analogy;
        $scope.selectedAnalogyName = analogyName;
    };

    $scope.disableRaw = function () {
        if ($scope.selectedQuery != null && $scope.activeView === 'queries') {
            let knnBatchDisable = $scope.selectedQuery.type === 'knn_batch';

            if (knnBatchDisable) {
                $scope.freddySettings.index = 'IVFADC';
                return true;
            }
        }

        return false;
    };

    $scope.disablePq = function () {
        if ($scope.selectedQuery != null && $scope.activeView === 'queries') {
            let analogyDisable = $scope.selectedQuery.type === 'analogy'
                && ($scope.freddySettings.analogyType === 'analogy_pair_direction'
                    || $scope.freddySettings.analogyType === 'analogy_3cosmul');

            let knnBatchDisable = $scope.selectedQuery.type === 'knn_batch';
            let pqActive = $scope.freddySettings.index === 'PQ';
            let similarityDisable = $scope.selectedQuery.type === 'similarity';

            if (analogyDisable || similarityDisable) {
                if (pqActive) {
                    $scope.freddySettings.index = 'RAW';
                }
                return true;
            }
            else if (knnBatchDisable) {
                $scope.freddySettings.index = 'IVFADC';
                return true;
            }
        }

        return false;
    };

    $scope.disableIvfadc = function () {
        if ($scope.selectedQuery != null && $scope.activeView === 'queries') {
            let analogyDisable = $scope.selectedQuery.type === 'analogy'
                && ($scope.freddySettings.analogyType === 'analogy_pair_direction'
                    || $scope.freddySettings.analogyType === 'analogy_3cosmul');
            let knnInDisable = $scope.selectedQuery.type === 'knn_in';
            let analogyInDisable = $scope.selectedQuery.type === 'analogy_in';
            let groupsDisable = $scope.selectedQuery.type === 'groups';
            let ivfadcActive = $scope.freddySettings.index === 'IVFADC';
            let similarityDisable = $scope.selectedQuery.type === 'similarity';

            if (analogyDisable || knnInDisable || analogyInDisable || groupsDisable || similarityDisable) {
                if (ivfadcActive) {
                    $scope.freddySettings.index = 'RAW';
                }
                return true;
            }
        }

        return false;
    };

    $scope.applySettings = function () {
        if (!($scope.freddySettings.index === 'IVFADC')) {
            $scope.freddySettings.wFactor = 1;
        }

        if (!$scope.freddySettings.pv) {
            $scope.freddySettings.pvFactor = 1;
        }

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
                //console.log('Applied following settings:\n' + JSON.stringify($scope.freddySettings));
            }, function errorCallback(response) {
                console.log('Cannot apply settings.');
            });
    };

    $scope.resetSettings = function () {
        $scope.selectedAnalogyName = $scope.analogyOptions[0].name;

        $scope.freddySettings = Object.assign({}, defaultFreddySettings);
        $scope.applySettings();
    };

    $scope.prewarm = function () {
        $http.get('/api/prewarm')
            .then(function successCallback() {

            }, function errorCallback() {

            });
    };

    // Chart generation
    let chartExists = false;

    $scope.perfParams = {
        noOfQueries: 1,
        kParam: 1000
    };

    $scope.updateChart = function () {
        $http.get('/api/test_knn?query_number=' + $scope.perfParams.noOfQueries + '&k=' + $scope.perfParams.kParam)
            .then(function successCallback(response) {
                // create chart if it doesn't exist yet
                if (!chartExists) {
                    /*
                        dirty hack to show legend at all times:
                        add one data point off the plot for each trace
                     */
                    let rawTrace = {
                        name: 'RAW',
                        mode: 'markers',
                        type: 'scatter',
                        x: [-5],
                        y: [-5],
                        text: [''],
                        marker: {
                            size: 12,
                            line: {
                                color: ['rgb(0, 0, 0)'],
                                width: [0],
                                opacity: [1]
                            }
                        },
                        cliponaxis: false,
                    };

                    let pqTrace = {
                        name: 'PQ',
                        mode: 'markers',
                        type: 'scatter',
                        x: [-5],
                        y: [-5],
                        text: [''],
                        marker: {
                            size: 12,
                            line: {
                                color: ['rgb(0, 0, 0)'],
                                width: [0]
                            },
                            opacity: [1]
                        },
                        cliponaxis: false,
                    };

                    let ivfadcTrace = {
                        name: 'IVFADC',
                        mode: 'markers',
                        type: 'scatter',
                        x: [-5],
                        y: [-5],
                        text: [''],
                        marker: {
                            size: 12,
                            line: {
                                color: ['rgb(0, 0, 0)'],
                                width: [0]
                            },
                            opacity: [1]
                        },
                        cliponaxis: false,
                    };

                    let data = [rawTrace, pqTrace, ivfadcTrace];

                    let layout = {
                        xaxis: {
                            title: 'Avg. execution time (in s)',
                            range: [0, 30],
                            showline: true,
                            dtick: 0.5,
                            layer: 'below traces',
                            fixedrange: true
                        },
                        yaxis: {
                            title: 'Precision',
                            range: [0, 1],
                            showline: true,
                            dtick: 0.125,
                            layer: 'below traces',
                            fixedrange: true
                        },
                        showlegend: true,
                        legend: {
                            x: 1,
                            y: 1
                        },
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

                if ($scope.appliedSettings.index === 'RAW') {
                    traceIndex = 0;

                    infoText = '';
                }
                else if ($scope.appliedSettings.index === 'PQ') {
                    traceIndex = 1;

                    infoText = $scope.appliedSettings.pv ? 'PV = ' + $scope.appliedSettings.pvFactor : '';
                }
                else if ($scope.appliedSettings.index === 'IVFADC') {
                    traceIndex = 2;

                    infoText = 'W = ' + $scope.appliedSettings.wFactor;

                    if ($scope.appliedSettings.pv) {
                        infoText = infoText + '; PV = ' + $scope.appliedSettings.pvFactor;
                    }
                }

                // add new point to chart
                Plotly.extendTraces('perfChart', {
                    x: [[response.data.avgDuration / 1000]],
                    y: [[response.data.avgPrecision]],
                    text: [[infoText]]
                }, [traceIndex]);

                let lastIndex = graphDiv.data[traceIndex].x.length - 1;
                if ($scope.appliedSettings.pv && ['PQ', 'IVFADC'].includes($scope.appliedSettings.index)) {
                    Plotly.restyle('perfChart', {
                        [`marker.line.color[${lastIndex}]`]: 'rgb(0, 0, 0)',
                        [`marker.line.width[${lastIndex}]`]: 2,
                        [`marker.opacity[${lastIndex}]`]: 0.5
                    }, traceIndex);
                }
                // again, dirty hack to fix appearance of new points...
                else {
                    Plotly.restyle('perfChart', {
                        [`marker.line.color[${lastIndex}]`]: 'rgb(0, 0, 0)',
                        [`marker.line.width[${lastIndex}]`]: 0,
                        [`marker.opacity[${lastIndex}`]: 1
                    }, traceIndex);
                }
            }, function errorCallback(response) {
                console.log('Unable to update chart.');
            });
    };

    $scope.closeError = function () {
        $scope.currError = null;
    };

    $scope.selectSchema($scope.selectedSchema);
    $scope.getQueryList();
    $scope.resetSettings();
}]);