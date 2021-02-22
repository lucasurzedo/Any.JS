'use strict';

const utils = require('../utils/index');
const mongoose = require('mongoose');
const pluralize = require('pluralize');
const ModelTask = require('../models/modelTask');

function instantiateStoreController(req, res) {
	let jsonError = {
		"Error": "Invalid JSON"
	}
	if (!utils.validVariable(req.body.name)) {
		res.send(jsonError);
		return;
	}
	if (!utils.validVariable(req.body.type)) {
		res.send(jsonError);
		return;
	}
	if (!utils.validVariable(req.body.author)) {
		res.send(jsonError);
		return;
	}
	if (!utils.validVariable(req.body.content)) {
		res.send(jsonError);
		return;
	}

	const globalVar = new GlobalVar({
		name: req.body.name,
		type: req.body.type,
		author: req.body.author,
		content: req.body.content
	});

	GlobalVar.findOne({"name": globalVar.name}, async (error, data) => {
		if(error) {
			console.log(error);
		}
		else {
			if (data != null) {
				data.remove();
			}
			try {
				if (req.body.async == "true") {
					const jsonResult = {
						message: `saving ${req.body.type}`,
						id: globalVar._id
					}
					res.json(jsonResult);
					console.log(`saving ${req.body.type}`);
					await globalVar.save();
					console.log(`${req.body.type} saved`);
				}
				else {
					await globalVar.save();
					const jsonResult = {
						id: globalVar._id,
						message: `${req.body.type} saved`
					}
					res.json(jsonResult);
					console.log(jsonResult.message);
				}
			} catch (error) {
				res.json({ message : err });
			}
		}
	});
}

function instantiateAccessController(req, res) {
	let jsonError = {
		"Error": "Invalid JSON"
	}
	if (!utils.validVariable(req.body.id)) {
		res.send(jsonError);
		return;
	}

	GlobalVar.findById({_id: req.body.id}, async (error, data) => {
		if(error) {
			console.log(error);
		}
		else {
			if(data === null) {
				const jsonResult = {
					"message": `Cannot find result id: ${req.body._id}`
				}

				res.send(jsonResult);
			}
			else {
				try{
					console.log(data.content);
					res.send(data.content);

				} catch (err) {
					res.json({ message : err });
				}
			}
		}
	});
}

async function taskCreate (req, res) {
	let jsonError = {
		uri : req.baseUrl + "" + req.url + `/${req.body.taskName}`,
		"Error": "Invalid JSON",
		"status": 400
	}
	
	var jsonResult = {
		uri : req.baseUrl + "" + req.url + `/${req.body.taskName}`
	}

	if (!utils.validVariable(req.body.taskName)) {
		res.send(jsonError);
		return;
	}

	if (!utils.validVariable(req.body.language)) {
		res.send(jsonError);
		return;
	}

	if (!utils.validVariable(req.body.author)) {
		res.send(jsonError);
		return;
	}

	if (!utils.validVariable(req.body.content)) {
		res.send(jsonError);
		return;
	}

	if (!utils.validVariable(req.body.content.code)) {
		res.send(jsonError);
		return;
	}

	if (!utils.validVariable(req.body.content.args)) {
		res.send(jsonError);
		return;
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
			else{
				jsonResult.executions = executions
				jsonResult.status = 200;
				res.send(jsonResult);
			}
		});
	});
}

async function getATask (req, res) {
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

async function getAExecution (req, res) {
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

async function deleteATask(req, res) {
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

async function deleteAExecution(req, res) {
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
					jsonResult.result = `execution ${req.params['executionName']} don't exist`;
					jsonResult.status = 404;
					res.send(jsonResult);
				}
			}
		});
	});
}

module.exports = {
	instantiateStoreController,
	instantiateAccessController,
	taskCreate,
	taskExecute,
	getAllTasks,
	getAllTaskExecutions,
	getATask,
	getAExecution,
	deleteATask,
	deleteAExecution
};
