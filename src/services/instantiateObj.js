const { isMainThread, parentPort, workerData } = require('worker_threads');
const Pool = require('worker-threads-pool');
const CPUs = require('os').cpus().length;
const fs = require('fs');
const BSON = require('bson');

const pool = new Pool({ max: CPUs });

async function instantiateJsObject(parameters) {
  const {
    args,
    code,
  } = parameters;

  const Class = require(`../codes/${codeName}`);

  if (args.length > 0) {
    if (args.length === 1) {
      const objArgs = args[0][code];
      return new Class(...objArgs);
    } else {
      const objArgs = [];
      let argAux = [];
      for (let i = 0; i < args.length; i += 1) {
        for (const key in args[i]) {
          if (key === code) {
            objArgs.push(args[i][key]);
          } else {
            argAux = args[i][key];
            const ObjAux = require(`../codes/${key}`);
            const aux = new ObjAux(...argAux);
            objArgs.push(aux);
          }
        }
      }
      return new Class(...objArgs);
    }
  } else {
    return new Class();
  }
}

async function instantiateJavaObject(parameters) {
  const java = require('java');

  java.asyncOptions = {
    asyncSuffix: undefined,
    syncSuffix: "",
    promiseSuffix: "Promise",
    promisify: require('util').promisify
  }

  const path = './src/classes';

  const files = fs.readdirSync(path);
  files.forEach(element => {
    java.classpath.push(`${path}/${element}`)
  });

  const {
    args,
    code,
    mainClassPath,
  } = parameters;

  const Class = java.import(mainClassPath);

  if (args.length > 0) {
    if (args.length === 1) {
      const objArgs = args[0][code];
      return new Class(...objArgs);
    } else {
      const objArgs = [];
      let argAux = [];
      for (let i = 0; i < args.length; i += 1) {
        for (const key in args[i]) {
          if (key === code) {
            objArgs.push(args[i][key]);
          } else {
            argAux = args[i][key];
            const ObjAux = java.import(key);
            const aux = new ObjAux(...argAux);
            objArgs.push(aux);
          }
        }
      }
      return new Class(...objArgs);
    }
  } else {
    return new Class();
  }
}

async function instantiatePythonObject(parameters) {

}

const LANGUAGEMETHOD = {
  javascript: instantiateJsObject,
  java: instantiateJavaObject,
  python: instantiatePythonObject,
}

async function main() {
  if (!isMainThread) {
    try {
      const method = LANGUAGEMETHOD[workerData.language];
      const obj = await method(workerData);
      parentPort.postMessage(BSON.serialize(obj, { serializeFunctions: true }));
    } catch (error) {
      const jsonError = {
        error: error.message,
        result: 'error during execute process',
      };
      parentPort.postMessage(jsonError);
    }
  }
}

function instantiateObj(workerData) {
  return new Promise((resolve, reject) => {
    pool.acquire(__filename, { workerData }, (err, worker) => {
      if (err) reject(err);
      console.log(`started worker (pool size: ${pool.size})`);
      worker.on('message', resolve);
      worker.on('error', reject);
      worker.on('exit', (code) => {
        if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
      });
    });
  });
}

main();

module.exports = instantiateObj;
