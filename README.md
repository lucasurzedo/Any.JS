# AnyJS

Any.JS is a distributed JavaScript middleware that assumes that the programmer can instantiate or store Python, Java or JavaScript objects transparently in a cluster of properly containerized virtual machines and, logically, error-tolerant and scalable. In addition to object storage, the middleware offers asynchronous and distributed execution of Python, Java or JavaScript functions in an equally transparent way to the programmer. A REST API and JSON objects guarantee the interoperability of the solution. 

## Solution
Programmers in such languages will be able to submit tasks or manage the life cycle of their objects, including collaboration between different applications. All the services are provided in a simplified way, so the programmers does not worry about arduous high performance computing issues (precisely, side effects arising from the distribution and parallelism of services). Language interoperability is another very innovative factor in the Any.JS solution.

## Services
- **Store:** Responsible to store an object.
- **Instantiate:** Responsible to instantiate and store an object.
- **Execute:** Responsible to execute a method in a specific language.
- **Register:** Responsible for uploading all Python, Java or JavaScript code to the cluster.
- **Sync:** Responsible to obtain a task result, creating a synchronization barrier.
- **Lock and Unlock:** Responsible to guarantee safe access to an object, locking it for safe utilization and unlocking it to deliver the object back to the cluster.
- **Observe:** Responsible to observe and receive notifications when objects change their states and when tasks conclude their executions.
