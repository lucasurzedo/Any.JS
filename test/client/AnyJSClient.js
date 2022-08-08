const fetch = require('node-fetch');
const { serialize, deserialize } = require('bson');

class AnyJSClient {
  constructor(host) {
      this.host = host;
  }

  // Register requests
  async registerCode(codeName, code) {
    const registerCode = {
      codeName,
      code,
    }
    const body = JSON.stringify(registerCode);
    const res = await fetch(`${this.host}/api/anyJS/v1/register`, {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const json = await res.json();
    return json.result;
  }

  async getCode(code) {
    const res = await fetch(`${this.host}/api/anyJS/v1/register/${code}`, {
      method: 'GET',
    });
    const json = await res.json();
    return json.result;
  }

  async deleteCode(code) {
    const res = await fetch(`${this.host}/api/anyJS/v1/register/${code}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    return json.result;
  }

  // Storage and Instantiate requests
  async storeObject(object, code, objectName) {
    const serializedObject = serialize(object, { serializeFunctions : true}).toString('base64');
    const storeObject = {
      objectName,
      code,
      object: serializedObject,
    }
    const body = JSON.stringify(storeObject);
    const res = await fetch(`${this.host}/api/anyJS/v1/store`, {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const json = await res.json();
    return json.result;
  }

  async instantiateObject(code, objectName, args = []) {
    const object = {
      code,
      objectName,
      args,
    }
    const body = JSON.stringify(object);
    const res = await fetch(`${this.host}/api/anyJS/v1/instantiate`, {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const json = await res.json();
    return json.result;
  }

  async getInstantiatedObject(code, objectName) {
    const res = await fetch(`${this.host}/api/anyJS/v1/instantiate/${code}/${objectName}`, {
      method: 'GET',
    });
    const json = await res.json();
    console.log(json);
    const buffer = Buffer.from(json.result.object, 'base64');
    const obj = deserialize(buffer, { evalFunctions : true, cacheFunctions : true});
    return obj;
  }

  async getObject(code, objectName) {
    const res = await fetch(`${this.host}/api/anyJS/v1/store/${code}/${objectName}`, {
      method: 'GET',
    });
    const json = await res.json();
    const buffer = Buffer.from(json.result.object, 'base64');
    const obj = deserialize(buffer, { evalFunctions : true, cacheFunctions : true});
    return obj;
  }

  async getAllObjects(code) {
    const res = await fetch(`${this.host}/api/anyJS/v1/store/${code}`, {
      method: 'GET',
    });

    const json = await res.json();
    const elements = json.elements;

    const objects = [];
    for (let object of elements) {
      const buffer = Buffer.from(object.object, 'base64');
      const obj = deserialize(buffer, { evalFunctions : true, cacheFunctions : true});
      objects.push(obj);
    }
    return objects;
  }

  async deleteObject(code, objectName) {
    const res = await fetch(`${this.host}/api/anyJS/v1/store/${code}/${objectName}`, {
    method: 'DELETE',
    });
    const json = await res.json();
    return json.result;
  }

  async deleteInstantiatedObject(code, objectName) {
    const res = await fetch(`${this.host}/api/anyJS/v1/instantiate/${code}/${objectName}`, {
    method: 'DELETE',
    });
    const json = await res.json();
    return json.result;
  }

  // Execute requests
  async executeCode(code, taskName, args, method, methodArgs = []) {
    const execution = {
      code,
      taskName,
      args,
      method,
      methodArgs,
    }
    const body = JSON.stringify(execution);
    const res = await fetch(`${this.host}/api/anyJS/v1/execute`, {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const json = await res.json();
    return json.result;
  }

  async getExecution(taskName, exectionName) {
    const res = await fetch(`${this.host}/api/anyJS/v1/execute/${taskName}/execution/${exectionName}`, {
      method: 'GET',
    });
    const json = await res.json();
    return json.result;
  }

  async getAllExecutions(taskName) {
    const res = await fetch(`${this.host}/api/anyJS/v1/execute/${taskName}/execution/`, {
      method: 'GET',
    });
    const json = await res.json();
    return json.result;
  }

  async deleteTask(taskName) {
    const res = await fetch(`${this.host}/api/anyJS/v1/execute/${taskName}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    return json.result;
  }

  async deleteExecution(taskName, exectionName) {
    const res = await fetch(`${this.host}/api/anyJS/v1/execute/${taskName}/execution/${exectionName}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    return json.result;
  }

  // Map requests
  async createMap(mapName) {
    const map = {
      mapName,
    }
    const body = JSON.stringify(map);

    const res = await fetch(`${this.host}/api/anyJS/v1/map`, {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const json = await res.json();
    return json.result;
  }

  async setMapElements(mapName, elements) {
    const mapElements = {
      mapName,
      elements,
    }
    const body = JSON.stringify(mapElements);
    const res = await fetch(`${this.host}/api/anyJS/v1/map/set`, {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const json = await res.json();
    return json.result;
  }

  async setMapEntry(mapName, key, value) {
    const entry = {
      mapName,
      key,
      value,
    }
    const body = JSON.stringify(entry);
    const res = await fetch(`${this.host}/api/anyJS/v1/map/entry`, {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const json = await res.json();
    return json.result;
  }

  async mapForEach(mapName, code, method, args = []) {
    const execution = {
      mapName,
      code,
      method,
      args,
    }
    const body = JSON.stringify(execution);
    const res = await fetch(`${this.host}/api/anyJS/v1/map/forEach`, {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const json = await res.json();
    return json.results;
  }

  async updateMapElement(mapName, key, value) {
    const entry = {
      mapName,
      key,
      value,
    }
    const body = JSON.stringify(entry);
    const res = await fetch(`${this.host}/api/anyJS/v1/map/update`, {
      method: 'PATCH',
      body,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const json = await res.json();
    return json;
  }

  async updateMap(mapName, map) {
    const newMap = {
      mapName,
      map,
    }
    const body = JSON.stringify(newMap);
    const res = await fetch(`${this.host}/api/anyJS/v1/map/update`, {
      method: 'PUT',
      body,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const json = await res.json();
    return json.result;
  }

  async getMapElement(mapName, key) {
    const res = await fetch(`${this.host}/api/anyJS/v1/map/get/${mapName}/key/${key}`, {
      method: 'GET',
    });
    const json = await res.json();
    return json.result;
  }

  async getMapEntries(mapName) {
    const res = await fetch(`${this.host}/api/anyJS/v1/map/entries/${mapName}`, {
      method: 'GET',
    });
    const json = await res.json();
    return json.entries;
  }

  async hasMapElement(mapName, key) {
    const res = await fetch(`${this.host}/api/anyJS/v1/map/${mapName}/key/${key}`, {
      method: 'GET',
    });
    const json = await res.json();
    return json.result;
  }

  async getAllMapKeys(mapName) {
    const res = await fetch(`${this.host}/api/anyJS/v1/map/keys/${mapName}`, {
      method: 'GET',
    });
    const json = await res.json();
    return json.keys;
  }

  async getAllMapValues(mapName) {
    const res = await fetch(`${this.host}/api/anyJS/v1/map/values/${mapName}`, {
      method: 'GET',
    });
    const json = await res.json();
    return json.values;
  }

  async deleteMapKey(mapName, key) {
    const res = await fetch(`${this.host}/api/anyJS/v1/map/${mapName}/key/${key}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    return json.result;
  }

  async clearMap(mapName) {
    const res = await fetch(`${this.host}/api/anyJS/v1/map/clear/${mapName}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    return json.result;
  }

  async deleteMap(mapName) {
    const res = await fetch(`${this.host}/api/anyJS/v1/map/${mapName}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    return json.result;
  }
}

module.exports = AnyJSClient;
