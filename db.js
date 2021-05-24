const Sequelize = require('sequelize');
const bcrypt = require('bcrypt');
const { STRING } = Sequelize;
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT;
const config = {
  logging: false,
};

if (process.env.LOGGING) {
  delete config.logging;
}
const conn = new Sequelize(
  process.env.DATABASE_URL || 'postgres://localhost/acme_db',
  config
);

const User = conn.define('user', {
  username: STRING,
  password: STRING,
});

async function hashPassword(password) {
  const SALT_COUNT = 1;
  const hashedPwd = await bcrypt.hash(password, SALT_COUNT);
  return hashedPwd;
}

User.beforeCreate((user) => {
  const hashedPwd = hashPassword(user.password);
  user.password = hashedPwd;
});

User.byToken = async (token) => {
  try {
    const user = await User.findByPk(token);
    if (user) {
      return user;
    }
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  } catch (ex) {
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  }
};

User.authenticate = async ({ username, password }) => {
  // const isValid = await bcrypt.compare(password, this.password);
  console.log('this: ', this);
  console.log('password: ', password);
  const hashedPwd = hashPassword(password);
  const isValid = await bcrypt.compare(password, hashedPwd);
  console.log('isValid: ', isValid);
  // if (isValid) {
  const user = await User.findOne({
    where: {
      username,
      password,
    },
  });
  console.log('user.password: ', user.password);
  // }
  if (user) {
    return await jwt.sign({ userId: user.id }, SECRET);
  }
  const error = Error('bad credentials');
  error.status = 401;
  throw error;
};

const syncAndSeed = async () => {
  await conn.sync({ force: true });
  const credentials = [
    { username: 'lucy', password: 'lucy_pw' },
    { username: 'moe', password: 'moe_pw' },
    { username: 'larry', password: 'larry_pw' },
  ];
  const [lucy, moe, larry] = await Promise.all(
    credentials.map((credential) => User.create(credential))
  );
  return {
    users: {
      lucy,
      moe,
      larry,
    },
  };
};

module.exports = {
  syncAndSeed,
  models: {
    User,
  },
};
