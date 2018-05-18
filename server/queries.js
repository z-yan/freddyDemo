// use bluebird as promise library
const promise = require('bluebird');

const options = {
    promiseLib: promise
};

// connect to dbs
const pgp = require('pg-promise')(options);
const pgMonitor = require('pg-monitor');
pgMonitor.attach(options, ['query', 'error']);

const dbConfiguration = {
    host: 'localhost',
    port: 5432,
    database: 'demo_database',
    user: 'demo_user',
    password: 'demo_password'
};
const db = pgp(dbConfiguration);

const knnSamples = require('./knn_samples.json');

/*
FREDDY UDFs:
*/

/**
 * Keyword similarity query.
 * @param {string} keyword - Keyword to find similarities for.
 * @param {int} results - Number of results.
 */
// TODO use other tables than keywords?
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

/**
 * kNN query.
 * @param {string} query - Keyword to find nearest neighbours for.
 * @param {int} k - Number of next neighbours.
 */
function getKnn(req, res, next) {
    let query = req.query.query;
    let k = parseInt(req.query.k);

    db.any('SELECT * FROM knn($1, $2)', [query, k])
        .then(function (data) {
            res.status(200)
                .json({
                    status: 'success',
                    data: data,
                    message: 'Retrieved kNNs'
                });
        })
        .catch(function (err) {
            return next(err);
        });
}

/**
 * kNN batch query.
 * @param {string[]} query_set - Array of strings to find kNN for.
 * @param {int} k - Number of neighbours.
 */
