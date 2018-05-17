const express = require('express');
const router = express.Router();

const db = require('../server/queries');

// RESTful API routes
router.get('/api/similarity', db.getKeywordSimilarity);
router.get('/api/knn', db.getKnn);
router.get('/api/knn_batch', db.getKnnBatch);
router.get('/api/knn_in', db.getKnnIn);
router.get('/api/analogy', db.getAnalogy);
router.get('/api/analogy_in', db.getAnalogyIn);
router.get('/api/grouping', db.getGrouping);
router.get('/api/tables', db.getTables);
router.get('/api/custom_query', db.getCustomQuery);
router.post('/api/settings', db.applySettings);
router.get('/api/test_knn', db.testKnn);
router.get('/api/prewarm', db.prewarm);

module.exports = router;
