'use strict';

const express = require('express');
const router = express.Router();
const { instantiateStoreController, instantiateAccessController, taskCreate, taskExecute, getAllTasks, getAllTaskExecutions, getATask, getAExecution, deleteATask, deleteAExecution, observerExecution } = require('../controllers');

router.post('/instantiate/store', instantiateStoreController);
router.post('/instantiate/access', instantiateAccessController);
router.post('/execute/task', taskCreate);
router.post('/execute/task/:taskName/execution', taskExecute);
router.get('/execute/task', getAllTasks);
router.get('/execute/task/:taskName/execution', getAllTaskExecutions);
router.get('/execute/task/:taskName', getATask);
router.get('/execute/task/:taskName/execution/:executionName', getAExecution);
router.delete('/execute/task/:taskName', deleteATask);
router.delete('/execute/task/:taskName/execution/:executionName', deleteAExecution);

module.exports = router;
