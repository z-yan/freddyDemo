// Configure routes
angular.module('freddyDemo')
    .config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
        $routeProvider
            .when("/", {
                templateUrl: '/app/main.html',
            })
            .when("/test", {
                templateUrl: '/app/test.html',
                controller: 'prototypeController'
            })
            .otherwise({redirectTo: '/'});

        $locationProvider.html5Mode(true);
    }]);