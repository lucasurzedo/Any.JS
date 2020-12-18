'use strict';

var should = require("should");
var request = require("request");
var chai = require("chai");
var expect = chai.expect;
var urlBase = "http://192.168.2.10:4445/api/execute/access";
var assert = require('assert');

const testFunction = {
	"nickname": "bubbleSort",
	"input": [4, 3, 5, 2, 12, 14, 51, 23, 99, 110, 1, 7, 11, 20],
	"async": "false",
	"storage": "ram"
}

const array = [ 1, 2, 3, 4, 5, 7, 11, 12, 14, 20, 23, 51, 99, 110 ]

describe("Teste API Any.JS",function(){
	it("Deve receber um array ordenado",function(done){
		request.post(urlBase,
		{
			json: testFunction
		},
		function(error, response, body){

		// verifica se o resultado da chamada foi sucesso (200)
		expect(response.statusCode).to.equal(200);

		// verifica se retornou a propriedade Result
		if(body.should.have.property('Result') ){
			//verifica se o resultado da função está correto
			expect(body.Result).to.deep.equal(array);
		}

			done(); // avisamos o test runner que acabamos a validacao e ja pode proseeguir
		}
		);
	});
});