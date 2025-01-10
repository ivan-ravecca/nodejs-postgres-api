require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());

const sanitizeInput = (input) => {
  return input.replace(/['";\-]/g, ''); // simple sanitization
};
app.use((req, res, next) => {
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeInput(req.body[key]); // very simple sanitization process, should apply to other fields as well
      }
    }
  }
  next();
});

//  DB connection configuration
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// paths CRUD
app.get('/events', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM events ORDER BY id ASC');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.post(
  '/events',
  [
    body('eventId').notEmpty().withMessage('Event ID is mandatory'),
    body('event').notEmpty().withMessage('Event object is mandatory'),
    body('timestamp').notEmpty().withMessage('Timestamp is mandatory'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { eventId, notes, event, timestamp } = req.body;
      const result = await pool.query(
        'INSERT INTO events (eventId, notes, event, timestamp) VALUES ($1, $2, $3, $4) RETURNING *',
        [eventId, notes, event, timestamp],
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
    }
  },
);

app.put(
  '/events/:id',
  [
    body('event').notEmpty().withMessage('Event object  is mandatory'),
    body('timestamp').notEmpty().withMessage('Timestamp is mandatory'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { id } = req.params;
      const { notes, timestamp, event } = req.body;
      const result = await pool.query(
        'UPDATE events SET notes = $1, timestamp=$2, event=$3 WHERE eventid = $4 RETURNING *',
        [notes, timestamp, event, id],
      );
      if (result.rows.length === 0) {
        return res.status(404).send('Event not found');
      }
      res.status(204).send();
    } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
    }
  },
);

app.delete('/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM events WHERE eventid = $1 RETURNING *',
      [id],
    );
    if (result.rows.length === 0) {
      return res.status(404).send('Event not found');
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.get('/events/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const result = await pool.query('SELECT * FROM events WHERE eventid = $1', [
      eventId,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).send('The event was not found');
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
