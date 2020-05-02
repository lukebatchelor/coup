import express from 'express';

export const routes = express.Router();

routes.get('/api/heartbeat', (req, res) => {
  res.send('ba-bum');
});
