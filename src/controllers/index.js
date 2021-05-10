'use strict';

const utils = require('../utils/index');
const mongoose = require('mongoose');
const pluralize = require('pluralize');
const ModelTask = require('../models/modelTask');
const ModelObject = require('../models/modelObject');
const ModelRegister = require('../models/modelRegister');
const validUrl = require('valid-url');
const executeFunction = require('../services/executeFunction');

async function registerCode(req, res) {
	if (!req.body.codeName || !req.body.code || !req.body.language) {
		let jsonError = {
			uri : req.baseUrl + "" + req.url,
			"result": "invalid JSON",
			"status": 400
		}

		res.send(jsonError);

		return;
	}

	var codes = [];
	for (const iterator of req.body.code) {
		codes.push(iterator);
	}

	for (let i = 0; i < codes.length; i++) {
		for (var key in codes[i]){
			if (!validUrl.isUri(codes[i][key])) {
				let jsonError = {
					uri : req.baseUrl + "" + req.url,
					"result": "invalid url",
					"status": 406
				}
				res.send(jsonError);
		
				return;
			}
		}
	}

	mongoose.connection.db.collection('registers', (error, collection) => {
		if (error) {
			console.log(error);
		}

		
		collection.findOne({"codeName": req.body.codeName}, async (error, data) => {
			if (error) {
				console.log(error);
			}

			if (data) {
				let jsonError = {
					uri : req.baseUrl + "" + req.url,
					"result": "duplicate file",
					"status": 409
				}
				res.send(jsonError);
				
				return;
			}
			else {
				const Code = mongoose.model('register', ModelRegister);
				const newCode = new Code({
					codeName: req.body.codeName,
					language: req.body.language,
					code: req.body.code
				});

				newCode.save();
				
				let jsonResult = {
					result : req.baseUrl + "" + req.url + `/${req.body.codeName}`,
					status : 201
				}
				res.send(jsonResult);
			}
		});
	});
}

async function getCode(req, res) {
	const collectionName = 'registers';

	mongoose.connection.db.collection(collectionName, (error, collection) => {
		if (error) {
			console.log(err);
			return;
		}

		collection.findOne({"codeName": req.params['codeName']}, async (error, data) => {
			if (error) {
				console.log(error);
			}
			if (!data) {
				let jsonError = {
					uri : req.baseUrl + "" + req.url,
					"result": `cannot find code ${req.params['codeName']}`,
					"status": 406
				}
				res.send(jsonError);
			}
			else {
				var jsonResult = {
					uri : req.baseUrl + "" + req.url,
					object : data,
					status : 200
				}
				res.send(jsonResult);
			}
		});
	});
}

async function deleteCode(req, res) {
	var jsonResult = {
		uri : req.baseUrl + "" + req.url
	}

	mongoose.connection.db.collection('registers', (err, collection) => {
		if (err) {
			console.log(err);
			return;
		}

		collection.deleteOne({ codeName : req.params['codeName']}, (err, result) => {
			if (err) {
				console.log(err);
			}
			else {
				if (result.deletedCount > 0) {
					jsonResult.result = `execution ${req.params['codeName']} deleted`;
					jsonResult.status = 200;
					res.send(jsonResult);
				}
				else {
					jsonResult.result = `execution ${req.params['codeName']} do not exist`;
					jsonResult.status = 404;
					res.send(jsonResult);
				}
			}
		});
	});
}

async function createObject(req, res) {
	
}

async function getAllObjects(req, res) {
	var jsonResult = {
		uri : req.baseUrl + "" + req.url,
		objects: null
	}

	const collectionName = 'cars';

	mongoose.connection.db.collection(collectionName, (err, collection) => {
		if (err) {
			console.log(err);
			return;
		}
		
		collection.find({}).toArray( (error, documents) => {
			if (error) {
				console.log(error);
				return;
			}
			
			var objects = [];

			for (const iterator of documents) {
				objects.push(iterator);
			}
			if (objects.length === 0) {
				jsonResult.result = `there is no objects in collection objects`
				jsonResult.status = 404;
				res.send(jsonResult);
			}
			else{
				jsonResult.objects = objects
				jsonResult.status = 200;
				res.send(jsonResult);
			}
		});
	});
}

async function getObject(req, res) {
	var jsonResult = {
		uri : req.baseUrl + "" + req.url,
		object : null
	}
	const collectionName = 'objects';

	mongoose.connection.db.collection(collectionName, (err, collection) => {
		if (err) {
			console.log(err);
			return;
		}

		collection.find({}).toArray( (error, documents) => {
			if (error) {
				console.log(error);
				return;
			}

			for (const iterator of documents) {
				if (iterator.objectName != undefined) {
					jsonResult.object = iterator;
				}
			}
			if (jsonResult.object === null) {
				delete jsonResult.object;
				jsonResult.result = `there is no object ${req.params['objectName']}`
				jsonResult.status = 404;
				res.send(jsonResult)
			}
			else {
				jsonResult.status = 200;
				res.send(jsonResult);
			}
		});
	});
}

