angular.module('prototype').component('prototype', {
    templateUrl: 'components/prototype.template.html',
    controller: ['$scope', '$http', function PrototypeController($scope, $http) {
        $http.get('http://localhost:3000/api/similarity?keyword=' + $scope.keyword + '&results=' + $scope.results).
        success(function (data, status, headers, config) {
            $scope.similarity = data;
        }).error(function (data, status, headers, config) {
            alert('error');
        });
    }]
});