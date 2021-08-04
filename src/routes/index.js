const express = require('express');

const router = express.Router();
const register = require('../controllers/register');
const store = require('../controllers/store');
const task = require('../controllers/task');
const map = require('../controllers/map')

// requests for register service
router.post('/register', register.registerCode);
router.get('/register/:codeName', register.getCode);
router.delete('/register/:codeName', register.deleteCode);

// requests for store service
router.post('/store/object', store.storeObject);
router.get('/store/object/', store.getAllObjects);
router.get('/store/object/:codeName/:objectName', store.getObject);
router.delete('/store/object/:codeName/:objectName', store.deleteObject);

// requests for instantiate service
router.post('/instantiate/', store.instantiateObject);
router.get('/instantiate/', store.getAllObjects);
router.get('/instantiate/:objectName', store.getObject);
router.delete('/instantiate/:objectName', store.deleteObject);

// requests for execute service
router.post('/execute/task', task.createTask);
router.post('/execute/task/:taskName/execution', task.taskExecute);
router.get('/execute/task', task.getAllTasks);
router.get('/execute/task/:taskName/execution', task.getAllTaskExecutions);
router.get('/execute/task/:taskName', task.getTask);
router.get('/execute/task/:taskName/execution/:executionName', task.getExecution);
router.delete('/execute/task/:taskName', task.deleteTask);
router.delete('/execute/task/:taskName/execution/:executionName', task.deleteExecution);

// requests for map service
router.post('/map/clear', map.clearMap);
router.post('/map/delete', map.deleteKey);
router.post('/map/entries', map.getIterator);
router.post('/map/forEach', map.mapForEach);
router.post('/map/get', map.getElement);
router.post('/map/has', map.hasElement);
router.post('/map/keys', map.getAllKeys);
router.post('/map/set', map.setElement);
router.post('/map/values', map.getAllElements);

// requests for sync service

// requests for lock and unlock service

module.exports = router;