function getKnnBatch(req, res, next) {
    let query_set = JSON.parse(req.query.query_set);
    let k = req.query.k;

    db.any('SELECT * FROM knn_batch($1, $2)', [query_set, k])
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

/**
 * kNN Query with specific output set.
 * @param {string} query - Title to find nearest neighbours for.
 * @param {int} k - Number of next neighbours.
 * @param {string[]} input_set - Array of strings describing output set.
 */
function getKnnIn(req, res, next) {
    let query = req.query.query;
    let k = parseInt(req.query.k);
    let input_set = JSON.parse(req.query.input_set);

    db.any('SELECT * FROM knn_in($1, $2, $3)', [query, k, input_set])
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

/**
 * Analogy query. Find token which is to `a` as `b` is to `c`.
 * @param {string} a - First argument.
 * @param {string} b - Second argument.
 * @param {string} c - Third argument.
 */
function getAnalogy(req, res, next) {
    let a = req.query.a;
    let b = req.query.b;
    let c = req.query.c;

    db.any('SELECT * FROM analogy($1, $2, $3)', [a, b, c])
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

/**
 * Analogy query with specific output set.
 * @param {string} w1 - First argument.
 * @param {string} w2 - Second argument.
 * @param {string} w3 - Third argument.
 * @param {string[]} input_set - Array of strings describing output set.
 */
function getAnalogyIn(req, res, next) {
    let w1 = req.query.w1;
    let w2 = req.query.w2;
    let w3 = req.query.w3;
    let input_set = JSON.parse(req.query.input_set);

    db.any('SELECT * FROM analogy_in($1, $2, $3, $4::varchar(100)[])', [w1, w2, w3, input_set])
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

/**
 * Grouping query.
 * @param {string[]} tokens - Array of input tokens.
 * @param {string[]} groups - Array of grouping tokens.
 */
function getGrouping(req, res, next) {
    let tokens = JSON.parse(req.query.tokens);
    let groups = JSON.parse(req.query.groups);

    db.any('SELECT * FROM groups($1, $2)', [tokens, groups])
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

function getTables(req, res, next) {
    let schemaName = req.query.schema;

    db.task(function* (t) {
        let tableNames = yield t.any('SELECT table_name FROM information_schema.tables WHERE table_schema = $1', schemaName).map(a => a.table_name);
        let tables = [];

        for (let i = 0, len = tableNames.length; i < len; i++) {
            let currTableName = tableNames[i];
            let columnInfo = yield t.any('SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2', [schemaName, currTableName]);

            tables.push({
                table_name: currTableName,
                columns: columnInfo
            });
        }

        // console.log('Table names: ' + tableNames);
        // console.log('Table data: ' + tables);

        return tables;
    })
        .then(function (data) {
            res.status(200)
                .json({
                    status: 'success',
                    data: data,
                    message: 'Retrieved tables with columns.'
                });
        })
        .catch(function (err) {
            return next(err);
        });
}

function getCustomQuery(req, res, next) {
    let customQuery = req.query.query;

    db.result(customQuery)
        .then(function (data) {
            res.status(200)
                .json({
                    status: 'success',
                    data: data.rows,
                    duration: data.duration,
                    message: 'Retrieved custom query result'
                });
        })
        .catch(function (error) {
            res.status(500)
                .json({
                    error: error
                });
        });
}

// TODO switch between different word embeddings
function applySettings(req, res, next) {
    /*
        console.log(`Applying settings:
                     Index: ${req.body.index}
                     PV: ${req.body.pv}
                     PV Factor: ${req.body.pvFactor}
                     W Factor: ${req.body.wFactor}
                     Analogy function: ${req.body.analogyType}`);
    */

    const index = req.body.index;
    const pv = req.body.pv;
    const analogyType = req.body.analogyType;

    const pvFactor = req.body.pvFactor;
    const wFactor = req.body.wFactor;

    // Default RAW settings
    let knnFunction = 'k_nearest_neighbour';
    let knnInFunction = 'knn_in_exact';
    // only IVFADC available for kNN batch
    let knnBatchFunction = 'k_nearest_neighbour_ivfadc_batch';
    let analogyFunction = analogyType;
    let analogyInFunction = 'analogy_3cosadd_in';
    let groupsFunction = 'grouping_func';

    switch (index) {
        case 'PQ':
            knnFunction = pv ? 'k_nearest_neighbour_pq_pv' : 'k_nearest_neighbour_pq';
            knnInFunction = 'knn_in_pq';
            if (analogyFunction === 'analogy_3cosadd') {
                analogyFunction = 'analogy_3cosadd_pq';
            }
            analogyInFunction = 'analogy_3cosadd_in_pq';
            groupsFunction = 'grouping_func_pq';
            break;
        case 'IVFADC':
            knnFunction = pv ? 'k_nearest_neighbour_ivfadc_pv' : 'k_nearest_neighbour_ivfadc';
            knnBatchFunction = 'k_nearest_neighbour_ivfadc_batch';
            if (analogyFunction === 'analogy_3cosadd') {
                analogyFunction = 'analogy_3cosadd_ivfadc';
            }
            break;
    }

    db.tx(function* (t) {
        // apply factor settings first
        const q1 = t.any('SELECT set_pvf($1)', pvFactor);
        const q2 = t.any('SELECT set_w($1)', wFactor);

        // apply function settings
        const q3 = t.any('SELECT set_knn_function($1)', knnFunction);
        const q4 = t.any('SELECT set_knn_in_function($1)', knnInFunction);
        const q5 = t.any('SELECT set_knn_batch_function($1)', knnBatchFunction);
        const q6 = t.any('SELECT set_analogy_function($1)', analogyFunction);
        const q7 = t.any('SELECT set_analogy_in_function($1)', analogyInFunction);
        const q8 = t.any('SELECT set_groups_function($1)', groupsFunction);

        return t.batch([q1, q2, q3, q4, q5, q6, q7, q8]);
    })
        .then(function (data) {
            res.status(200)
                .json({
                    status: 'success',
                    message: 'Applied settings successfully'
                });

            /*            db.task(function* (t) {
                            let usedPvf = JSON.stringify(yield t.one('SELECT get_pvf()'));
                            let usedW = JSON.stringify(yield t.one('SELECT get_w()'));
                            let usedKnn = JSON.stringify(yield t.one('SELECT get_knn_function_name()'));
                            let usedKnnIn = JSON.stringify(yield t.one('SELECT get_knn_in_function_name()'));
                            let usedKnnBatch = JSON.stringify(yield t.one('SELECT get_knn_batch_function_name()'));
                            let usedAnalogy = JSON.stringify(yield t.one('SELECT get_analogy_function_name()'));
                            let usedAnalogyIn = JSON.stringify(yield t.one('SELECT get_analogy_in_function_name()'));
                            let usedGroups = JSON.stringify(yield t.one('SELECT get_groups_function_name()'));

                            console.log(`Current settings:
                                 PVF: ${usedPvf}
                                 W: ${usedW}
                                 kNN: ${usedKnn}
                                 kNN In: ${usedKnnIn}
                                 kNN Batch: ${usedKnnBatch}
                                 Analogy: ${usedAnalogy}
                                 Analogy In: ${usedAnalogyIn}
                                 Groups: ${usedGroups}`);
                        })
                            .then(function (data) {
                            })
                            .catch(function (err) {
                                return next(err);
                            });*/
        })
        .catch(function (err) {
            return next(err);
        });
}

// modified from https://stackoverflow.com/questions/2532218/pick-random-property-from-a-javascript-object
function pickNRandomProperties(obj, n) {
    let keys = Object.keys(obj);
    let result = new Set();

    while (result.size < n) {
        result.add(keys[keys.length * Math.random() << 0]);
    }

    return result;
}

// calculate mathematical average of all numerical values in array
function arrayAvg(array) {
    let total = 0;
    for (let i = 0; i < array.length; i++) {
        total += array[i];
    }
    return total / array.length;
}

// kNN performance test function
function testKnn(req, res, next) {
    let queryNumber = parseInt(req.query.query_number);
    let k = parseInt(req.query.k);

    // choose n random query terms
    let samples = {};

    pickNRandomProperties(knnSamples, queryNumber).forEach(function (value, value2, set) {
        // get first k sample results only
        samples[value] = knnSamples[value].slice(0, k);
    });

    // get query results for query terms with currently used settings
    let queryResults = {};
    let terms = Object.keys(samples);

    db.task(function* (t) {
        let queries = [];

        terms.forEach(function (value) {
            queries.push(t.result('SELECT word FROM knn($1, $2) ORDER BY similarity DESC', [value, k]));
        });

        return t.batch(queries);
    })
        .then(function (data) {
            // associate query result with term
            terms.forEach(function (value, index, array) {
                let currResult = [];

                data[index].rows.forEach(function (value) {
                    currResult.push(value[Object.keys(value)[0]]);
                });

                queryResults[value] = currResult;
            });

            // compare results to sample results
            let precisionValues = [];

            Object.keys(queryResults).forEach(function (value) {
                // calculate precision ignoring results order
                let currResults = new Set(queryResults[value]);
                let currSampleResults = new Set(samples[value]);

                let resultsIntersection = new Set([...currResults].filter(x => currSampleResults.has(x)));

                let currPrecision = resultsIntersection.size / currSampleResults.size;

                precisionValues.push(currPrecision);
            });

            // calculate average precision
            let avgPrecision = arrayAvg(precisionValues);

            // calculate average duration
            let durationValues = [];
            data.forEach(function (value) {
                durationValues.push(value.duration);
            });
            let avgDuration = arrayAvg(durationValues);

            res.status(200).json({
                    avgPrecision: avgPrecision,
                    avgDuration: avgDuration
                }
            );
        })
        .catch(function (err) {
            return next(err);
        });
}

function prewarm(req, res, next) {
    const indexTables = ['pq_codebook', 'pq_quantization', 'fine_quantization', 'coarse_quantization', 'residual_codebook'];

    db.task(function* (t) {
        let queries = [];

        indexTables.forEach(function (value) {
            queries.push(t.result('SELECT pg_prewarm($1)', value));
        });

        return t.batch(queries);
    })
        .then(function (data) {
            res.status(200).json({
                message: 'Executed prewarm successfully'
            });
        })
        .catch(function (err) {
            return next(err);
        });
}

module.exports = {
    getKeywordSimilarity: getKeywordSimilarity,
    getKnn: getKnn,
    getKnnBatch: getKnnBatch,
    getKnnIn: getKnnIn,
    getAnalogy: getAnalogy,
    getAnalogyIn: getAnalogyIn,
    getGrouping: getGrouping,
    getTables: getTables,
    getCustomQuery: getCustomQuery,
    applySettings: applySettings,
    testKnn: testKnn,
    prewarm: prewarm
};
