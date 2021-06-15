const { isMainThread, parentPort, workerData } = require('worker_threads');
const Pool = require('worker-threads-pool');
const CPUs = require('os').cpus().length;
const pool = new Pool({ max : CPUs });

const executeFunction = workerData => {
    return new Promise((resolve, reject) => {
        pool.acquire(__filename, { workerData }, (err, worker) =>{
            if (err) reject(err);
            console.log(`started worker (pool size: ${pool.size})`);
            worker.on('message', resolve);
            worker.on('error', reject);
            worker.on('exit', code => {
                if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
            });
        });
    });
};

if(!isMainThread) {
	const Code = require(`../../Results/${workerData.code}`);
	const functionName = workerData.method;

    if (workerData.args.length > 0) {
        const obj = new Code();
        parentPort.postMessage(obj[functionName](...workerData.args));
    }

	const obj = new Code();
	parentPort.postMessage(obj[functionName]);
}

module.exports = executeFunction;