const express = require('express');
const app = express();
app.use(express.json());
const {
  models: { User },
} = require('./db');
const path = require('path');
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT;

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.post('/api/auth', async (req, res, next) => {
  try {
    res.send({ token: await User.authenticate(req.body) });
  } catch (ex) {
    next(ex);
  }
});

app.get('/api/auth', async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    const userInfo = await jwt.verify(token, SECRET);
    res.send(await User.byToken(userInfo.userId));
  } catch (ex) {
    next(ex);
  }
});

app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500).send({ error: err.message });
});

module.exports = app;
