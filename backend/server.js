require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

app.use(cors({ 
  origin: function(origin, callback) {
    const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://192.168.56.1:3001', 'http://192.168.56.1:3002'];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true 
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const routes = [
  { path: '/api/auth',        file: './routes/auth' },
  { path: '/api/parcels',     file: './routes/parcels' },
  { path: '/api/transfers',   file: './routes/transfers' },
  { path: '/api/loans',       file: './routes/loans' },
  { path: '/api/inheritance', file: './routes/inheritance' },
  { path: '/api/documents',   file: './routes/documents' },
  { path: '/api/dashboard',   file: './routes/dashboard' },
];

for (const route of routes) {
  try {
    const handler = require(route.file);
    if (typeof handler !== 'function') {
      console.error(`❌ BAD EXPORT in ${route.file} — got: ${typeof handler}`);
      process.exit(1);
    }
    app.use(route.path, handler);
    console.log(`✅ Loaded: ${route.path}`);
  } catch (err) {
    console.error(`❌ ERROR loading ${route.file}:`, err.message);
    process.exit(1);
  }
}

app.get('/', (req, res) => res.json({ status: 'BhoomiLedger API running ✅' }));

const PORT = process.env.PORT || 3001;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