async function deleteObject(req, res) {
	var jsonResult = {
		uri : req.baseUrl + "" + req.url
	}
	const collectionName = 'objects';

	mongoose.connection.db.collection(collectionName, (err, collection) => {
		if (err) {
			console.log(err);
			return;
		}
		
		collection.deleteOne({ objectName : req.params['objectName']}, (err, result) => {
			if (err) {
				console.log(err);
			}
			else{
				if (result.deletedCount > 0) {
					jsonResult.result = `object ${req.params['objectName']} deleted`;
					jsonResult.status = 200;
					res.send(jsonResult);
				}
				else {
					jsonResult.result = `object ${req.params['objectName']} do not exist`;
					jsonResult.status = 404;
					res.send(jsonResult);
				}
			}
		});
	});
}

async function createTask (req, res) {
	let jsonError = {
		uri : req.baseUrl + "" + req.url + `/${req.body.taskName}`,
		"Error": "Invalid JSON",
		"status": 400
	}

	var jsonResult = {
		uri : req.baseUrl + "" + req.url + `/${req.body.taskName}`
	}

	if (!req.body.taskName || !req.body.code || !req.body.args || !req.body.method || !req.body.return) {
		res.send(jsonError);
		return;
	}

	var taskName = req.body.code + "";

	mongoose.connection.db.collection('registers', (error, collection) => {
		if (error) {
			console.log(err);
			return;
		}

		collection.findOne({"codeName": req.body.code}, async (error, data) => {
			if (error) {
				console.log(error);
			}
			if (!data) {
				let jsonError = {
					uri : req.baseUrl + "" + req.url,
					"result": `cannot find code ${req.body.code}`,
					"status": 406
				}
				res.send(jsonError);
			}
			else {
				let codes = [];
				let linkMethod;
				for (const iterator of data.code) {
					codes.push(iterator);
				}

				for (let i = 0; i < codes.length; i++) {
					for (let key in codes[i]) {
						if (key === req.body.method) {
							linkMethod = codes[i][key];
						}
					}
				}

				let code = await utils.downloadCode(linkMethod);

				console.log(code);

				// executeFunction({ parameterValue: parameterValue, jsonData : data }).then(result => {
				// 	console.log(result);
				// });

			}
		});
	});

	return;

	var jsonResult = {
		uri : req.baseUrl + "" + req.url + `/${req.body.taskName}`
	}

	mongoose.connection.db.listCollections().toArray(function (err, names) {
		if (err) {
			console.log(err);
		}

		const collectionName = (req.body.taskName + "").toLowerCase();

		const findCollectionResult = names.find(element => element.name === pluralize(collectionName));

		if (findCollectionResult === undefined) {
			const Task = mongoose.model(req.body.taskName, ModelTask);

			const newCollection = new Task({
				taskName: req.body.taskName,
				language: req.body.language,
				author: req.body.author,
				content: req.body.content
			});

			newCollection.save();
			jsonResult.result = "saving task";
			jsonResult.status = 201;
			res.send(jsonResult);
		}
		else {
			jsonResult.result = `task ${req.body.taskName} already exist`;
			jsonResult.status = 409;
			res.send(jsonResult);
		}
	});
}

async function taskExecute (req, res) {
	let jsonError = {
		uri : req.baseUrl + "" + req.url,
		"Error": "Invalid JSON",
		"status": 400
	}

	var jsonResult = {
		uri : req.baseUrl + "" + req.url
	}

	var taskName = req.params['taskName'] + "";

	if (!utils.validVariable(req.body.executions)) {
		if (!utils.validVariable(req.body.executionName)) {
			res.send(jsonError);
			return;
		}

		if (!utils.validVariable(req.body.parameterValue)) {
			res.send(jsonError);
			return;
		}

		jsonResult.uri = req.baseUrl + "" + req.url + `/${req.body.executionName}`;
		utils.createExecution(req.body, res, jsonResult, taskName);
	}
	else {
		var executions = [];
		for (const iterator of req.body.executions) {
			executions.push(iterator);
		}

		for (let i = 0; i < executions.length; i++) {
			if (!utils.validVariable(executions[i].executionName)) {
				res.send(jsonError);
				return;
			}

			if (!utils.validVariable(executions[i].parameterValue)) {
				res.send(jsonError);
				return;
			}

			utils.createExecution(executions[i], res, jsonResult, taskName);
		}
	}
}

async function getAllTasks (req, res) {
	var jsonResult = {
		uri : req.baseUrl + "" + req.url,
		tasks: null
	}

	if (mongoose.connection.db === undefined) {
		jsonResult.tasks = "there is no tasks in the db";
		jsonResult.status = 404;
		res.send(jsonResult);
	}

	await mongoose.connection.db.listCollections().toArray( async (err, collections) => {
		if (err) {
			console.log(err);
		}

		var taskNames = [];

		var flag = false;
		var count = 0;
		for (let i = 0; i < collections.length; i++) {
			await mongoose.connection.db.collection(collections[i].name, async (err, collection) => {
				if (err) {
					console.log(err);
					return;
				}
				await collection.find({}).toArray( (error, documents) => {
					count++;
					if (count === collections.length)
						flag = true;
					
					if (error) {
						console.log(error);
						return;
					}

					for (let j = 0; j < documents.length; j++) {
						if(documents[j].taskName != undefined){
							taskNames.push(documents[j]);
						}
					}
					if (flag) {
						jsonResult.tasks = taskNames;
						if (jsonResult.tasks === null) {
							jsonResult.tasks = "there is no tasks in the db";
						}
						jsonResult.status = 200;
						res.send(jsonResult);
					}
				});
			});
		}
	});
}

