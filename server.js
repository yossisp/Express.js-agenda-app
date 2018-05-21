const express = require('express');
const bodyParser = require('body-parser');
const _ = require('underscore');
const HTTP_STATUS = require('http-status-codes');
const db = require('./db.js');
const middleware = require('./middleware.js') (db);
const DEFAULT_PORT = 3000;
const BASE_10 = 10;
const app = express();
let PORT = process.env.PORT || DEFAULT_PORT;

app.use(bodyParser.json());

//root route
app.get('/', middleware.requireAuthentication, (req, res) => {
    res.send('Todo API root');
});

//display all todo items
app.get('/todos', middleware.requireAuthentication, (req, res) => {
    let query = req.query;
    let where = {userId: req.user.get('id')};

    if(query.hasOwnProperty('completed')) {
        where.completed = (query.completed === 'true') ? true : false;
    }
    if(query.hasOwnProperty('q') && query.q.trim().length > 0) {
        where.description = {
            $like:  '%' + query.q.trim() + '%'
        }
    }
    db.todo.findAll({where: where})
        .then(todos => {
            todos.forEach( (todo, i, array) => {
                array[i] = array[i].toJSON();
            });
            res.json(todos);
        })
        .catch(e => res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send());
});

//display a todo item by id
app.get('/todos/:id', middleware.requireAuthentication, (req, res) => {
    let id = parseInt(req.params.id, BASE_10);
    db.todo.findOne({
        where: {
            id: id,
            userId: req.user.get('id')
        }
    })
        .then(todo => {
            if(todo) {
                res.json(todo.toJSON());
            } else {
                res.status(HTTP_STATUS.NOT_FOUND).send()
            }
        })
        .catch(e => res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR));
});

//create a new todo item
app.post('/todos', middleware.requireAuthentication, (req, res) => {
    let body = _.pick(req.body, 'description', 'completed');
    db.todo.create(body)
        .then(todo => {
            req.user.addTodo(todo).then( () => {
                return todo.reload();
            }).then(todo => {
                res.json(todo.toJSON());
            })
        })
        .catch(e => res.status(HTTP_STATUS.BAD_REQUEST).send(e));
});

//create a new user
app.post('/users', (req, res) => {
    let body = _.pick(req.body, 'email', 'password');
    db.user.create(body)
        .then(user => {
            res.json(user.toPublicJSON());
        })
        .catch(e => {
            res.status(HTTP_STATUS.UNAUTHORIZED).send();
        });
});

//login
app.post('/users/login', (req, res) => {
    let body = _.pick(req.body, 'email', 'password');
    let userInstance;

    db.user.authenticate(body)
        .then(user => {
            let token = user.generateToken('authentication');
            userInstance = user;
            return db.token.create({
                token: token
            });
        })
        .then(tokenInstance => {
            res.header('Auth', tokenInstance.get('token')).json(userInstance.toPublicJSON());
        })
        .catch((e) => {
            res.status(e.code).send();
        });
});

//logout
app.delete('/users/login', middleware.requireAuthentication, (req, res) => {
    req.token.destroy()
        .then( () => {
            res.status(HTTP_STATUS.NO_CONTENT).send();
        })
        .catch( () => {
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send();
        });
});

//delete a todo item
app.delete('/todos/:id', middleware.requireAuthentication, (req, res) => {
    let id = parseInt(req.params.id, 10);
    db.todo.destroy({
        where: {
            id: id,
            userId: req.user.get('id')
        }
    })
        .then(numOfRows => {
            if(numOfRows > 0) {
                res.status(HTTP_STATUS.NO_CONTENT).send();
            } else {
                res.status(HTTP_STATUS.NOT_FOUND).json({"error":"todo with the id not found"});
            }
        })
        .catch(e => res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send());
});

//modify a todo item
app.put('/todos/:id', middleware.requireAuthentication, function(req, res) {
    let todoId = parseInt(req.params.id, BASE_10);
    let body = _.pick(req.body, 'description', 'completed');
    let attributes = {};

    if (body.hasOwnProperty('completed')) {
        attributes.completed = body.completed;
    }

    if (body.hasOwnProperty('description')) {
        attributes.description = body.description;
    }

    db.todo.findOne({
        where: {
            id: todoId,
            userId: req.user.get('id')
        }
    })
        .then(todo => {
            if(todo) {
                todo.update(attributes)
                    .then(todo => {
                        res.json(todo.toJSON());
                    })
                    .catch(e => {
                        res.status(HTTP_STATUS.BAD_REQUEST).json(e);
                    })
            } else {
                res.status(HTTP_STATUS.NOT_FOUND).send();
            }
        })
        .catch( () => {
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send();
        })
});

//table is dropped by default, can be set to {force: false} in order not to drop
db.sequelize.sync({force:true})
    .then( () => {
        app.listen(PORT, () => console.log('Express listening on the port ' + PORT));
    });
