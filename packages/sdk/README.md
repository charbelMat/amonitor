# amonitor

Error tracking and performance tracing client for Node.js. Reports uncaught
exceptions, unhandled rejections, manually captured errors/messages (with
recent breadcrumbs attached), and request transactions/spans to a
node-monitor API instance, where they show up as issues and traces in the
dashboard.

## Install

```bash
npm install amonitor
```

## Usage

```js
const { NodeMonitor } = require('amonitor');

NodeMonitor.init({
  dsn: 'nm_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // from the project's settings in the dashboard
  apiUrl: 'http://localhost:3001',             // where the node-monitor API runs
  environment: 'production',
});

// Uncaught exceptions and unhandled rejections are reported automatically.
// Report anything else manually:
try {
  doSomethingRisky();
} catch (error) {
  NodeMonitor.captureException(error);
}

// Breadcrumbs give you the trail of events leading up to an error.
NodeMonitor.addBreadcrumb({ category: 'http', message: 'GET /orders/42', level: 'info' });
```

## Performance tracing

```js
const express = require('express');
const app = express();

app.use(NodeMonitor.tracingMiddleware()); // wraps every request in a transaction

app.get('/orders/:id', async (req, res) => {
  const span = req.nodeMonitorTransaction.startChild('db.query', 'SELECT * FROM orders WHERE id = ?');
  const order = await db.query(...);
  span.finish();
  res.json(order);
});
```

Or manually, without the middleware:

```js
const transaction = NodeMonitor.startTransaction('process-batch-job', 'job');
const span = transaction.startChild('db.query', 'SELECT ...');
// ... do the work ...
span.finish();
transaction.finish(); // reports the transaction + its spans
```

Spans attach directly to their transaction (one level deep) rather than to
each other — enough to see "this request took 400ms, 350ms of which was one
DB query" without needing async-context propagation through arbitrary
nested calls.

## Options

| Option                   | Default             | Description                                              |
|--------------------------|---------------------|------------------------------------------------------------|
| `dsn`                    | required            | The project's DSN key from the dashboard                  |
| `apiUrl`                 | required            | Base URL of the node-monitor API                           |
| `environment`            | `NODE_ENV`          | Tag attached to every event                                 |
| `tags`                   | `{}`                | Extra tags attached to every event                          |
| `maxBreadcrumbs`         | `20`                | Breadcrumbs kept in the ring buffer                          |
| `autoCaptureExceptions`  | `true`               | Install `uncaughtException`/`unhandledRejection` handlers   |

Note: an uncaught exception is still fatal — Node's own guidance is that the
process is in an undefined state after one. The SDK reports it, then exits
the process; it does not try to keep the app alive.

## Multiple clients in one process

```js
const { NodeMonitorClient } = require('amonitor');
const monitor = new NodeMonitorClient({ dsn: '...', apiUrl: '...' });
monitor.captureException(error);
```
