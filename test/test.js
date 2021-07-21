const BSON = require('bson');
const Measures = require('../src/codes/measures');
const request = require('request');
let code = new Measures(14, 15);

let Car = function Carro(marca, modelo, ano) {
	this.marca = marca;
	this.modelo = modelo;
	this.ano = ano;
}

let carro = new Car('BMW', 'M4', '2015');

console.log(carro);

let bytes = BSON.serialize(carro, {serializeFunctions: true});

let jsonReq = {
	objectName: "car02",
	code: "Car",
	object: bytes
}

request.post('http://192.168.2.10:4446/api/anyJS/v1/store/object', {
	json: jsonReq
}, async (error, res, body) => {
	if (error) {
		console.error(error);
		return;
	}
	console.log(body);
});

request.get('http://192.168.2.10:4446/api/anyJS/v1/store/object/car/car02', {
}, async (error, res, body) => {
	if (error) {
		console.error(error);
		return;
	}
	console.log(body);
	let json = JSON.parse(body);
	console.log(json.object);

	let buffer = Buffer.from(json.object.object);
	console.log(buffer);
	let obj = BSON.deserialize(buffer, {evalFunctions: true});
	console.log(obj);
});