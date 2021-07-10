'use strict';

const utils = require('../utils/index');
const mongoose = require('mongoose');
const pluralize = require('pluralize');
const ModelTask = require('../models/modelTask');
const ModelObject = require('../models/modelObject');
const ModelRegister = require('../models/modelRegister');
const validUrl = require('valid-url');
const BSON = require('bson');
const executeFunction = require('../services/executeFunction');
const instantiateObj = require('../services/instantiateObj');
const fs = require('fs');

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

async function storeObject(req, res) {
	if (!req.body.objectName || !req.body.code || !req.body.object) {
		let jsonError = {
			uri : req.baseUrl + "" + req.url,
			"result": "invalid JSON",
			"status": 400
		}

		res.send(jsonError);
		return;
	}

	let codeName = req.body.code + "";
	codeName = codeName.toLowerCase();
	req.body.code = codeName;

	const collectionName = req.body.code + "_object";

	mongoose.connection.db.collection(collectionName, (error, collection) => {
		if (error) {
			console.log(error);
		}

		collection.findOne({"objectName": req.body.objectName}, async (error, data) => {
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
				const Object = mongoose.model(collectionName, ModelObject, collectionName);

				let newObject = new Object({
					className: req.body.code,
					objectName: req.body.objectName,
					object: req.body.object
				});

				newObject.save();
				
				let jsonResult = {
					result : req.baseUrl + "" + req.url + `/${req.body.objectName}`,
					status : 201
				}
				res.send(jsonResult);
			}
		});
	});
}

async function instantiateObject(req, res) {
	let jsonError = {
		uri : req.baseUrl + "" + req.url + `/${req.body.objectName}`,
		"Error": "Invalid JSON",
		"status": 400
	}
	
	if (!req.body.objectName || !req.body.code || !req.body.args) {
		res.send(jsonError);
		return;
	}

	let codeName = req.body.code + "";
	codeName = codeName.toLowerCase();
	req.body.code = codeName;

	// Open collection registers on db
	mongoose.connection.db.collection('registers', (error, collection) => {
		if (error) {
			jsonError.Error = err
			res.send(jsonError);
			return;
		}
		// Try to find a code in collection registers
		collection.findOne({"codeName": codeName}, async (error, data) => {
			if (error) {
				jsonError.Error = err
				res.send(jsonError);
				return;
			}
			// Verify if the code exists
			if (!data) {
				let jsonError = {
					uri : req.baseUrl + "" + req.url,
					"result": `cannot find code ${codeName}`,
					"status": 406
				}
				res.send(jsonError);
			}
			else {
				let codes = [];
				let methodsLinks = [];
				// Get all the codes names and links
				for (const iterator of data.code) {
					codes.push(iterator);
				}

				// Separate names and links in a object
				for (let i = 0; i < codes.length; i++) {
					for (let key in codes[i]) {
						methodsLinks.push({ name: key, link: codes[i][key]});
					}
				}

				// Verify if the file already exists
				for (let i = 0; i < methodsLinks.length; i++) {
					let path = `./src/codes/${methodsLinks[i].name}.js`

					if (fs.existsSync(path)) {
						methodsLinks.splice(i, 1);
						--i;
					}
				}

				const collectionName = req.body.code + "_object";

				const objectCollection = mongoose.connection.db.collection(collectionName);
				
				const findExecutionName = await objectCollection.findOne({"objectName": req.body.objectName});

				if (findExecutionName != null) {
					let jsonResult = {
						uri : req.baseUrl + "" + req.url + `/${req.body.taskName}`,
						result: `Object ${req.body.objectName} already exist`,
						status: 409
					}
					res.send(jsonResult)
				}
				else {
					const Object = mongoose.model(collectionName, ModelObject, collectionName);

					let newTask = new Object({
						className: req.body.code,
						objectName: req.body.objectName,
						object: null
					});
					
					await newTask.save();

					// If the file don't exists then its downloaded and executed
					// If the file exists then its executed
					if (methodsLinks.length > 0) {
						let code = await utils.downloadCode(methodsLinks);
						if (code) {
							let jsonResult = {
								uri : req.baseUrl + '' + req.url + `/${req.body.objectName}`,
								result: 'instantiating object',
								status: 201
							}
							res.send(jsonResult);

							instantiateObj(req.body).then(result => {
								console.log(result);
								if (result === 'error during instantiate process') {
									newTask.object = result;
									newTask.save();
								}
								else {
									newTask.object = BSON.serialize(result, { serializeFunctions: true});
									newTask.save();
								}
							});

						}
					}
					else {
						let jsonResult = {
							uri : req.baseUrl + '' + req.url + `/${req.body.objectName}`,
								result: 'instantiating object',
								status: 201
						}
						res.send(jsonResult);

						instantiateObj(req.body).then(result => {
							console.log(result);
							if (result === 'error during instantiate process') {
								newTask.object = result;
								newTask.save();
							}
							else {
								newTask.object = BSON.serialize(result, { serializeFunctions: true});
								newTask.save();
							}
						});
					}
				}
			}
		});
	});
}