async function getAllTaskExecutions(req, res) {
	var jsonResult = {
		uri : req.baseUrl + "" + req.url
	}
	const collectionName = (req.params['taskName'] + "").toLowerCase();
	
	mongoose.connection.db.collection(pluralize(collectionName), (err, collection) => {
		if (err) {
			console.log(err);
			return;
		}
		
		collection.find({}).toArray( (error, documents) => {
			if (error) {
				console.log(error);
				return;
			}
			
			var executions = [];

			for (const iterator of documents) {
				if (iterator.taskName === undefined) {
					executions.push(iterator);
				}
			}
			if (executions.length === 0) {
				jsonResult.result = `there is no executions in collection ${req.params['taskName']}`
				jsonResult.status = 404;
				res.send(jsonResult);
			}
			else {
				jsonResult.executions = executions
				jsonResult.status = 200;
				res.send(jsonResult);
			}
		});
	});
}

async function getTask (req, res) {
	var jsonResult = {
		uri : req.baseUrl + "" + req.url,
		task : null
	}
	const collectionName = (req.params['taskName'] + "").toLowerCase();

	mongoose.connection.db.collection(pluralize(collectionName), (err, collection) => {
		if (err) {
			console.log(err);
			return;
		}

		collection.find({}).toArray( (error, documents) => {
			if (error) {
				console.log(error);
				return;
			}

			for (const iterator of documents) {
				if (iterator.taskName != undefined) {
					jsonResult.task = iterator;
				}
			}
			if (jsonResult.task === null) {
				delete jsonResult.task;
				jsonResult.result = `there is no task ${req.params['taskName']}`
				jsonResult.status = 404;
				res.send(jsonResult)
			}
			else {
				jsonResult.status = 200;
				res.send(jsonResult);
			}
		});
	});
}

async function getExecution (req, res) {
	const collectionName = (req.params['taskName'] + "").toLowerCase();
	var jsonResult = {
		uri : req.baseUrl + "" + req.url,
		execution : null
	}

	mongoose.connection.db.collection(pluralize(collectionName), (err, collection) => {
		if (err) {
			console.log(err);
			return;
		}
		
		collection.find({}).toArray( (error, documents) => {
			if (error) {
				console.log(error);
				return;
			}

			for (const iterator of documents) {
				if (iterator.executionName === req.params['executionName'] ) {
					jsonResult.execution = iterator;
				}
			}
			if (jsonResult.execution === null) {
				delete jsonResult.execution;
				jsonResult.result = `there is no execution ${req.params['executionName']}`
				jsonResult.status = 404;	
				res.send(jsonResult)
			}
			else {
				jsonResult.status = 200;
				res.send(jsonResult);
			}
		});
	});
}

async function deleteTask(req, res) {
	var jsonResult = {
		uri : req.baseUrl + "" + req.url
	}
	const collectionName = (req.params['taskName'] + "").toLowerCase();

	mongoose.connection.db.collection(pluralize(collectionName), (err, collection) => {
		if (err) {
			console.log(err);
			return;
		}
		
		collection.drop();
		jsonResult.result = `task ${req.params['taskName']} deleted`;
		jsonResult.status = 200;
		res.send(jsonResult);
	});
}

async function deleteExecution(req, res) {
	var jsonResult = {
		uri : req.baseUrl + "" + req.url
	}
	const collectionName = (req.params['taskName'] + "").toLowerCase();

	mongoose.connection.db.collection(pluralize(collectionName), (err, collection) => {
		if (err) {
			console.log(err);
			return;
		}
		
		collection.deleteOne({ executionName : req.params['executionName']}, (err, result) => {
			if (err) {
				console.log(err);
			}
			else{
				if (result.deletedCount > 0) {
					jsonResult.result = `execution ${req.params['executionName']} deleted`;
					jsonResult.status = 200;
					res.send(jsonResult);
				}
				else {
					jsonResult.result = `execution ${req.params['executionName']} do not exist`;
					jsonResult.status = 404;
					res.send(jsonResult);
				}
			}
		});
	});
}

function getResult(x) {
    return new Promise(resolve => {
        resolve(x);
    });
}

module.exports = {
	registerCode,
	getCode,
	deleteCode,
	createObject,
	getAllObjects,
	getObject,
	deleteObject,
	createTask,
	taskExecute,
	getAllTasks,
	getAllTaskExecutions,
	getTask,
	getExecution,
	deleteTask,
	deleteExecution
};
