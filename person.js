class Person {
    constructor() {
      this._name = 'bob';
    }
  
    set name(name) {
      this._name = name
    }
  
    get name() {
      return this._name;
    }  
}

module.exports = Person;