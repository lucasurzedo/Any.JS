const { isMainThread, parentPort, workerData } = require('worker_threads');
const Pool = require('worker-threads-pool');
const CPUs = require('os').cpus().length;

const pool = new Pool({ max: CPUs });

function executeJsMethod(parameters) {
  const {
    args,
    code,
    method,
    methodArgs,
  } = parameters;

  const Class = require(`../codes/${code}`);

  if (args.length > 0) {
    if (args.length === 1) {
      const objArgs = args[0][code];
      const obj = new Class(...objArgs);

      if (methodArgs.length > 0) {
        parentPort.postMessage(obj[method](...methodArgs));
      } else {
        parentPort.postMessage(obj[method]);
      }
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
            objArgs.push(new ObjAux(...argAux));
          }
        }
      }
      const obj = new Class(...objArgs);

      if (methodArgs.length > 0) {
        return obj[method](...methodArgs);
      } else {
        return obj[method];
      }
    }
  } else {
    const obj = new Class();

    if (methodArgs.length > 0) {
      return obj[method](...methodArgs);
    } else {
      return obj[method];
    }
  }
}

function executeJavaMethod(parameters) {
  const java = require('java');

  java.asyncOptions = {
    asyncSuffix: undefined,
    syncSuffix: "",
    promiseSuffix: "Promise",
    promisify: require('util').promisify
  }

  const {
    args,
    code,
    method,
    methodArgs,
  } = parameters;

  java.classpath.push("./src/classes");

  const Class = java.import(`${code}`);

  if (args.length > 0) {
    if (args.length === 1) {
      const objArgs = args[0][code];
      const obj = new Class(...objArgs);

      if (methodArgs.length > 0) {
        parentPort.postMessage(obj[method](...methodArgs));
      } else {
        parentPort.postMessage(obj[method]);
      }
    } else {
      const objArgs = [];
      let argAux = [];
      for (let i = 0; i < args.length; i += 1) {
        for (const key in args[i]) {
          if (key === code) {
            objArgs.push(args[i][key]);
          } else {
            argAux = args[i][key];
            const ObjAux = java.import(`${key}`);
            objArgs.push(new ObjAux(...argAux));
          }
        }
      }
      const obj = new Class(...objArgs);

      if (methodArgs.length > 0) {
        return obj[method](...methodArgs);
      } else {
        return obj[method];
      }
    }
  } else {
    const obj = new Class();

    if (methodArgs.length > 0) {
      return obj[method](...methodArgs);
    } else {
      return obj[method];
    }
  }
}

function executePythonMethod(parameters) {

}

const LANGUAGEMETHOD = {
  javascript: executeJsMethod,
  java: executeJavaMethod,
  python: executePythonMethod,
}

function executeFunction(workerData) {
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

if (!isMainThread) {
  try {
    const method = LANGUAGEMETHOD[workerData.language];
    parentPort.postMessage(method(workerData));
  } catch (error) {
    const jsonError = {
      error: error.message,
      result: 'error during execute process',
    };
    parentPort.postMessage(jsonError);
  }
}

module.exports = executeFunction;
