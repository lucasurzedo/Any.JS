'use strict';

const express = require('express');
const router = express.Router();
const controllers = require('../controllers');

// requests for register service
router.post('/register', controllers. registerCode);
router.get('/register/:codeName', controllers.getCode);
router.delete('/register/:codeName', controllers.deleteCode);

// requests for store service
router.post('/store/object', controllers.createObject);
router.get('/store/object/', controllers.getAllObjects);
router.get('/store/object/:objectName', controllers.getObject);
router.delete('/store/object/:objectName', controllers.deleteObject);

// requests for instantiate service

// requests for execute service
router.post('/execute/task', controllers.createTask);
router.post('/execute/task/:taskName/execution', controllers.taskExecute);
router.get('/execute/task', controllers.getAllTasks);
router.get('/execute/task/:taskName/execution', controllers.getAllTaskExecutions);
router.get('/execute/task/:taskName', controllers.getTask);
router.get('/execute/task/:taskName/execution/:executionName', controllers.getExecution);
router.delete('/execute/task/:taskName', controllers.deleteTask);
router.delete('/execute/task/:taskName/execution/:executionName', controllers.deleteExecution);

// requests for sync service

// requests for lock and unlock service



module.exports = router;
