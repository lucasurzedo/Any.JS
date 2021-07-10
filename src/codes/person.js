const Body = require('./Body');
const Measures = require('./Measures');

class Person {
  constructor(name) {
    this._name = name;
    this._body = new Body();
   // this._measures = new Measures(measures.height, measures.age);
  }

  set name(name) {
    this._name = name;
  }

  set body(body) {
    this._body = body;
  }

  get name() {
    return this._name;
  }

  get body() {
    return this._body;
  }

  get height(){
    return this._body.height;
  }

  get age(){
    return this._body.age;
  }
}

module.exports = Person;