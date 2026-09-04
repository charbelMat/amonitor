# amonitor

Error tracking and performance tracing client for Node.js. Reports uncaught
exceptions, unhandled rejections, manually captured errors/messages (with
recent breadcrumbs attached), and request transactions/spans to a
amonitor API instance, where they show up as issues and traces in the
dashboard.

## Install

```bash
npm install amonitor
```

## Usage

```js
const { AMonitor } = require('amonitor');

AMonitor.init({
  dsn: 'am_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // from the project's settings in the dashboard
  apiUrl: 'http://localhost:3001',             // where the amonitor API runs
  environment: 'production',
});

// Breadcrumbs record the trail leading up to an error. Add them as things
// happen — each captured error carries a snapshot of the breadcrumbs
// recorded BEFORE it, so a breadcrumb added afterwards won't appear on it.
AMonitor.addBreadcrumb({ category: 'http', message: 'GET /orders/42', level: 'info' });
AMonitor.addBreadcrumb({ category: 'db', message: 'SELECT * FROM orders', level: 'info' });

// Uncaught exceptions and unhandled rejections are reported automatically.
// Report anything else manually:
try {
  doSomethingRisky();
} catch (error) {
  AMonitor.captureException(error); // ships the two breadcrumbs above with it
}
```

The buffer is per-client and in-memory: it starts empty on every process
start, and holds the most recent `maxBreadcrumbs` (default 20). If you build
your own client with `new AMonitorClient(...)`, add breadcrumbs on *that*
instance — `AMonitor.addBreadcrumb` writes to the singleton's buffer, not
yours.

## Performance tracing

```js
const express = require('express');
const app = express();

app.use(AMonitor.tracingMiddleware()); // wraps every request in a transaction

app.get('/orders/:id', async (req, res) => {
  const span = req.amonitorTransaction.startChild('db.query', 'SELECT * FROM orders WHERE id = ?');
  const order = await db.query(...);
  span.finish();
  res.json(order);
});
```

Or manually, without the middleware:

```js
const transaction = AMonitor.startTransaction('process-batch-job', 'job');
const span = transaction.startChild('db.query', 'SELECT ...');
// ... do the work ...
span.finish();
transaction.finish(); // reports the transaction + its spans
```

Spans attach directly to their transaction (one level deep) rather than to
each other — enough to see "this request took 400ms, 350ms of which was one
DB query" without needing async-context propagation through arbitrary
nested calls.

## Node health (CPU / memory / network)

Every process running the SDK reports itself as a **node** — it shows up on the
dashboard's Nodes page with its CPU, memory, network throughput and event-loop
lag. This is on by default; no extra calls needed.

```js
AMonitor.init({
  dsn: '...',
  apiUrl: '...',
  instanceId: process.env.HOSTNAME,  // pod/container name, so restarts stay one node
  metricsIntervalMs: 15000,
});
```

Run the same project on several machines or pods and each reports separately,
so you can see all instances and their status side by side.

- `instanceId` defaults to `hostname-pid`. In a scheduler that restarts
  processes, set it to a stable name or every restart appears as a new node.
- CPU is the process's share of the **whole machine's** capacity (0-100),
  not of one core.
- Network throughput is read from `/proc/net/dev`, so it is **Linux-only**.
  On macOS/Windows the sample sets `networkSupported: false` and the dashboard
  shows `n/a` rather than a fake zero.
- Reporting uses an `unref`'d timer, so it never keeps your process alive.
  Call `AMonitor.stopMetrics()` to turn it off early.

## Options

| Option                   | Default             | Description                                              |
|--------------------------|---------------------|------------------------------------------------------------|
| `dsn`                    | required            | The project's DSN key from the dashboard                  |
| `apiUrl`                 | required            | Base URL of the amonitor API                           |
| `environment`            | `NODE_ENV`          | Tag attached to every event                                 |
| `tags`                   | `{}`                | Extra tags attached to every event                          |
| `maxBreadcrumbs`         | `20`                | Breadcrumbs kept in the ring buffer                          |
| `autoCaptureExceptions`  | `true`               | Install `uncaughtException`/`unhandledRejection` handlers   |
| `reportMetrics`          | `true`               | Report this process as a node (CPU/memory/network)          |
| `metricsIntervalMs`      | `15000`              | Health sample interval (minimum 5000)                        |
| `instanceId`             | `hostname-pid`       | Stable identity for this process in the Nodes dashboard     |

Note: an uncaught exception is still fatal — Node's own guidance is that the
process is in an undefined state after one. The SDK reports it, then exits
the process; it does not try to keep the app alive.

## Multiple clients in one process

```js
const { AMonitorClient } = require('amonitor');
const monitor = new AMonitorClient({ dsn: '...', apiUrl: '...' });
monitor.captureException(error);
```
