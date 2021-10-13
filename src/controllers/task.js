const mongoose = require('mongoose');
const fs = require('fs');
const utils = require('../utils/index');
const ModelTask = require('../models/task');
const executeFunction = require('../services/executeFunction');

async function createTask(req, res) {
  const jsonError = {
    uri: `${req.baseUrl}${req.url}/${req.body.taskName}`,
    Error: 'Invalid JSON',
    status: 400,
  };

  if (!req.body.taskName || !req.body.code || !req.body.args
      || !req.body.method) {
    res.send(jsonError);
    return;
  }

  let codeName = `${req.body.code}`;
  codeName = codeName.toLowerCase();
  req.body.code = codeName;

  // Open collection registers on db
  mongoose.connection.db.collection('registers', (error, collection) => {
    if (error) {
      console.log(error);
      return;
    }

    // Try to find a code in collection registers
    collection.findOne({ codeName }, async (err, data) => {
      if (err) {
        console.log(err);
      }

      // Verify if the code exists
      if (!data) {
        const jsonErr = {
          uri: `${req.baseUrl}${req.url}`,
          result: `cannot find code ${codeName}`,
          status: 406,
        };
        res.send(jsonErr);
      } else {
        const codes = [];
        const methodsLinks = [];
        // Get all the codes names and links
        for (const iterator of data.code) {
          codes.push(iterator);
        }

        // Separate names and links in a object
        for (let i = 0; i < codes.length; i += 1) {
          for (const key in codes[i]) {
            methodsLinks.push({ name: key, link: codes[i][key] });
          }
        }

        // Verify if the file already exists
        for (let i = 0; i < methodsLinks.length; i += 1) {
          const path = `./src/codes/${methodsLinks[i].name}.js`;

          if (fs.existsSync(path)) {
            methodsLinks.splice(i, 1);
            i -= 1;
          }
        }

        const collectionName = `${req.body.code}_task`;

        const taskCollection = mongoose.connection.db.collection(collectionName);
        // eslint-disable-next-line prefer-destructuring
        const taskName = req.body.taskName;
        const findExecutionName = await taskCollection.findOne({ executionName: taskName });

        if (findExecutionName != null) {
          const jsonResult = {
            uri: `${req.baseUrl}${req.url}/${req.body.taskName}`,
            result: `Execution ${req.body.taskName} already exist`,
            status: 409,
          };
          res.send(jsonResult);
        } else {
          const Task = mongoose.model(collectionName, ModelTask, collectionName);

          const newTask = new Task({
            executionName: req.body.taskName,
            parameterValue: req.body.args,
            method: req.body.method,
            taskResult: null,
          });

          await newTask.save();

          // If the file don't exists then its downloaded and executed
          // If the file exists then its executed
          if (methodsLinks.length > 0) {
            console.log('Downloading codes');
            const code = await utils.downloadCode(methodsLinks);
            if (code) {
              const jsonResult = {
                uri: `${req.baseUrl}${req.url}/${req.body.taskName}`,
                result: 'saving execution',
                status: 201,
              };
              res.send(jsonResult);

              executeFunction(req.body).then((result) => {
                console.log(result);
                if (result === 'error during execute process') {
                  newTask.taskResult = result;
                  newTask.save();
                } else {
                  newTask.taskResult = result;
                  newTask.save();
                }
              });
            }
          } else {
            const jsonResult = {
              uri: `${req.baseUrl}${req.url}/${req.body.taskName}`,
              result: 'saving execution',
              status: 201,
            };
            res.send(jsonResult);

            executeFunction(req.body).then((result) => {
              console.log(result);
              if (result === 'error during execute process') {
                newTask.taskResult = result;
                newTask.save();
              } else {
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

async function taskExecute(req, res) {
  const jsonError = {
    uri: `${req.baseUrl}${req.url}`,
    Error: 'Invalid JSON',
    status: 400,
  };

  const jsonResult = {
    uri: `${req.baseUrl}${req.url}`,
  };

  const taskName = `${req.params.taskName}`;

  if (!utils.validVariable(req.body.executions)) {
    if (!utils.validVariable(req.body.executionName)) {
      res.send(jsonError);
      return;
    }

    if (!utils.validVariable(req.body.parameterValue)) {
      res.send(jsonError);
      return;
    }

    jsonResult.uri = `${req.baseUrl}${req.url}/${req.body.executionName}`;
    utils.createExecution(req.body, res, jsonResult, taskName);
  } else {
    const executions = [];
    for (const iterator of req.body.executions) {
      executions.push(iterator);
    }

    for (let i = 0; i < executions.length; i += 1) {
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

async function getAllTasks(req, res) {
  const jsonResult = {
    uri: `${req.baseUrl}${req.url}`,
    tasks: null,
  };

  if (mongoose.connection.db === undefined) {
    jsonResult.tasks = 'there is no tasks in the db';
    jsonResult.status = 404;
    res.send(jsonResult);
  }

  // TODO
}

async function getAllTaskExecutions(req, res) {
  const jsonResult = {
    uri: `${req.baseUrl}${req.url}`,
  };
  const collectionName = (`${req.params.taskName}`).toLowerCase();

  mongoose.connection.db.collection(collectionName, (err, collection) => {
    if (err) {
      console.log(err);
      return;
    }

    collection.find({}).toArray((error, documents) => {
      if (error) {
        console.log(error);
        return;
      }

      const executions = [];

      for (const iterator of documents) {
        if (iterator.taskName === undefined) {
          executions.push(iterator);
        }
      }
      if (executions.length === 0) {
        jsonResult.result = `there is no executions in collection ${req.params.taskName}`;
        jsonResult.status = 404;
        res.send(jsonResult);
      } else {
        jsonResult.executions = executions;
        jsonResult.status = 200;
        res.send(jsonResult);
      }
    });
  });
}

async function getTask(req, res) {
  const jsonResult = {
    uri: `${req.baseUrl}${req.url}`,
    task: null,
  };
  const collectionName = (`${req.params.taskName}`).toLowerCase();

  mongoose.connection.db.collection(collectionName, (err, collection) => {
    if (err) {
      console.log(err);
      return;
    }

    collection.find({}).toArray((error, documents) => {
      if (error) {
        console.log(error);
        return;
      }

      for (const iterator of documents) {
        if (iterator.taskName !== undefined) {
          jsonResult.task = iterator;
        }
      }
      if (jsonResult.task === null) {
        delete jsonResult.task;
        jsonResult.result = `there is no task ${req.params.taskName}`;
        jsonResult.status = 404;
        res.send(jsonResult);
      } else {
        jsonResult.status = 200;
        res.send(jsonResult);
      }
    });
  });
}

async function getExecution(req, res) {
  const collectionName = (`${req.params.taskName}_task`).toLowerCase();
  const jsonResult = {
    uri: `${req.baseUrl}${req.url}`,
    execution: null,
  };

  console.log(collectionName);

  mongoose.connection.db.collection(collectionName, (err, collection) => {
    if (err) {
      console.log(err);
      return;
    }

    collection.find({}).toArray((error, documents) => {
      if (error) {
        console.log(error);
        return;
      }

      for (const iterator of documents) {
        if (iterator.executionName === req.params.executionName) {
          jsonResult.execution = iterator;
        }
      }
      if (jsonResult.execution === null) {
        delete jsonResult.execution;
        jsonResult.result = `there is no execution ${req.params.executionName}`;
        jsonResult.status = 404;
        res.send(jsonResult);
      } else {
        jsonResult.status = 200;
        res.send(jsonResult);
      }
    });
  });
}

async function deleteTask(req, res) {
  const jsonResult = {
    uri: `${req.baseUrl}${req.url}`,
  };
  const collectionName = (`${req.params.taskName}`).toLowerCase();

  mongoose.connection.db.collection(collectionName, (err, collection) => {
    if (err) {
      console.log(err);
      return;
    }

    collection.drop();
    jsonResult.result = `task ${req.params.taskName} deleted`;
    jsonResult.status = 200;
    res.send(jsonResult);
  });
}

async function deleteExecution(req, res) {
  const jsonResult = {
    uri: `${req.baseUrl}${req.url}`,
  };
  const collectionName = (`${req.params.taskName}`).toLowerCase();

  mongoose.connection.db.collection(collectionName, (err, collection) => {
    if (err) {
      console.log(err);
      return;
    }

    collection.deleteOne({ executionName: req.params.executionName }, (error, result) => {
      if (error) {
        console.log(error);
      } else if (result.deletedCount > 0) {
        jsonResult.result = `execution ${req.params.executionName} deleted`;
        jsonResult.status = 200;
        res.send(jsonResult);
      } else {
        jsonResult.result = `execution ${req.params.executionName} do not exist`;
        jsonResult.status = 404;
        res.send(jsonResult);
      }
    });
  });
}

module.exports = {
  createTask,
  taskExecute,
  getAllTasks,
  getAllTaskExecutions,
  getTask,
  getExecution,
  deleteTask,
  deleteExecution,
};
