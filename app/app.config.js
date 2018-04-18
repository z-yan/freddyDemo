// Configure routes
angular.module('freddyDemo')
    .config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
        $routeProvider
            .when("/", {
                templateUrl: '/app/main.html',
                controller: 'MainController'
            })
            .when("/test", {
                templateUrl: '/app/test.html',
                controller: 'PrototypeController'
            })
            .otherwise({redirectTo: '/'});

        $locationProvider.html5Mode(true);
    }]);