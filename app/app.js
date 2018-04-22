const freddyDemo = angular.module('freddyDemo', [
    'ngRoute',
    'ui.bootstrap',
    'hljs'
]);

freddyDemo.controller('MainController', function ($scope, $http) {
    $scope.isSettingsCollapsed = true;
    $scope.isQueriesCollapsed = true;

    $scope.dbOptions = ['IMDb', 'Discogs'];

    $scope.selectedDb = $scope.dbOptions[0];
    $scope.selectedQueryName = 'Select query';

    $scope.getTableList = function (dbName) {
        $scope.selectedDb = dbName;

        $http.get('/api/tables?db=' + dbName.toLowerCase())
            .then(function successCallback(response) {
                $scope.tables = response.data.data;
            }, function errorCallback(response) {
                console.log("Unable to fetch tables in schema.");
            });
    };

    $scope.getQueryList = function () {
        $http.get('example_queries.json')
            .then(function successCallback(response) {
                $scope.queryList = response.data;
            }, function errorCallback() {
                console.log("Unable to load query JSON file.");
            });
    };

    $scope.executeQuery = function () {
        $http.get('/api/custom_query?query=' + $scope.selectedQuery)
            .then(function successCallback(response) {
                console.log(response.data);
                $scope.currQueryResult = response.data.data;
            }, function errorCallback(response) {
                console.log("Unable to fetch query results.");
            });
    };

    $scope.setSelectedQuery = function (queryName, query) {
        $scope.selectedQuery = query;
        $scope.selectedQueryName = queryName;
    };

    $scope.getTableList($scope.selectedDb);
    $scope.getQueryList();
});