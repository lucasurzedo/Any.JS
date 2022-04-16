const cluster = require('cluster');
const CPUs = require('os').cpus().length;
const log = require('./utils/log');
const { setupApp } = require('./express-server');

if (cluster.isMaster) {
  log.info(`Master ${process.pid} is running`);

  // forks a process for each CPU core
  for (let i = 0; i < CPUs; i += 1) {
    cluster.fork();
  }
  cluster.on('exit', (worker) => {
    log.info(`worker ${worker.process.pid} died`);
  });
} else {
  const port = 4445;
  setupApp()
    .then((app) => {
      app.listen({ port }, () => log.info(`app running on port ${port}`));
      log.info(`Worker ${process.pid} started`);
      return app;
    })
    .catch((error) => {
      log.error(error);
    });
}
