const mongoose = require('mongoose');
const pluralize = require('pluralize');
const Downloader = require('nodejs-file-downloader');
const ModelTask = require('../models/task');
const executeFunction = require('../services/executeFunction');

function createExecution(execution, res, jsonResult, taskName, multipleExecutions) {
  const collectionName = taskName.toLowerCase();
  const parameterValueResult = JSON.parse(JSON.stringify(execution.parameterValue));

  mongoose.connection.db.collection(pluralize(collectionName), (err, collection) => {
    if (err) {
      console.log(err);
    }

    // eslint-disable-next-line consistent-return
    collection.findOne({ taskName }, async (error, data) => {
      if (error) {
        console.log(error);
      } else if (data === null) {
        try {
          jsonResult.result = `Cannot find ${collectionName} task`;
          jsonResult.status = 404;
          return res.send(jsonResult);
        } catch (erro) {
          console.log(erro);
        }
      } else {
        const execName = execution.executionName;
        const findExecutionName = await collection.findOne({ executionName: execName });
        if (findExecutionName != null) {
          try {
            jsonResult.result = `Execution ${execution.executionName} already exist`;
            jsonResult.status = 409;
            return res.send(jsonResult);
          } catch (erro) {
            console.log(erro);
          }
        } else {
          try {
            const Task = mongoose.model(taskName, ModelTask);
            const newTask = new Task({
              executionName: execution.executionName,
              parameterValue: parameterValueResult,
              taskResult: null,
            });
            try {
              await newTask.save();
              jsonResult.result = 'saving execution';
              jsonResult.status = 201;

              if (!multipleExecutions) {
                res.send(jsonResult);
              }

              const params = execution.parameterValue;
              executeFunction({ parameterValue: params, jsonData: data }).then((result) => {
                newTask.taskResult = result;
                newTask.save();
              });
            } catch (erro) {
              // Retornar um json de erro
              console.log('Header sent to the client');
            }
          } catch (erro) {
            try {
              jsonResult.error = 'server error';
              jsonResult.status = 404;
              return res.send(jsonResult);
            } catch (serverErr) {
              console.log(serverErr);
            }
          }
        }
      }
    });
  });
}

async function downloadCode(methodsLinks) {
  console.log(methodsLinks);
  for (let i = 0; i < methodsLinks.length; i += 1) {
    const fileName = `${methodsLinks[i].name}.js`;
    const linkMethod = methodsLinks[i].link;

    const downloader = new Downloader({
      url: linkMethod,
      directory: './src/codes',
      fileName,
    });
    try {
      // eslint-disable-next-line no-await-in-loop
      await downloader.download();
      console.log('Download Finished');
    } catch (error) {
      console.log(error);
      return false;
    }
  }
  return true;
}

function validVariable(input) {
  return (typeof input !== 'undefined') && input;
}

module.exports = {
  createExecution,
  downloadCode,
  validVariable,
};
