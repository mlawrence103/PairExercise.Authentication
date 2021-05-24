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

const Note = conn.define('note', {
  text: STRING,
});

User.hasMany(Note);
Note.belongsTo(User);

async function hashPassword(password) {
  const SALT_COUNT = 1;
  const hashedPwd = await bcrypt.hash(password, SALT_COUNT);
  return hashedPwd;
}

User.beforeCreate(async (user) => {
  const hashedPwd = await hashPassword(user.password);
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
  console.log('password: ', password);
  const user = await User.findOne({
    where: {
      username,
    },
  });
  console.log('user.password: ', user.password);
  if (await bcrypt.compare(password, user.password)) {
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
  const notes = [
    { text: 'hello' },
    { text: 'California' },
    { text: 'Coding is cool' },
    { text: 'Meche for life' },
  ];
  const [note1, note2, note3, note4] = await Promise.all(
    notes.map((note) => Note.create(note))
  );
  const [lucy, moe, larry] = await Promise.all(
    credentials.map((credential) => User.create(credential))
  );
  await note1.setUser(lucy);
  await note2.setUser(moe);
  await note3.setUser(moe);
  await note4.setUser(larry);
  return {
    users: {
      lucy,
      moe,
      larry,
    },
    notes: {
      note1,
      note2,
      note3,
      note4,
    },
  };
};

module.exports = {
  syncAndSeed,
  models: {
    User,
  },
};
