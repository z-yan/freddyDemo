angular.module('freddyDemo').config(['$routeProvider', function config($routeProvider) {
    $routeProvider.when('/prototype', {
        template: '<prototype></prototype>',
        controller: 'PrototypeController'
    });
}]);