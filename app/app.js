const freddyDemo = angular.module('freddyDemo', [
    'ngRoute',
    'ui.bootstrap'
]);

freddyDemo.config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
    $routeProvider
        .when("/", {
            templateUrl: '/app/test.html',
            controller: 'prototypeController'
        })
        .otherwise({redirectTo: '/'});

    $locationProvider.html5Mode(true);
}]);

freddyDemo.controller('prototypeController', function ($scope, $http) {
    $scope.getRequest = function () {
        $http.get('http://141.76.47.127:3000/api/similarity?keyword=' + $scope.keyword + '&results=' + $scope.results)
            .then(function successCallback(response) {
                $scope.similarity = response.data.data;
            }, function errorCallback(response) {
                console.log("Unable to perform get request");
            });
    };
});
