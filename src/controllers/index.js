'use strict';

const udp = require('dgram');
const server = udp.createSocket('udp4');
const ip = require('ip');
const utils = require('../utils');
const Task = require('../models/Task');
const GlobalVar = require('../models/GlobalVar');

function discoverController() {
  	server.on('error', function (error) {
		console.log('Error: ' + error);
		server.close();
  	});

  	server.on("message", function (message, remote) {
		var output = "UDP server receive message : " + message + "\n";
		process.stdout.write(output);

		var msgResponse = ip.address();

		server.send(msgResponse, 0, msgResponse.length, remote.port, remote.address, function (err, bytes) {
			if (err) throw err;
			console.log('UDP server message sent to ' + remote.address + ':' + remote.port);
		});
  	});

	server.on('listening', function () {
		var address = server.address();
		var port = address.port;
		var family = address.family;
		var ipaddr = ip.address();
		console.log('Server is listening at port : ' + port);
		console.log('Server ip : ' + ipaddr);
		console.log('Server is IP4/IP6 : ' + family);
	});

  	server.bind(3003);
}

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

async function taskStoreController(req, res) {
	let jsonError = {
		"Error": "Invalid JSON"
	}

	if (!utils.validVariable(req.body.name)) {
		res.send(jsonError);
		return;
	}

	if (!utils.validVariable(req.body.parameter)) {
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

	const task = new Task({
		taskName: req.body.name,
		parameterName: req.body.parameter,
		language: req.body.language,
		author: req.body.author,
		content: req.body.content
	});

	Task.findOne({"taskName": task.taskName}, async (error, data) => {
		if(error) {
			console.log(error);
		}
		else {
			if (data != null) {
				const jsonResult = {
					"Result": "File already exists"
				}

				res.send(jsonResult);
			}
			else {
				try {
					if (req.body.async == "true") {
						res.json({ message: "saving task"});
						console.log("saving task");
						await task.save();
						console.log("task saved");
					}
					else {
						await task.save();
						console.log('Task saved');
						res.json({ message: "task saved" });

					}

				} catch (err) {
					res.json({ message : err });
				}
			}
		}
	});
}

async function taskAccessController(req, res) {
	let jsonError = {
		"Error": "Invalid JSON"
	}
	if (!utils.validVariable(req.body.taskName)) {
		res.send(jsonError);
		return;
	}
	if (!utils.validVariable(req.body.parameterValue)) {
		res.send(jsonError);
		return;
	}
	if (!utils.validVariable(req.body.async)) {
		res.send(jsonError);
		return;
	}

	const parameterValueResult = JSON.parse(JSON.stringify(req.body.parameterValue));
	Task.findOne({"taskName": req.body.taskName}, async (error, data) => {
		if(error) {
			console.log(error);
		}
		else {
			if(data === null) {
				const jsonResult = {
					"Result": `Cannot find ${req.body.taskName} task`
				}

				res.send(jsonResult);
			}
			else {
				try{					
					const task = new Task({
						parameterValue: parameterValueResult,
						taskResult: null
					});

					if (req.body.async == "true") {
						res.json( { id : task._id });

						const taskResult = await utils.executeFunction(req.body.parameterValue, data);

						task.taskResult = taskResult;

						task.save();
					}
					else {
						const taskResult = await utils.executeFunction(req.body.parameterValue, data);
	
						task.taskResult = taskResult;
	
						await task.save();

						const jsonResult = {
							id: task._id,
							result: task.taskResult.Result
						}
	
						res.json(jsonResult);
					}
				} catch (err) {
					res.json({ message : err });
				}
			}
		}
	});
}

function getResultController(req, res) {	
	let jsonError = {
		"Error": "Invalid JSON"
	}
	if (!utils.validVariable(req.body.id)) {
		res.send(jsonError);
		return;
	}

	Task.findById({_id: req.body.id}, async (error, data) => {
		if(error) {
			console.log(error);
		}
		else {
			if(data === null) {
				const jsonResult = {
					"result": `Cannot find result id: ${req.body._id}`
				}

				res.send(jsonResult);
			}
			else {
				try{
					console.log(data.taskResult);
					res.send(data.taskResult);

				} catch (err) {
					res.json({ message : err });
				}
			}
		}
	});
}

module.exports = {
	discoverController,
	instantiateStoreController,
	instantiateAccessController,
	taskStoreController,
	taskAccessController,
	getResultController,
};
