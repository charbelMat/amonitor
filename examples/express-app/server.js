'use strict';

const http = require('http');
const { AMonitor } = require('../../packages/sdk/dist');

AMonitor.init({
  dsn: process.env.AMONITOR_DSN || 'REPLACE_WITH_YOUR_PROJECT_DSN_KEY',
  apiUrl: process.env.AMONITOR_URL || 'http://localhost:3001',
  environment: 'development',
});

const server = http.createServer((req, res) => {
  AMonitor.addBreadcrumb({ category: 'http', message: `${req.method} ${req.url}`, level: 'info' });

  if (req.url === '/boom') {
    // Deliberately throws to demonstrate automatic exception capture.
    JSON.parse('not valid json');
    return;
  }

  if (req.url === '/report') {
    AMonitor.captureException(new Error('Manually reported error')).then(() => {
      res.end('reported\n');
    });
    return;
  }

  if (req.url === '/slow') {
    // Demonstrates performance tracing: a transaction with one child span.
    const transaction = AMonitor.startTransaction('GET /slow', 'http.server');
    const dbSpan = transaction.startChild('db.query', 'SELECT * FROM orders');
    setTimeout(() => {
      dbSpan.finish();
      transaction.finish();
      res.end('slow response sent\n');
    }, 300);
    return;
  }

  res.end('ok — try /boom (uncaught), /report (manual capture), or /slow (traced transaction)\n');
});

server.listen(3000, () => {
  console.log('example app listening on http://localhost:3000');
  console.log('  GET /boom   -> uncaught exception, auto-reported, then the process exits');
  console.log('  GET /report -> manually captured error, process keeps running');
  console.log('  GET /slow   -> traced transaction with a child span');
});
