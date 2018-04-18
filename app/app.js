const freddyDemo = angular.module('freddyDemo', [
    'ngRoute',
    'ui.bootstrap',
    'hljs'
]);

freddyDemo.controller('MainController', function ($scope) {
    $scope.isSettingsCollapsed = true;
    $scope.isQueriesCollapsed = true;
});

freddyDemo.controller('DbSchemaController', function ($scope) {

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
