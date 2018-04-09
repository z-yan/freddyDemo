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
function getKeywordSimilarity(req, res, next) {
    let keyword = req.query.keyword;

    db.any('SELECT keyword FROM keyword AS k INNER JOIN google_vecs AS v ON k.keyword = v.word INNER JOIN google_vecs AS w ON w.word = $1 ORDER BY cosine_similarity(w.vector, v.vector) DESC FETCH FIRST 10 ROWS ONLY', keyword)
        .then(function (data) {
            res.status(200)
                .json({
                    status: 'success',
                    data: data,
                    message: 'Retrieved keyword similarity'
                });
        })
        .catch(function (err) {
            return next(err);
        });
}

module.exports = {
    getKeywordSimilarity: getKeywordSimilarity
};
