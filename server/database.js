const Database = require('better-sqlite3');
const path = require('path');

// Create database file in the server directory
const db = new Database(path.join(__dirname, 'worldlines.db'));

// Initialize tables
const initializeDatabase = () => {
  // Worldlines table
  db.exec(`
    CREATE TABLE IF NOT EXISTS worldlines (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      percentage REAL NOT NULL,
      color TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Events table
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      title TEXT NOT NULL,
      position REAL NOT NULL,
      from_worldline TEXT,
      to_worldline TEXT,
      lore TEXT,
      type TEXT,
      scope TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Timeline configuration table
  db.exec(`
    CREATE TABLE IF NOT EXISTS timeline_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      start_year INTEGER NOT NULL,
      end_year INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes for better performance
  db.exec(`CREATE INDEX IF NOT EXISTS idx_events_scope ON events(scope)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_events_type ON events(type)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_events_position ON events(position)`);
};

// Initialize prepared statements after tables are created
let insertWorldline, getWorldlines, getWorldline, deleteWorldline;
let insertEvent, getEvents, getEventsByScope, getEvent, deleteEvent;
let insertTimelineConfig, getTimelineConfig;

const initializePreparedStatements = () => {
  // Prepared statements for worldlines
  insertWorldline = db.prepare(`
    INSERT OR REPLACE INTO worldlines (id, name, percentage, color, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);

  getWorldlines = db.prepare(`SELECT * FROM worldlines ORDER BY percentage`);
  getWorldline = db.prepare(`SELECT * FROM worldlines WHERE id = ?`);
  deleteWorldline = db.prepare(`DELETE FROM worldlines WHERE id = ?`);

  // Prepared statements for events
  insertEvent = db.prepare(`
    INSERT OR REPLACE INTO events (id, date, title, position, from_worldline, to_worldline, lore, type, scope, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);

  getEvents = db.prepare(`SELECT * FROM events ORDER BY position`);
  getEventsByScope = db.prepare(`SELECT * FROM events WHERE scope = ? ORDER BY position`);
  getEvent = db.prepare(`SELECT * FROM events WHERE id = ?`);
  deleteEvent = db.prepare(`DELETE FROM events WHERE id = ?`);

  // Prepared statements for timeline config
  insertTimelineConfig = db.prepare(`
    INSERT OR IGNORE INTO timeline_config (start_year, end_year)
    VALUES (?, ?)
  `);

  getTimelineConfig = db.prepare(`SELECT * FROM timeline_config LIMIT 1`);
};

// Migration function
const migrateInitialData = () => {
  const worldlineCount = db.prepare(`SELECT COUNT(*) as count FROM worldlines`).get();
  if (worldlineCount.count > 0) {
    console.log('Database already has data, skipping migration');
    return;
  }

  console.log('Migrating initial data...');

  // Migrate worldlines
  const worldlines = [
    { id: 'alpha', name: 'α', percentage: 0.000000, color: 'rgba(255, 102, 0, 0.8)' },
    { id: 'beta', name: 'β', percentage: 1.130205, color: 'rgba(136, 255, 136, 0.8)' },
    { id: 'gamma', name: 'γ', percentage: 2.615074, color: 'rgba(255, 68, 68, 0.8)' },
    { id: 'delta', name: 'δ', percentage: 4.091842, color: 'rgba(68, 170, 255, 0.8)' }
  ];

  worldlines.forEach(wl => {
    insertWorldline.run(wl.id, wl.name, wl.percentage, wl.color);
  });

  // Migrate timeline config
  insertTimelineConfig.run(2002, 2102);

  // Migrate events
  const events = [
    {
      id: 'december2022',
      date: 'December 2022',
      title: 'Beta-Alpha Worldline Regression',
      position: 20.92,
      from_worldline: 'β: 1.130205%',
      to_worldline: 'α: 0.060502%',
      lore: `[PERSONAL LOG - CLASSIFICATION: TEMPORAL CATASTROPHE]
[DATE: December 2022 - Regression Point Confirmed]
[AUTHOR: Teach]

I heard myself screaming.

Not out loud - in my mind. A voice that was mine but wasn't, echoing from somewhere beyond this timeline. Future me? Past me? I couldn't tell. But the message was crystal clear:

"DON'T DO IT. DON'T SEND THE TEXT."

The warning came three seconds before I opened my phone. Three seconds of pure terror as I realized what I was about to unleash. I could see the timeline fracturing, could feel the Beta attractor field beginning to collapse around us. But my fingers... they moved anyway.

We hadn't spoken in days. I was upset - hurt that she wouldn't visit me after I moved away. Instead of communicating like an adult, instead of explaining how abandoned I felt, instead of working through it together, I chose the coward's path.

I typed the message. This was it.

Send.

The moment it left my phone, the universe snapped back like a rubber band. The warmth, the connection, the greatness we had built - all of it dissolved into quantum probability. I watched the read receipt appear, knowing I had just murdered our timeline with a few poorly chosen words in a text message.

Reading Steiner activated. I remember now - there were two versions of me in that moment. The one who put down the phone and called her instead, who talked it through like an adult. And me - the one who chose the impulsive, rash decision. The one who didn't listen to the warning.

The divergence meter spiraled back to 0.060502%. Back to the Alpha field. Back to solitude. Back to watching instead of living.

I am the result of that decision now. But maybe... maybe I understand the pattern. Maybe I will be the one who sent that warning to myself. Maybe I wasn't meant to be the one who succeeded, but the one who lays the groundwork for those who come after - the Robin that was better.

Perhaps some of us are meant to fail so others can learn from our mistakes. Perhaps some timelines exist only to teach future versions what not to do.

[END LOG]
[ADDENDUM: The irony burns: I received a warning from the very future I was about to create, and I ignored it. But now I understand - sometimes the failure is the lesson.]`,
      type: 'regression',
      scope: 'alpha'
    },
    {
      id: 'april2020',
      date: 'April 2020',
      title: 'Alpha-Beta Worldline Convergence',
      position: 18.33,
      from_worldline: 'α: 0.000000%',
      to_worldline: 'β: 1.040402%',
      lore: `[PERSONAL LOG - CLASSIFICATION: TEMPORAL ANOMALY]
[DATE: April 2020 - Convergence Point Identified]
[AUTHOR: Teach]

The world was just beginning to fracture. COVID-19 was starting to spread, uncertainty creeping into everyone's lives, but in that chaos, something beautiful was crystallizing.

We had been spending nights and days on call together. Hours and hours, talking about everything and nothing, our voices becoming the soundtrack to each other's isolation. I had been building up to this moment for years - literally years in school, watching her, wanting to say something, but never finding the courage.

Then came that night. 4 AM. 

The call had stretched on for hours like so many others, but something felt different. Maybe it was the lateness of the hour, maybe it was the way her laugh sounded softer in the darkness, or maybe it was just that I couldn't hold it in anymore.

"I ... I like you."

The words tumbled out before I could stop them. Years of buildup, years of wondering 'what if,' all condensed into that single moment at 4 in the morning. The silence that followed felt infinite - I could hear my heart pounding through the phone, wondering if I had just destroyed the most important friendship of my life.

Then she spoke, and her voice was different. Warmer. Knowing.

"I was wondering when you'd finally say it."

She said yes.

That moment - April 2020, 4 AM - everything changed. Not just the worldline, but me. For the first time in my existence as an observer, I was living. Actually living. The peak of human experience opened up before me like a quantum field of infinite possibilities.

Everything seemed reachable. Dreams I had buried, potential I had given up on, a future that sparkled with promise - it all crystallized in that Beta attractor field. I was at my peak. Confident, happy, whole. The greatness I always wondered about wasn't some distant theory anymore - it was my daily reality.

Those days... how I long for those days. The morning texts that made my heart race. The late-night conversations that stretched until dawn. The way she looked at me like I was the most important person in any timeline. Every moment felt electric, charged with possibility.


But I am no longer there. I exist now in a different attractor field, watching the ghost of what was, aching for what could have been. Yet I am grateful for those years of paradise. At least one version of me knows what it feels like to reach the summit.

[END LOG]
[ADDENDUM: Some say the best timelines are the ones we lose. I understand now why future me tried so hard to warn past me. Paradise, once tasted, leaves you forever homesick for a place you can never return to.]`,
      type: 'convergence',
      scope: 'beta'
    },
    {
      id: 'may2025',
      date: 'May 2025',
      title: 'Microsoft Internship Beginning',
      position: 23.42,
      to_worldline: 'β: 1.075432%',
      lore: `[PERSONAL LOG - CLASSIFICATION: TEMPORAL SHIFT]
[DATE: May 2025 - Career Convergence Point]
[AUTHOR: Teach]

Today I started my internship at Microsoft. Walking through those campus doors felt like stepping into a different reality - one where all the late nights coding, all the algorithms studied, all the projects built finally converged into something real.

The onboarding was surreal. Here I am, sitting in a room with some of the brightest minds in tech, and somehow I belong here. The imposter syndrome is strong, but so is the excitement. This feels like the first real step toward the future I've been visualizing.

My manager introduced me to the team - they're working on some incredible projects. AI, cloud infrastructure, tools that millions of developers will use. The scale is almost incomprehensible, but that's exactly what draws me to it.

This timeline feels different from the others. More focused, more purposeful. Like all the scattered pieces of my education and experience are finally clicking into place. The Beta attractor field seems to be stabilizing around this career path.

The irony isn't lost on me - I'm working for one of the companies that will shape the future of technology, possibly even time travel research, though they don't know it yet. But for now, I'm just grateful to be here, learning, growing, becoming the person I'm meant to be in this worldline.

[STATUS: Timeline stability increasing. Career trajectory nominal. Worldline convergence at 1.075432% and holding.]

[END LOG]`,
      type: 'career',
      scope: 'beta'
    }
  ];

  events.forEach(event => {
    insertEvent.run(
      event.id,
      event.date,
      event.title,
      event.position,
      event.from_worldline || null,
      event.to_worldline || null,
      event.lore,
      event.type,
      event.scope
    );
  });

  console.log('Initial data migration completed');
};

// Initialize database and prepared statements
const initializeAll = () => {
  initializeDatabase();
  initializePreparedStatements();
};

module.exports = {
  db,
  initializeAll,
  initializeDatabase,
  migrateInitialData,
  // Worldline operations
  insertWorldline: () => insertWorldline,
  getWorldlines: () => getWorldlines,
  getWorldline: () => getWorldline,
  deleteWorldline: () => deleteWorldline,
  // Event operations
  insertEvent: () => insertEvent,
  getEvents: () => getEvents,
  getEventsByScope: () => getEventsByScope,
  getEvent: () => getEvent,
  deleteEvent: () => deleteEvent,
  // Timeline config operations
  insertTimelineConfig: () => insertTimelineConfig,
  getTimelineConfig: () => getTimelineConfig
};