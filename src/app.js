const express = require('express');
const cors = require('cors');

const providerRoutes = require('./routes/providerRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const serviceCategoryRoutes = require('./routes/serviceCategoryRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const publicRoutes = require('./routes/publicRoutes');
const adminRoutes = require('./routes/adminRoutes');
const blogRoutes = require('./routes/blogRoutes');
const webhookRoutes = require('./routes/webhookRoutes');

const app = express();

// Enable CORS for specific origins
const isDev = process.env.NODE_ENV !== 'production';
app.use(cors({
  origin: isDev 
    ? (origin, callback) => {
        // Allow localhost and 127.0.0.1 in development (any port)
        if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    : 'https://go-body.co',
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
app.use('/service-categories', serviceCategoryRoutes);
app.use('/reservations', reservationRoutes);
app.use('/public', publicRoutes);
app.use('/admin', adminRoutes);
app.use('/blogs', blogRoutes);
app.use('/webhooks', webhookRoutes);

module.exports = app;


