const express = require('express');
const sequelize = require('./db');
const Contact = require('./model');

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ message: 'Hello, World!' });
});

sequelize.sync({ force: false })
  .then(() => {
    console.log('Database synced!');
    
    app.listen(port, () => {
      console.log(`Listening at http://localhost:${port}`);
    });
  })
  .catch(err => {
    console.error('Error syncing database:', err);
  });