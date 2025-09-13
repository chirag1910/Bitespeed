const { Sequelize } = require('sequelize');

// Create and export the Sequelize instance
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite'
});

module.exports = sequelize;