const express = require('express');
const router = express.Router();

const db = require('../queries');

router.get('/api/similarity', db.getKeywordSimilarity);

module.exports = router;
