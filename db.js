const Sequelize = require('sequelize');
let env = process.env.NODE_ENV || 'development'; //heroku will set it to 'production'
let sequelize;

if (env === 'production') {
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres'
    });
} else {
    sequelize = new Sequelize(undefined, undefined, undefined, {
        'dialect': 'sqlite',
        'storage': __dirname + '/data/dev-todo-api.sqlite'
    });
}

let db = {};

db.todo = sequelize.import(__dirname + '/models/todo.js');
db.user = sequelize.import(__dirname + '/models/user.js');
db.token = sequelize.import(__dirname + '/models/token.js');

db.sequelize = sequelize;
db.Sequelize = Sequelize;

//create association between todo and user tables
db.todo.belongsTo(db.user);
db.user.hasMany(db.todo);

module.exports = db;