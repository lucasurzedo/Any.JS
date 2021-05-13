# AnyJS

Any.JS (Anywhere JSONs) is a distributed general purpose computing middleware that supports maps, global variables and tasks concepts. It is designed for JavaScript code, but it will also support Python and Java in near future. There is an interoperable REST API sending and receiving JSON objects to the cloud.

Any.JS is a containerized and resilient scalable solution. Programmers can use its API directly or they can also create customized clients in different programming languages. There is a Python client to represent this issue. 

The middleware solution is asynchronous, thus object instantiation or storage, maps manipulations and tasks executions are performed asynchronously. There are ways to observe and wait for a service conclusion. The wait is useful for tasks and it has a time to wait a period of time for a task result. The observe, on the other hand, waits until a global variable or a map or a map entry (key-value pair) changes their states (delete, insert, update, for instance). 

## Services
- **Register:** responsible for uploading all Java, Python or JavaScript code to the cluster. Must be done once.
- **Execute:** responsible to execute a method of a class in a specific language. 
- **Sync:** responsible to obtain a task result, creating a synchronization barrier.
- **Store:** responsible to store an object. 
- **Instantiate:** responsible to instantiate and store an object. 
- **Lock** and **Unlock:** responsible to guarantee safe access to an object, locking it for safe utilization and unlocking it to deliver the object back to the cluster.
- **Observe:** responsible to observe and receive notifications when objects change their states and when tasks conclude their executions.

### The REST API
The REST API can be called by any client developed with any programming language or by an API caller, like [Insomnia](https://insomnia.rest/) or [Postman](https://www.postman.com/product/api-client/).

Details about the REST API at [open api documentation](https://app.swaggerhub.com/apis-docs/lucasurzedo/AnyJS/1.0.0).
