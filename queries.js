const promise = require('bluebird');

const options = {
    // Initialization Options
    promiseLib: promise
};

const pgp = require('pg-promise')(options);
const configuration = {
    host: 'localhost',
    port: 5432,
    database: 'demo_database',
    user: 'demo_user',
    password: '2\\a{KWvix_<M9%63',
};
const db = pgp(configuration);

// TODO add query functions
function getSimilarity(req, res, next) {
    db.any('select cosine_similarity(\'one\', \'two\')')
        .then(function (data) {
            res.status(200)
                .json({
                    status: 'success',
                    data: data,
                    message: 'Retrieved similarity'
                });
        })
        .catch(function (err) {
            return next(err);
        });
}

module.exports = {
    getSimilarity: getSimilarity
};