async function getAllObjects(req, res) {
	var jsonResult = {
		uri : req.baseUrl + "" + req.url,
		objects: null
	}

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
	
	if (!req.body.taskName || !req.body.code || !req.body.args || !req.body.method || !req.body.return) {
		res.send(jsonError);
		return;
	}

	let codeName = req.body.code + "";
	codeName = codeName.toLowerCase();
	req.body.code = codeName;

	// Open collection registers on db
	mongoose.connection.db.collection('registers', (error, collection) => {
		if (error) {
			console.log(err);
			return;
		}

		// Try to find a code in collection registers
		collection.findOne({"codeName": codeName}, async (error, data) => {
			if (error) {
				console.log(error);
			}

			// Verify if the code exists
			if (!data) {
				let jsonError = {
					uri : req.baseUrl + "" + req.url,
					"result": `cannot find code ${codeName}`,
					"status": 406
				}
				res.send(jsonError);
			}
			else {
				let codes = [];
				let methodsLinks = [];
				// Get all the codes names and links
				for (const iterator of data.code) {
					codes.push(iterator);
				}

				// Separate names and links in a object
				for (let i = 0; i < codes.length; i++) {
					for (let key in codes[i]) {
						methodsLinks.push({ name: key, link: codes[i][key]});
					}
				}

				// Verify if the file already exists
				for (let i = 0; i < methodsLinks.length; i++) {
					let path = `./src/codes/${methodsLinks[i].name}.js`

					if (fs.existsSync(path)) {
						methodsLinks.splice(i, 1);
						--i;
					}
				}

				const collectionName = req.body.code + '_task';

				const taskCollection = mongoose.connection.db.collection(collectionName);
				const findExecutionName = await taskCollection.findOne({"executionName": req.body.taskName});

				if (findExecutionName != null) {
					let jsonResult = {
						uri : req.baseUrl + "" + req.url + `/${req.body.taskName}`,
						result: `Execution ${req.body.taskName} already exist`,
						status: 409
					}
					res.send(jsonResult)
				}
				else {
					const Task = mongoose.model(collectionName, ModelTask, collectionName);

					let newTask = new Task({
						executionName: req.body.taskName,
						parameterValue: req.body.args,
						method: req.body.method,
						taskResult: null
					});
					
					await newTask.save();

					// If the file don't exists then its downloaded and executed
					// If the file exists then its executed
					if (methodsLinks.length > 0) {
						console.log('Download codes');
						let code = await utils.downloadCode(methodsLinks);
						if (code) {
							let jsonResult = {
								uri : req.baseUrl + "" + req.url + `/${req.body.taskName}`,
								result: "saving execution",
								status: 201
							}
							res.send(jsonResult);

							executeFunction(req.body).then(result => {
								console.log(result);
								if (result === 'error during execute process') {
									newTask.taskResult = result;
									newTask.save();
								}
								else {
									newTask.taskResult = result;
									newTask.save();
								}
							});
						}
					}
					else {
						let jsonResult = {
							uri : req.baseUrl + "" + req.url + `/${req.body.taskName}`,
							result: "saving execution",
							status: 201
						}
						res.send(jsonResult);

						executeFunction(req.body).then(result => {
							console.log(result);
							if (result === 'error during execute process') {
								newTask.taskResult = result;
								newTask.save();
							}
							else {
								newTask.taskResult = result;
								newTask.save();
							}
						});
					}
				}
			}
		});
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

module.exports = {
	registerCode,
	getCode,
	deleteCode,
	storeObject,
	instantiateObject,
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
