// src/routes/task.routes.js
const express = require('express');
const router = express.Router();

// You'll add your task-related routes here later
router.get('/', (req, res) => res.send('Task routes working!'));

module.exports = router;