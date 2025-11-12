const express = require('express');

const providerRoutes = require('./routes/providerRoutes');

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Express server' });
});

app.use('/providers', providerRoutes);

module.exports = app;


