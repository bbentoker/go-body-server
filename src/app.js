const express = require('express');

const providerRoutes = require('./routes/providerRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Express server' });
});

app.use('/auth', authRoutes);
app.use('/providers', providerRoutes);
app.use('/users', userRoutes);

module.exports = app;


