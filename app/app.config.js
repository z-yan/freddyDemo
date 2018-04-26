// Configure routes
angular.module('freddyDemo')
    .config(['$routeProvider', '$locationProvider', 'cfpLoadingBarProvider', function ($routeProvider, $locationProvider, cfpLoadingBarProvider) {
        $routeProvider
            .when("/", {
                templateUrl: '/app/main.html',
                controller: 'MainController'
            })
            .otherwise({redirectTo: '/'});

        $locationProvider.html5Mode(true);

        cfpLoadingBarProvider.includeSpinner = false;
    }]);