const mongoose = require('mongoose');
const fs = require('fs');
const ModelTask = require('../models/task');
const db = require('../db');
const utils = require('../utils/index');
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
  /**
   * TODO
   * CHANGE TO const document = await db.getDocument('registers', 'codeName', codeName);
   */
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

        /**
         * TODO
         * CHANGE TO
         *const findExecutionName = await db.getDocument(collectionName, 'executionName', taskName);
         */
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
              uri: `${req.baseUrl}${req.url}/${req.body.code}/execution/${req.body.taskName}`.toLowerCase(),
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

async function getAllTaskExecutions(req, res) {
  const collectionName = (`${req.params.taskName}_task`).toLowerCase();

  const documents = await db.getAllDocuments(collectionName);

  const executions = [];
  for (const iterator of documents) {
    executions.push(iterator);
  }

  if (executions.length === 0) {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      result: `there is no executions in task ${req.params.taskName}`,
      status: 404,
    };
    res.send(jsonResult);
  } else {
    const jsonResult = {
      uri: `${req.baseUrl}${req.url}`,
      executions,
      status: 200,
    };
    res.send(jsonResult);
  }

  // const jsonResult = {
  //   uri: `${req.baseUrl}${req.url}`,
  // };
  // const collectionName = (`${req.params.taskName}`).toLowerCase();

  // /**
  //  * TODO
  //  * CHANGE TO const documents = await db.getAllDocuments(collectionName);
  //  */
  // mongoose.connection.db.collection(collectionName, (err, collection) => {
  //   if (err) {
  //     console.log(err);
  //     return;
  //   }

  //   collection.find({}).toArray((error, documents) => {
  //     if (error) {
  //       console.log(error);
  //       return;
  //     }

  //     const executions = [];

  //     for (const iterator of documents) {
  //       if (iterator.taskName === undefined) {
  //         executions.push(iterator);
  //       }
  //     }
  //     if (executions.length === 0) {
  //       jsonResult.result = `there is no executions in collection ${req.params.taskName}`;
  //       jsonResult.status = 404;
  //       res.send(jsonResult);
  //     } else {
  //       jsonResult.executions = executions;
  //       jsonResult.status = 200;
  //       res.send(jsonResult);
  //     }
  //   });
  // });
}

async function getExecution(req, res) {
  const collectionName = (`${req.params.taskName}_task`).toLowerCase();
  const jsonResult = {
    uri: `${req.baseUrl}${req.url}`,
    execution: null,
  };

  /**
   * TODO
   * CHANGE TO
   * const data = await db.getDocument(collectionName, 'executionName', req.params.executionName);
   */
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

  /**
   * TODO
   * CHANGE TO MAP DROP
   * const result = await db.dropCollection(collectionName)
   */
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

  /**
   * TODO
   * CHANGE TO MAP DELETE
   *const data = await db.deleteDocument(collectionName, 'executionName', req.params.executionName);
   */
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
  getAllTaskExecutions,
  getExecution,
  deleteTask,
  deleteExecution,
};
