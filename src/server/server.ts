import express from 'express';
import http from 'http';
import path from 'path';

import { routes } from './routes';
// import { configureSockets } from './sockets';
// import { createInitialTables } from './repository';

const app = express();
const server = http.createServer(app);

app.use(routes);
// configureSockets(server);

// If not matched anything yet server from dist
app.use(express.static(path.join(__dirname, '..', 'client')));

async function main() {
  // await createInitialTables();
  const port = process.env.PORT || 8080;
  return server.listen(port, () => {
    console.log(`Listening on http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.log('Fatal error: ', err);
});
