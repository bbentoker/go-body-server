const express = require('express');
const cors = require('cors');

const providerRoutes = require('./routes/providerRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const reservationRoutes = require('./routes/reservationRoutes');

const app = express();

// Enable CORS for all origins
app.use(cors());

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Express server' });
});

app.use('/auth', authRoutes);
app.use('/providers', providerRoutes);
app.use('/users', userRoutes);
app.use('/services', serviceRoutes);
app.use('/reservations', reservationRoutes);

module.exports = app;


