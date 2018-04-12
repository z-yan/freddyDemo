let freddyDemo = angular.module('freddyDemo', [
    'ngRoute'
]);

freddyDemo.controller('prototypeController', function ($scope, $http) {
    $scope.getRequest = function () {
        $http.get('http://localhost:3000/api/similarity?keyword=' + $scope.keyword + '&results=' + $scope.results)
            .then(function successCallback(response) {
                $scope.similarity = response.data.data;
            }, function errorCallback(response) {
                console.log("Unable to perform get request");
            });
    };
});