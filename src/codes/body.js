class Body {
  constructor() {
    this._height = 1.91;
    this._age = 33;
  }

  set height(height) {
    this._height = height;
  }

  set age(age) {
    this._age = age;
  }

  get height() {
    return this._height;
  }

  get age() {
    return this._age;
  }
}

module.exports = Body;