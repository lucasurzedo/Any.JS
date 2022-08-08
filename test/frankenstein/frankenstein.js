import AnyJSClient from '../client/AnyJSClient.js';

const host = 'http://34.148.224.114'
const anyJSClient = new AnyJSClient(host);

class Register {
  constructor() { }

  async registerCode() {
    const codeName = 'factorial';
    const code = [];
    code.push({ factorial: 'https://pastebin.com/raw/2YNiBLVv' });

    await anyJSClient.registerCode(codeName, code);
  }

  async getCode() {
    const codeName = 'person';
    const code = await anyJSClient.getCode(codeName);
    console.log(code);
  }

  async deleteCode() {
    const codeName = 'person';
    const result = await anyJSClient.deleteCode(codeName);
    console.log(result);
  }
}

class Execute {
  constructor() { }

  async executeCode() {
    const codeName = 'factorial';
    const code = [];
    code.push({ factorial: 'https://pastebin.com/raw/2YNiBLVv' });
    await anyJSClient.registerCode(codeName, code);

    const executionName = 'execution1';
    const method = 'factorial';
    const constructorArgs = []
    constructorArgs.push({ factorial: [] });
    const methodArgs = [20]

    const result = await anyJSClient.executeCode(codeName, executionName,
      constructorArgs, method, methodArgs);
    console.log(result);
  }

  async getExecution() {
    const code = 'factorial';
    const executionName = 'execution1';
    const result = await anyJSClient.getExecution(code, executionName);
    console.log(result);
  }

  async deleteExecution() {
    const code = 'factorial';
    const executionName = 'execution1';
    const result = await anyJSClient.deleteExecution(code, executionName);
    console.log(result);
  }
}

class Store {
  constructor() { }

  async storeObject() {
    const person1 = new PersonExperiment('John', 'Doe', 1000);
    const codeName = 'personExperiment';
    const objectName = 'personExperiment1';

    const result = await anyJSClient.storeObject(person1, codeName, objectName);
    console.log(result);
  }

  async getObject() {
    const codeName = 'personExperiment';
    const objectName = 'personExperiment1';

    const person = await anyJSClient.getObject(codeName, objectName);
    console.log(person);
  }

  async deleteObject() {
    const codeName = 'personExperiment';
    const objectName = 'personExperiment1';

    const result = await anyJSClient.deleteObject(codeName, objectName);
    console.log(result);
  }
}

class Instantiate {
  constructor() { }

  async instantiateObject() {
    const codeName = 'personExperiment';
    const code = [];
    code.push({ personExperiment: 'https://pastebin.com/raw/NYjjcUyF' });

    await anyJSClient.registerCode(codeName, code);

    const objectName = 'person1';
    const args = []
    args.push({ personExperiment: ['John', 'Doe', 1000] });

    const person = await anyJSClient.instantiateObject(codeName, objectName, args);
    console.log(person);
  }

  async getInstantiatedObject() {
    const codeName = 'personObject';
    const objectName = 'person1';

    const result = await anyJSClient.getInstantiatedObject(codeName, objectName);
    console.log(result);
  }

  async deleteInstantiatedObject() {
    const codeName = 'personObject';
    const objectName = 'person1';

    const result = await anyJSClient.deleteInstantiatedObject(codeName, objectName);
    console.log(result);
  }
}

class Map {
  constructor() { }

  async createMap() {
    const mapName = 'myMap'

    const result = await anyJSClient.createMap(mapName);
    console.log(result);
  }

  async setElements() {
    const mapName = 'myMap'
    const elements = [];
    elements.push({ key: 'key1', value: 1 });
    elements.push({ key: 'key2', value: 2 });
    elements.push({ key: 'key3', value: 3 });

    const result = await anyJSClient.setMapElements(mapName, elements);
    console.log(result);
  }

  async setEntry() {
    const mapName = 'myMap'
    const key = 'key4'
    const value = 4

    const result = await anyJSClient.setMapEntry(mapName, key, value);
    console.log(result);
  }

  async updateMapElement() {
    const mapName = 'myMap'
    const key = 'key1'
    const value = '50'

    const result = await anyJSClient.updateMapElement(mapName, key, value);
    console.log(result);
  }

  async mapForEach() {
    const codeName = 'sum';
    const code = [];
    code.push({ sum: 'https://pastebin.com/raw/iGgKcwPG' });

    await anyJSClient.registerCode(codeName, code);

    const mapName = 'myMap'
    const method = 'soma';
    const result = await anyJSClient.mapForEach(mapName, codeName, method);
    console.log(result);
  }

  async updateMap() {
    const mapName = 'myMap'
    const map = {
      key1: 10,
      key2: 20,
      key3: 30,
      key4: 40,
    }

    const result = await anyJSClient.updateMap(mapName, map);
    console.log(result);
  }

  async getMapEntries() {
    const mapName = 'myMap'

    const result = await anyJSClient.getMapEntries(mapName);
    console.log(result);
  }

  async getMapElement() {
    const mapName = 'myMap'
    const key = 'key1'

    const result = await anyJSClient.getMapElement(mapName, key);
    console.log(result);
  }

  async clearMap() {
    const mapName = 'myMap'

    const result = await anyJSClient.clearMap(mapName);
    console.log(result);
  }

  async deleteMap() {
    const mapName = 'myMap'

    const result = await anyJSClient.deleteMap(mapName);
    console.log(result);
  }
}

class PersonExperiment {
  constructor(firstName = null, lastName = null, salary = null) {
    this.id = PersonExperiment.generateId();
    this.firstName = firstName;
    this.lastName = lastName;
    this.salary = salary;
  }

  static generateId() {
    if (!PersonExperiment.id) {
      PersonExperiment.id = 0;
    }
    const id = PersonExperiment.id;
    PersonExperiment.id++;
    return id;
  }
}

class Factorial {
  constructor() { }

  factorial(n) {
    if (n === 0) {
      return 1;
    } else {
      return n * this.factorial(n - 1);
    }
  }
}

const register = new Register();
const execute = new Execute();
const store = new Store();
const instantiate = new Instantiate();
const map = new Map();

await register.registerCode();
await register.getCode();
await register.deleteCode();

await execute.executeCode();
await execute.getExecution();
await execute.deleteExecution();

await store.storeObject();
await store.getObject();
await store.deleteObject();

await instantiate.instantiateObject();
await instantiate.getInstantiatedObject();
await instantiate.deleteInstantiatedObject();

await map.createMap();
await map.setElements();
await map.setEntry();
await map.updateMapElement();
await map.mapForEach();
await map.updateMap();
await map.getMapEntries();
await map.getMapElement();
await map.clearMap();
await map.deleteMap();
