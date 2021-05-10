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
	let tempFunc;

	if (workerData.jsonData.content.args == null)
		tempFunc = new Function(workerData.jsonData.content.code);
	else
		tempFunc = new Function(workerData.jsonData.content.args, workerData.jsonData.content.code);

	if (workerData.parameterValue != null) {
		var input = workerData.parameterValue;

		// var json = JSON.stringify(input);

		// var obj = JSON.parse(json, function (key, value) {
		// 	if (typeof value === "string" &&
		// 		value.startsWith("/Function(") &&
		// 		value.endsWith(")/")) {
		// 		value = value.substring(10, value.length - 2);
		// 		return (0, eval)("(" + value + ")");
		// 	}
		// 	return value;
		// });

		// input = obj;

		const result = tempFunc(input);

		let jsonResult = {
			"Result": result
		}

		parentPort.postMessage(jsonResult);
	}
	else {
		const result = tempFunc();

		let jsonResult = {
			"Result": result
		}
		
		parentPort.postMessage(jsonResult);
	}
}

module.exports = executeFunction;