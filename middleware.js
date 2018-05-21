const cryptojs = require('crypto-js');
const HTTP_STATUS = require('http-status-codes');
const EMPTY_STR = '';

/*
The middleware plays the central role in authentication process:

1) When a user logs in authenticate() class method in user.js model is called in order
to check that the user exists. Checking is done by checking whether the email exists in the
database and if yes the provided password is hashed and compared to the salted password in the user.js
table. If the password is correct a token is generated using AES encryption and JWT.
The token is then saved in the token.js table for future use (mainly to handle logout). Finally,
the token is returned to the user via Auth header.

2) The user will need to Auth header for every requests they make (except for creating a new user and
logging in). After a request to some route is made the middleware checks whether the token is valid.
requireAuthentication() first attempts to find the token in the token.js table. If the token is found
it sets the request token parameter to the token instance (this is need in order to to delete the token
if the user logs out) and looks for the user which corresponds to the encrypted token.
If the user is found next() is called and we proceed further with the execution of the original
route request.

3) If the user wants to log out, the token instance is deleted from token.js table (the token
instance is attached to all requests user makes by requireAuthentication()).
 */

module.exports = function(db) {
    return {
        requireAuthentication: function(req, res, next) {
            let token = req.get('Auth') || EMPTY_STR;

            db.token.findOne({
                where: {
                    tokenHash: cryptojs.MD5(token).toString()
                }
            })
                .then(tokenInstance => {
                    if(!tokenInstance) {
                        throw new Error();
                    }
                    req.token = tokenInstance;
                    return db.user.findByToken(token);
                })
                .then(user => {
                    req.user = user;
                    next();
                })
                .catch( () => {
                    res.status(HTTP_STATUS.UNAUTHORIZED).send();
                });
        }
    }
};