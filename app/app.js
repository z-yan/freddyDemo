const freddyDemo = angular.module('freddyDemo', [
    'ngRoute',
    'ui.bootstrap',
    'hljs',
    'ngTable'
]);

freddyDemo.controller('MainController', ['$scope', '$http', 'NgTableParams', function ($scope, $http, NgTableParams) {
    $scope.isSettingsCollapsed = true;
    $scope.isQueriesCollapsed = true;

    $scope.schemaOptions = ['IMDb', 'Discogs'];

    $scope.selectedSchema = $scope.schemaOptions[0];
    $scope.selectedQuery = 'Select query';

    $scope.getTableList = function (schemaName) {
        $scope.selectedSchema = schemaName;

        $http.get('/api/tables?schema=' + schemaName.toLowerCase())
            .then(function successCallback(response) {
                $scope.tables = response.data.data;
            }, function errorCallback(response) {
                console.log("Unable to fetch tables in schema.");
            });
    };

    $scope.getQueryList = function () {
        $http.get('/api/query_list')
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

    $scope.setSelectedQuery = function (query) {
        $scope.selectedQuery = query;
    };

    $scope.getTableList($scope.selectedSchema);
    $scope.getQueryList();
}]);