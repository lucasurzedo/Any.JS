# Any.JS

Any.JS (Anywhere JSONs) is a distributed general purpose computing middleware that supports maps, global variables and tasks concepts. It is designed for JavaScript code, but it will also support Python and Java in near future. There is an interoperable REST API sending and receiving JSON objects to the cloud.

Any.JS is a containerized and resilient scalable solution. Programmers can use its API directly or they can also create customized clients in different programming languages. There is a Python client to represent this issue. 

The middleware solution is asynchronous, thus object instantiation or storage, maps manipulations and tasks executions are performed asynchronously. There are ways to observe and wait for a service conclusion. The wait is useful for tasks and it has a time to wait a period of time for a task result. The observe, on the other hand, waits until a global variable or a map or a map entry (key-value pair) changes their states (delete, insert, update, for instance). 

## Services
- **Register:** Responsible for upload all JavaScript or Java or Python code to the cluster. This process must be done at least once because many other service types, like execute and instantiate, use these codes to perform their jobs. The user just inform the location via URL of the code and Any.JS performs the download.

- **Execute:** It will execute a method of a class in an asynchronous and decentralized way. For that, the programmer must, through a JSON, pass to the API the parameters to execute the method, the previous registered module and the name of the method. The method parameters can be simple ones or complex JSON objects.

- **Execute Batch:** It will execute the same method of a class multiple times with different parameters. All executions are asynchronous and decentralized. Internally, Any.JS receives all runs and distribute them among all Any.JS containers available in the cluster. Each container can receive multiple method runs because there is a bag of tasks on each Any.JS running container to handle them. In the programmer perspective, it is necessary to mount a JSON and call the API just once with such JSON to perform multiple method calls. The method parameters can be simple ones or complex JSON objects. Since Execute Batch runs a method multiple times, there is a set of set of parameters in the JSON, one set per method run. The results of a batch can be obtained asynchronously via Observer, which means that each task result can be obtained individually, avoiding all batch method runs conclusion.

- **Store:** Responsible for storing an object already instantiated by the user. The object must be serialized to Binary JSON (BSON) format.

- **Instantiate:** Responsible for instantiating an object and storing it in the cluster, this way, the user must specify the constructor name, the previous registered module and the parameters (similar to Execute service).

- **Lock** and **Unlock:** Performs secure access to a variable previous created via Instantiate or Store services, or to a map entry previous created and populated via M ap services. Both Lock and Unlock primitives require the name of the variable or the key of a map entry. They guarantee concurrent accesses of resources using a simple mutual exclusion solution. Any.JS uses a FIFO access order internally. Besides that, Lock and Observe are the unique synchronous services of the entire RESTful API.

- **Map:** Represents a transparent JavaScript distributed map in the API, thus all methods available in many map data structures of many programming languages are made available for use in the API, including the iterator, putALL and so many others.

- **Observe:** Represents a catalog of collections of Any.JS and a publish/subscribe mechanism. Applications can subscribe to these collections if the user wants to be notified of a service state change, being it a task execution completion or a variable storage or any other API option.

### The REST API
The REST API can be called by any client developed with any programming language or by an API caller, like [Insomnia](https://insomnia.rest/) or [Postman](https://www.postman.com/product/api-client/).

Details about the REST API at [open api documentation](https://app.swaggerhub.com/apis-docs/lucasurzedo/AnyJS/1.0.0).

### Docker image

If you want to use the middleware docker image, you can access it directly from docker hub at this [link](https://hub.docker.com/r/lucasurzedo/anyjs).

### Research background

Any.JS final [report link](https://www.monografias.ufop.br/bitstream/35400000/4709/6/MONOGRAFIA_AnyJSRestful.pdf).