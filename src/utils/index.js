'use strict';

function executeFunction(parameterValue, dataJson) {
	let tempFunc;

	if (dataJson.content.args == 'none')
		tempFunc = new Function(dataJson.content.code);
	else
		tempFunc = new Function(dataJson.content.args, dataJson.content.code);

	if (parameterValue != 'none') {
		const input = parameterValue;
		const result = tempFunc(input);
		
		let jsonResult = {
			"Result": result
		}
		return jsonResult;
	}
	else {
		const result = tempFunc();

		let jsonResult = {
			"Result": result
		}
		return jsonResult;
	}
}

function validVariable(input) {
	return (typeof input !== 'undefined') && input;
}

module.exports = {
	executeFunction,
	validVariable
  };
  