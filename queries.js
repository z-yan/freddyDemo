const promise = require('bluebird');

const options = {
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

// cosine similarity: requires keyword and number of results
// TODO different tables
function getKeywordSimilarity(req, res, next) {
    let keyword = req.query.keyword;
    let results = parseInt(req.query.results);

    db.any('SELECT keyword FROM keyword AS k INNER JOIN google_vecs AS v ON k.keyword = v.word INNER JOIN google_vecs AS w ON w.word = $1 ORDER BY cosine_similarity(w.vector, v.vector) DESC FETCH FIRST $2 ROWS ONLY', [keyword, results])
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

// kNN queries
function getKnn(req, res, next) {
    let title = req.query.title;
    let index = req.query.index;
    let results = parseInt(req.query.results);
    let udf = useIndex(index);
    let usePv = req.query.use_pv === 'true' ? '_pv' : '';

    db.any('SELECT t.word, t.squaredistance FROM ' + udf + usePv + '($1, $2) AS t ORDER BY t.squaredistance DESC', [title, results])
        .then(function (data) {
            res.status(200)
                .json({
                    status: 'success',
                    data: data,
                    message: 'Retrieved kNNs using ' + index + ' index'
                });
        })
        .catch(function (err) {
            return next(err);
        });
}

function getKnnBatch(req, res, next) {
    let array = JSON.parse(req.query.array);
    let k = req.query.k;

    db.any('SELECT * FROM k_nearest_neighbour_ivfadc_batch($1, $2)', [array, k])
        .then(function (data) {
            res.status(200)
                .json({
                    status: 'success',
                    data: data,
                    message: 'Retrieved batch kNN'
                });
        })
        .catch(function (err) {
            return next(err);
        });
}

function getKnnIn(req, res, next) {
    let title = req.query.title;
    let results = parseInt(req.query.results);
    let outputSet = JSON.parse(req.query.output_set);
    let usePq = useIndex(req.query.use_pq);

    db.any('SELECT * FROM knn_in' + usePq + '($1, $2, $3)', [title, results, outputSet])
        .then(function (data) {
            res.status(200)
                .json({
                    status: 'success',
                    data: data,
                    message: 'Retrieved kNN with specific output set'
                });
        })
        .catch(function (err) {
            return next(err);
        });
}

function getAnalogy(req, res, next) {
    let arg1 = req.query.arg1;
    let arg2 = req.query.arg2;
    let arg3 = req.query.arg3;
    let index = req.query.index;
    let udf = useIndex(index);

    db.any('SELECT * FROM analogy_3cosadd' + udf + '($1, $2, $3)', [arg1, arg2, arg3])
        .then(function (data) {
            res.status(200)
                .json({
                    status: 'success',
                    data: data,
                    message: 'Retrieved analogy'
                });
        })
        .catch(function (err) {
            return next(err);
        });
}

function getAnalogyIn(req, res, next) {
    let arg1 = req.query.arg1;
    let arg2 = req.query.arg2;
    let arg3 = req.query.arg3;
    let outputSet = JSON.parse(req.query.output_set);
    let usePq = useIndex(req.query.use_pq);

    db.any('SELECT result FROM analogy_3cosadd_in' + usePq + '($1, $2, $3, $4::varchar(100)[])', [arg1, arg2, arg3, outputSet])
        .then(function (data) {
            res.status(200)
                .json({
                    status: 'success',
                    data: data,
                    message: 'Retrieved analogy with specific output set'
                });
        })
        .catch(function (err) {
            return next(err);
        });
}

function getGrouping(req, res, next) {
    let tokens = JSON.parse(req.query.tokens);
    let groupTokens = JSON.parse(req.query.group_tokens);
    let usePq = useIndex(req.query.use_pq);

    db.any('SELECT token, grouptoken FROM grouping_func' + usePq + '($1, $2)', [tokens, groupTokens])
        .then(function (data) {
            res.status(200)
                .json({
                    status: 'success',
                    data: data,
                    message: 'Retrieved token grouping'
                });
        })
        .catch(function (err) {
            return next(err);
        });
}

function useIndex(index) {
    let udf;

    if (index === 'ivfadc') {
        udf = '_ivfadc';
    }
    else if (index === 'pq') {
        udf = '_pq';
    }
    else {
        udf = '';
    }

    return udf;
}

module.exports = {
    getKeywordSimilarity: getKeywordSimilarity,
    getKnn: getKnn,
    getKnnBatch: getKnnBatch,
    getKnnIn: getKnnIn,
    getAnalogy: getAnalogy,
    getAnalogyIn: getAnalogyIn,
    getGrouping: getGrouping
};
