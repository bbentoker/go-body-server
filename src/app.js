const express = require('express');
const cors = require('cors');

const providerRoutes = require('./routes/providerRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const publicRoutes = require('./routes/publicRoutes');

const app = express();

// Enable CORS for specific origins
app.use(cors({
  origin: 'https://go-body.co',
  credentials: true
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Express server' });
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.use('/auth', authRoutes);
app.use('/providers', providerRoutes);
app.use('/users', userRoutes);
app.use('/services', serviceRoutes);
app.use('/reservations', reservationRoutes);
app.use('/public', publicRoutes);

module.exports = app;


