# Express.js REST API Agenda App

### The Node.js app which supports multiple users and allows each user to create their own todo items via REST API

Run `npm i && npm start` from Terminal to access the server via localhost or send requests to [Heroku](https://yos-todo-api.herokuapp.com/) production app.

#### App flow

1. Register new user via POST/users
2. Log in via POST/users/login. `Auth` header will be returned with the authentication token. If working from Postman the `authToken` environment variable should be set to the received token. 
3. Now any other request can be made.

#### Architecture of the app

The server is implemented using [Express.js](http://expressjs.com). [Sequelize.js](http://docs.sequelizejs.com) is used for interaction with the database. Postgres is used for production while Sqlite is used for development.

#### External libraries

1. [underscore](https://www.npmjs.com/package/underscore) provides utility functions.
2. [bcrypt](https://www.npmjs.com/package/bcryptjs) for salting and hashing user passwords.
3. [crypto-js](https://www.npmjs.com/package/crypto-js) for token encryption.
4. [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken) for generating user token.
5. [http-status-codes](https://www.npmjs.com/package/http-status-codes) for usage of predefined constants.


#### Middleware

1. [Body-parser](https://www.npmjs.com/package/body-parser) is used to process requests.

#### Additional documentation

All requests/routes can be found in the [Postman](https://documenter.getpostman.com/view/4351524/RW87pUqv) doc along with the example body request data. In addition Postman collection for the app, as well as the environment variables can be found in the Postman directory of the project. Specifically, the Postman environment variable `apiUrl` can be either `http://localhost:3000` for development  or `https://yos-todo-api.herokuapp.com` for production.

There's currently no frontend for the app. All actions can be made only via the API.

The app is part of the Node.js developer course project from Udemy.