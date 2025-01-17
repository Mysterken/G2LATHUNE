// const app = require("./server");
// const { port } = require("./config");

// const server = app.listen(port, function () {
//   console.log(`Webserver is ready and running on port ${port}`);
// });

// // Graceful shutdown on Docker signals
// process.on("SIGINT", function onSigint() {
//   console.info("Got SIGINT (ctrl-c). Graceful shutdown ", new Date().toISOString());
//   shutdown();
// });

// process.on("SIGTERM", function onSigterm() {
//   console.info("Got SIGTERM (docker stop). Graceful shutdown ", new Date().toISOString());
//   shutdown();
// });

// function shutdown() {
//   server.close(function onServerClosed(err) {
//     if (err) {
//       console.error(err);
//       process.exit(1);
//     }
//     process.exit(0);
//   });
// }


const app = require("./server");
const { port } = require("./config");

const server = app.listen(port, function () {
  console.log(`Webserver is ready and running on port ${port}`);
});

process.on("SIGINT", function onSigint() {
  console.info("Got SIGINT (ctrl-c). Graceful shutdown ", new Date().toISOString());
  shutdown();
});

process.on("SIGTERM", function onSigterm() {
  console.info("Got SIGTERM (docker stop). Graceful shutdown ", new Date().toISOString());
  shutdown();
});

function shutdown() {
  server.close(function onServerClosed(err) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    process.exit(0);
  });
}
