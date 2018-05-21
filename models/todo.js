const _ = require('underscore');
module.exports = (sequelize, DataTypes) => {
    return sequelize.define('todo', {
        description: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                len: [1, 250],
                isString: function (val) {
                    if (!(typeof val === 'string')) {
                        throw new Error("description must be a string");
                    }
                }
            }
        },
        completed: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            validate: {
                isBoolean: function (val) {
                    if (!_.isBoolean(val)) {
                        throw new Error('completed field must be boolean');
                    }
                }
            }
        }
    });
};