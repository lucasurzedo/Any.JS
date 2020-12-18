const { Worker, isMainThread, parentPort, workerData} = require('worker_threads');

const execute = workerData => {
    return new Promise((resolve, reject) => {
        const worker = new Worker(__filename, { workerData });
        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', code => {
            if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`))
        });
    });
};

if(!isMainThread){
    let tempFunc;

	if (workerData.dataJson.content.args == 'none')
		tempFunc = new Function(workerData.dataJson.content.code);
	else
		tempFunc = new Function(workerData.dataJson.content.args, workerData.dataJson.content.code);

	if (workerData.jsonObject.input != 'none') {
		const input = workerData.jsonObject.input;

		const result = tempFunc(input);

		let jsonResult = {
			"Result": result
		}

		if (workerData.jsonObject.storage == 'disk') {
			const pathRes = `./Results/${workerData.reqTicket}.json`;

			fs.writeFile(pathRes, JSON.stringify(jsonResult), (error) => {
			  if (error) {
				console.log(error);
			  }
			  else {
				console.log('Result saved!\n');
			  }
			});
		}
		else if (workerData.jsonObject.storage == 'ram') {
		    workerData.results.set(workerData.reqTicket, jsonResult);
			console.log('Result saved!\n');
		  }
	}
	else {
		const result = tempFunc();

		let jsonResult = {
			"Result": result
		}

		if (workerData.jsonObject.storage == 'disk') {
			fs.writeFile(pathRes, JSON.stringify(jsonResult), (error) => {
				if (error) {
					console.log(error);
				} else {
					console.log('Result saved!\n');
				}
			});
		  }
		else if (workerData.jsonObject.storage == 'ram') {
			results.set(workerData.reqTicket, jsonResult);
			console.log('Result saved!\n');
		}
	}

    parentPort.postMessage(workerData.results);
}

module.exports = execute;