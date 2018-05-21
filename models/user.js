const bcrypt = require('bcrypt');
const _ = require('underscore');
const cryptojs = require('crypto-js');
const jwt = require('jsonwebtoken');
const HTTP_STATUS = require('http-status-codes');
const SALT_ROUNDS_LEN = 10;
const toPublicJSONFields = ['id', 'email', 'createdAt', 'updatedAt'];
const SECRET_KEY = 'abc123!#*';
const JWT_SECRET = 'qwerty123$';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('user', {
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        salt: {
            type: DataTypes.STRING
        },
        password_hash: {
            type: DataTypes.STRING
        },
        password: {
            type: DataTypes.VIRTUAL, //we don't want to store the actual password
            allowNull: false,
            validate: {
                len: [7, 100]
            },
            set: function(password) {
                /*
                getters/setters in sequelize only support sync events as per this question:
                https://stackoverflow.com/questions/22002698/sequelize-custom-setter-doesnt-set
                 */
                let salt = bcrypt.genSaltSync(SALT_ROUNDS_LEN);
                let hashedPassword = bcrypt.hashSync(password, salt);
                this.setDataValue('password', password);
                this.setDataValue('salt', salt);
                this.setDataValue('password_hash', hashedPassword);
            }
        }
    },
        {
           hooks: {
               beforeValidate: (user, options) => {
                   if(typeof user.email === 'string') {
                       user.email = user.email.toLowerCase();
                   }
               }
           },
           classMethods: {
               authenticate: function (body) {
                   return new Promise(((resolve, reject) => {
                       let error = {
                           code: HTTP_STATUS.INTERNAL_SERVER_ERROR
                       };
                       if(typeof body.email === 'string' && typeof body.password === 'string') {
                           this.findOne({
                               where: {
                                   email: body.email
                               }
                           }).then(user => {
                               if(user && bcrypt.compareSync(body.password, user.get('password_hash'))) {
                                   resolve(user);
                               } else {
                                   error.code = HTTP_STATUS.UNAUTHORIZED;
                                   reject(error);
                               }
                           }).catch( () => {
                               reject(error)
                           });
                       } else {
                           error.code = HTTP_STATUS.BAD_REQUEST;
                           reject(error);
                       }
                   }));
               },
               findByToken: function (token) {
                   return new Promise( (resolve, reject) => {
                       try {
                           let decodedJWT = jwt.verify(token, JWT_SECRET);
                           let bytes = cryptojs.AES.decrypt(decodedJWT.token, SECRET_KEY);
                           let tokenData = JSON.parse(bytes.toString(cryptojs.enc.Utf8));
                           this.findById(tokenData.id)
                               .then(user => {
                                   if(user) {
                                       resolve(user);
                                   } else {
                                       reject();
                                   }
                               })
                               .catch(() => reject());
                       } catch(e) {
                           reject();
                       }
                   });
               }

           },
           instanceMethods: {
               toPublicJSON: function() {
                   let json = this.toJSON();
                   return _.pick(json, ...toPublicJSONFields);
               },
               generateToken: function (type) {
                   if(typeof type !== 'string') {
                       return undefined;
                   }
                   try {
                       let stringData = JSON.stringify({id: this.get('id'), type: type});
                       let encryptedData = cryptojs.AES.encrypt(stringData, SECRET_KEY).toString();
                       let token = jwt.sign({
                           token: encryptedData,
                       }, JWT_SECRET);
                       return token;
                   }catch (e) {
                       return undefined;
                   }
               }
           }
        });
};