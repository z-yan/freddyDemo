// Configure routes
angular.module('freddyDemo')
    .config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
        $routeProvider
            .when("/", {
                templateUrl: '/app/main.html',
                controller: 'MainController'
            })
            .otherwise({redirectTo: '/'});

        $locationProvider.html5Mode(true);
    }]);