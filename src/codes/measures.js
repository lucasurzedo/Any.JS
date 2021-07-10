class Measures {
	constructor(height, age) {
		this._height = height;
		this._age = age;
	}

	set height(height) {
		this._height = height;
	}

	set age(age) {
		this._height = age;
	}

	get height(){
		return this._height;
	}

	get age(){
		return this._age;
	}
}

module.exports = Measures;