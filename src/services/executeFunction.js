/* eslint-disable no-await-in-loop */
/* eslint-disable no-return-await */
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

  const Class = require(`../codesJs/${code}/${code}`);

  if (args.length > 0) {
    if (args.length === 1) {
      const objArgs = args[0][code];
      const obj = new Class(...objArgs);

      if (methodArgs.length > 0) {
        return await obj[method](...methodArgs);
      }
      return await obj[method];
    }
    const objArgs = [];
    for (let i = 0; i < args.length; i += 1) {
      for (const key in args[i]) {
        if (key === code) {
          objArgs.push(...args[i][key]);
        } else {
          const ObjAux = require(`../codesJs/${code}/${key}`);
          objArgs.push(new ObjAux(...args[i][key]));
        }
      }
    }
    const obj = new Class(...objArgs);

    if (methodArgs.length > 0) {
      return await obj[method](...methodArgs);
    }
    return await obj[method];
  }
  const obj = new Class();

  if (methodArgs.length > 0) {
    return await obj[method](...methodArgs);
  }
  return await obj[method];
}

async function executeJavaMethod(parameters) {
  const {
    args,
    code,
    mainClassPath,
    method,
    methodArgs,
  } = parameters;

  const java = require('java');

  java.asyncOptions = {
    asyncSuffix: undefined,
    syncSuffix: '',
    promiseSuffix: 'Promise',
    promisify: require('util').promisify,
  };

  const path = `./src/codesJava/${code}`;

  const files = fs.readdirSync(path);
  files.forEach((element) => {
    java.classpath.push(`${path}/${element}`);
  });

  const Class = java.import(mainClassPath);

  if (args.length > 0) {
    if (args.length === 1) {
      const objArgs = args[0][code];
      const obj = new Class(...objArgs);

      if (methodArgs.length > 0) {
        return await obj[method](...methodArgs);
      }
      return await obj[method];
    }
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
    }
    return await obj[method]();
  }
  const obj = new Class();

  if (methodArgs.length > 0) {
    return await obj[method](...methodArgs);
  }
  return await obj[method]();
}

async function executePythonMethod(parameters) {
  const { python } = require('pythonia');

  const {
    args,
    code,
    method,
    methodArgs,
  } = parameters;

  const sysPy = await python('sys');
  await sysPy.path.append(`./src/codesPy/${code}`);

  const Class = await python(code);

  const objArgs = [];
  let mainClass;
  for (let i = 0; i < args.length; i += 1) {
    for (const key in args[i]) {
      if (i === 0) {
        mainClass = key;
        objArgs.push(...args[i][key]);
      } else {
        objArgs.push(await Class[key](...args[i][key]));
      }
    }
  }

  const obj = await Class[mainClass](...objArgs);

  const result = obj[method](...methodArgs);
  python.exit();
  return result;
}

const LANGUAGEMETHOD = {
  javascript: executeJsMethod,
  java: executeJavaMethod,
  python: executePythonMethod,
};

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

// eslint-disable-next-line no-shadow
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
