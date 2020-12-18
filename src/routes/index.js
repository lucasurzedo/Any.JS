'use strict';

const express = require('express');
const router = express.Router();
const { instantiateStoreController, instantiateAccessController, taskStoreController, taskAccessController, getResultController } = require('../controllers');

router.post('/instantiate/store', instantiateStoreController);
router.post('/instantiate/access', instantiateAccessController);
router.post('/task/store', taskStoreController);
router.post('/task/access', taskAccessController);
router.post('/getresult', getResultController);

module.exports = router;
