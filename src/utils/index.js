'use strict';

const mongoose = require('mongoose');
const ModelTask = require('../models/modelTask');
const pluralize = require('pluralize');
const executeFunction = require('../services/executeFunction');

function createExecution (execution, res, jsonResult, taskName, multipleExecutions) {
	const collectionName = taskName.toLowerCase();
	const parameterValueResult = JSON.parse(JSON.stringify(execution.parameterValue));

	mongoose.connection.db.collection(pluralize(collectionName), (err, collection) => {
		if (err) {
			console.log(err);
		}
		
		collection.findOne({"taskName": taskName}, async (error, data) => {
			if(error) {
				console.log(error);
			}
			else {
				if (data === null) {
					try {
						jsonResult.result = `Cannot find ${collectionName} task`;
						jsonResult.status = 404;
						return res.send(jsonResult);
					} catch (error) {
						return;
					}
				}
				else {
					const findExecutionName = await collection.findOne({"executionName": execution.executionName});
					if (findExecutionName != null) {
						try {
							jsonResult.result = `Execution ${execution.executionName} already exist`;
							jsonResult.status = 409;
							return res.send(jsonResult);
						} catch (error) {
							return;
						}
					}
					else {
						try {
							const Task = mongoose.model(taskName, ModelTask);
							const newTask = new Task({
								executionName: execution.executionName,
								parameterValue: parameterValueResult,
								taskResult: null
							});
							try {
								newTask.save();
								jsonResult.result = "saving execution";
								jsonResult.status = 201;
								if (!multipleExecutions) {
									res.send(jsonResult);
								}
							} catch (error) {
								console.log('Header sent to the client');
							}

							executeFunction({ parameterValue: execution.parameterValue, jsonData : data }).then(result => {
								newTask.taskResult = result;
								newTask.save();
							});
						} catch (erro) {
							try {
								jsonResult.error = "server error";
								jsonResult.status = 404;
								return res.send(jsonResult);
							} catch (error) {
								return;
							}
						}
					}
				}
			}
		});
	});
}

function validVariable(input) {
	return (typeof input !== 'undefined') && input;
}

module.exports = {
	createExecution,
	validVariable
  };
  