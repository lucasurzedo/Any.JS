const { isMainThread, parentPort, workerData } = require('worker_threads');
const Pool = require('worker-threads-pool');
const CPUs = require('os').cpus().length;

const pool = new Pool({ max: CPUs });

// eslint-disable-next-line no-shadow
const executeFunction = (workerData) => new Promise((resolve, reject) => {
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

if (!isMainThread) {
  try {
    const codeName = `${workerData.code}`;

    const Code = require(`../codes/${codeName}`);
    const functionName = workerData.method;

    if (workerData.args.length > 0) {
      if (workerData.args.length === 1) {
        const args = workerData.args[0][workerData.code];
        const obj = new Code(...args);

        if (workerData.methodArgs.length > 0) {
          const methodArgs = workerData.methodArgs;
          parentPort.postMessage(obj[functionName](...methodArgs));
        } else {
          parentPort.postMessage(obj[functionName]);
        }
      } else {
        // Percorre os args, require usando key
        // Push no array de args
        // Instancia o objeto final usando o array de args
        const args = [];
        let argAux = [];
        for (let i = 0; i < workerData.args.length; i += 1) {
          for (const key in workerData.args[i]) {
            if (key === workerData.code) {
              args.push(workerData.args[i][key]);
            } else {
              argAux = workerData.args[i][key];
              const ObjAux = require(`../codes/${key}`);
              const aux = new ObjAux(...argAux);
              args.push(aux);
            }
          }
        }
        const obj = new Code(...args);

        if (workerData.methodArgs.length > 0) {
          const methodArgs = workerData.methodArgs;
          parentPort.postMessage(obj[functionName](...methodArgs));
        } else {
          parentPort.postMessage(obj[functionName]);
        }
      }
    } else {
      const obj = new Code();

      if (workerData.methodArgs.length > 0) {
        const args = workerData.methodArgs;
        parentPort.postMessage(obj[functionName](...args));
      } else {
        parentPort.postMessage(obj[functionName]);
      }
    }
  } catch (error) {
    parentPort.postMessage('error during execute process');
  }
}

module.exports = executeFunction;
