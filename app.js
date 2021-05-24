const express = require('express');
const app = express();
app.use(express.json());
const {
  models: { User },
} = require('./db');
const path = require('path');
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT;

async function requireToken(req, res, next){
  try {
    const token = req.headers.authorization;
    console.log('token--->', token)
      const userInfo = await jwt.verify(token, SECRET);
      console.log('userInfo--->', userInfo);
      req.user = await User.byToken(userInfo.userId);
      //console.log(req.user);
      next()
  } catch (error) {
    next(error);
  }
}

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.post('/api/auth', async (req, res, next) => {
  try {
    res.send({ token: await User.authenticate(req.body) });
  } catch (ex) {
    next(ex);
  }
});

app.get('/api/auth', requireToken, async (req, res, next) => {
  try {
    requireToken(req, res, next);
    console.log('inside get route---->', req.user)
    res.send(req.user);
  } catch (ex) {
    next(ex);
  }
});

app.get('/api/users/:id/notes', async (req, res, next) => {
  try {
    //const token = req.headers.authorization;
    //const userInfo = await jwt.verify(token, SECRET);
    requireToken(req, res, next)
    const user = await User.findByPk(req.params.id);
    if(user.id === req.user.dataValues.id){
      const notes = await user.getNotes()
      res.send(notes);
    } else{
      res.status(401).send('something went wrong');
    }
  } catch (error) {
    next(error);
  }
})

app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500).send({ error: err.message });
});

module.exports = app;
