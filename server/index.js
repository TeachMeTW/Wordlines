const express = require('express');
const cors = require('cors');
const {
  initializeAll,
  migrateInitialData,
  // Worldline operations
  insertWorldline,
  getWorldlines,
  getWorldline,
  deleteWorldline,
  // Event operations
  insertEvent,
  getEvents,
  getEventsByScope,
  getEvent,
  deleteEvent,
  // Timeline config operations
  getTimelineConfig
} = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database and prepared statements
initializeAll();
migrateInitialData();

// Timeline data endpoints (obscured paths)
app.get('/api/temporal-fields', (req, res) => {
  try {
    const worldlines = getWorldlines().all();
    res.json(worldlines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/temporal-fields/:id', (req, res) => {
  try {
    const worldline = getWorldline().get(req.params.id);
    if (!worldline) {
      return res.status(404).json({ error: 'Worldline not found' });
    }
    res.json(worldline);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/temporal-fields', (req, res) => {
  try {
    const { id, name, percentage, color } = req.body;
    if (!id || !name || percentage === undefined || !color) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    insertWorldline().run(id, name, percentage, color);
    const worldline = getWorldline().get(id);
    res.status(201).json(worldline);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/temporal-fields/:id', (req, res) => {
  try {
    const { name, percentage, color } = req.body;
    const id = req.params.id;
    
    // Check if worldline exists
    const existing = getWorldline().get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Worldline not found' });
    }
    
    insertWorldline().run(
      id,
      name !== undefined ? name : existing.name,
      percentage !== undefined ? percentage : existing.percentage,
      color !== undefined ? color : existing.color
    );
    
    const worldline = getWorldline().get(id);
    res.json(worldline);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/temporal-fields/:id', (req, res) => {
  try {
    const worldline = getWorldline().get(req.params.id);
    if (!worldline) {
      return res.status(404).json({ error: 'Worldline not found' });
    }
    
    deleteWorldline().run(req.params.id);
    res.json({ message: 'Worldline deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Event endpoints
app.get('/api/temporal-events', (req, res) => {
  try {
    const { scope } = req.query;
    const events = scope ? getEventsByScope().all(scope) : getEvents().all();
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/temporal-events/:id', (req, res) => {
  try {
    const event = getEvent().get(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/temporal-events', (req, res) => {
  try {
    const { id, date, title, position, from_worldline, to_worldline, lore, type, scope } = req.body;
    if (!id || !date || !title || position === undefined || !scope) {
      return res.status(400).json({ error: 'Missing required fields: id, date, title, position, scope' });
    }
    
    insertEvent().run(id, date, title, position, from_worldline || null, to_worldline || null, lore || null, type || null, scope);
    const event = getEvent().get(id);
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/temporal-events/:id', (req, res) => {
  try {
    const { date, title, position, from_worldline, to_worldline, lore, type, scope } = req.body;
    const id = req.params.id;
    
    // Check if event exists
    const existing = getEvent().get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    insertEvent().run(
      id,
      date !== undefined ? date : existing.date,
      title !== undefined ? title : existing.title,
      position !== undefined ? position : existing.position,
      from_worldline !== undefined ? from_worldline : existing.from_worldline,
      to_worldline !== undefined ? to_worldline : existing.to_worldline,
      lore !== undefined ? lore : existing.lore,
      type !== undefined ? type : existing.type,
      scope !== undefined ? scope : existing.scope
    );
    
    const event = getEvent().get(id);
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/temporal-events/:id', (req, res) => {
  try {
    const event = getEvent().get(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    deleteEvent().run(req.params.id);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Timeline config endpoint
app.get('/api/temporal-config', (req, res) => {
  try {
    const config = getTimelineConfig().get();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/status', (req, res) => {
  res.json({ status: 'OK', message: 'Worldlines API is running' });
});

app.listen(PORT, () => {
  console.log(`Worldlines API server running on port ${PORT}`);
});