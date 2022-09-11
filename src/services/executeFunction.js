const { isMainThread, parentPort, workerData } = require('worker_threads');
const Pool = require('worker-threads-pool');
const CPUs = require('os').cpus().length;
const fs = require('fs');

const pool = new Pool({ max: CPUs });

async function executeJsMethod(parameters) {
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
        return await obj[method](...methodArgs);
      } else {
        return await obj[method]();
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
        return await obj[method](...methodArgs);
      } else {
        return await obj[method]();
      }
    }
  } else {
    const obj = new Class();

    if (methodArgs.length > 0) {
      return await obj[method](...methodArgs);
    } else {
      return await obj[method]();
    }
  }
}

async function executeJavaMethod(parameters) {
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
    method,
    methodArgs,
  } = parameters;

  const Class = java.import(mainClassPath);

  if (args.length > 0) {
    if (args.length === 1) {
      const objArgs = args[0][code];
      const obj = new Class(...objArgs);

      if (methodArgs.length > 0) {
        return await obj[method](...methodArgs);
      } else {
        return await obj[method];
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
        return await obj[method](...methodArgs);
      } else {
        return await obj[method]();
      }
    }
  } else {
    const obj = new Class();

    if (methodArgs.length > 0) {
      return await obj[method](...methodArgs);
    } else {
      return await obj[method]();
    }
  }
}

async function executePythonMethod(parameters) {

}

const LANGUAGEMETHOD = {
  javascript: executeJsMethod,
  java: executeJavaMethod,
  python: executePythonMethod,
}

async function main() {
  if (!isMainThread) {
    try {
      const method = LANGUAGEMETHOD[workerData.language];

      parentPort.postMessage(await method(workerData));
    } catch (error) {
      const jsonError = {
        error: error.message,
        result: 'error during execute process',
      };
      parentPort.postMessage(jsonError);
    }
  }
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

main();

module.exports = executeFunction;
