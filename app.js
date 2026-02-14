const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

// Import routes
const postsRoutes = require('./routes/posts');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Ensure posts directory exists
const postsDir = path.join(__dirname, 'posts');
if (!fs.existsSync(postsDir)) {
    fs.mkdirSync(postsDir, { recursive: true });
}

// Set up view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Custom middleware to add current date to all requests
app.use((req, res, next) => {
    res.locals.currentYear = new Date().getFullYear();
    next();
});

// Routes
app.use('/', postsRoutes);

// 404 Error Handler
app.use((req, res, next) => {
    res.status(404).render('error', {
        title: '404 - Page Not Found',
        message: 'The page you are looking for does not exist.',
        error: { status: 404 }
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).render('error', {
        title: 'Error',
        message: err.message || 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Blog server is running at http://localhost:${PORT}`);
    console.log(`📁 Posts are stored in: ${postsDir}`);
});

module.exports = app;