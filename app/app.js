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

    $scope.updateTableList = function (dbName) {
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
            .then(function successCallback(data) {
                console.log(data);
            }, function errorCallback() {
                console.log("Unable to load query JSON file.");
            });
    };

    $scope.updateTableList($scope.selectedDb);
    $scope.getQueryList();
});


// Test controller
freddyDemo.controller('PrototypeController', function ($scope, $http) {
    $scope.getRequest = function () {
        $http.get('http://141.76.47.127:3000/api/similarity?keyword=' + $scope.keyword + '&results=' + $scope.results)
            .then(function successCallback(response) {
                $scope.similarity = response.data.data;
            }, function errorCallback(response) {
                console.log("Unable to perform get request");
            });
    };
});
