import express from 'express';

export const routes = express.Router();

routes.get('/test', (req, res) => res.sendFile('index.html', { root: __dirname }));

routes.get('/api/heartbeat', (req, res) => {
  res.send('ba-bum');
});
