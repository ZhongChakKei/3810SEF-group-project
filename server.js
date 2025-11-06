require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const formidable = require('express-formidable');
const { MongoClient, ObjectId } = require('mongodb');
const { setupPassport, isLoggedIn } = require('./auth/passport');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for production (behind reverse proxy)
app.set('trust proxy', 1);

// View engine setup
app.set('view engine', 'ejs');

// Static files middleware
app.use(express.static('public'));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'project_sample';
const COLLECTION_PLAYERS = 'players';
const COLLECTION_LINEUPS = 'lineups';

let db;

MongoClient.connect(MONGODB_URI)
  .then(client => {
    console.log('Connected to MongoDB');
    db = client.db(DB_NAME);
    
    // Setup Passport with database reference
    setupPassport(db);
    
    // Start server after DB connection
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Form parsing middleware
app.use(formidable());

// Make user available to all views
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================

// Login page
app.get('/login', (req, res) => {
  res.render('login', { message: null });
});

// Google OAuth - initiate
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth - callback
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Redirect to stored URL or default to homepage
    const next = req.session.next || '/';
    delete req.session.next;
    res.redirect(next);
  }
);

// Logout
app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/login');
  });
});

// ============================================================================
// MVC WEB ROUTES (Protected)
// ============================================================================

// Home - Show homepage
app.get('/', isLoggedIn, async (req, res) => {
  try {
    const playersCollection = db.collection('players');
    const players = await playersCollection.find({}).toArray();
    res.render('home', { user: req.user, players: players });
  } catch (err) {
    console.error('Error loading home:', err);
    res.status(500).send('Error loading home page');
  }
});

// Squad - Interactive pitch view
app.get('/squad', isLoggedIn, (req, res) => {
  handle_Find(req, res);
});

// Players - All players list
app.get('/players', isLoggedIn, async (req, res) => {
  try {
    const playersCollection = db.collection('players');
    const players = await playersCollection.find({}).toArray();
    res.render('players', { user: req.user, players: players });
  } catch (err) {
    console.error('Error loading players:', err);
    res.status(500).send('Error loading players page');
  }
});

// CREATE - Show form
app.get('/create', isLoggedIn, (req, res) => {
  res.render('create', { error: null });
});

// CREATE - Handle submission
app.post('/create', isLoggedIn, (req, res) => {
  handle_Create(req, res);
});

// FIND - List all players (keep for backward compatibility)
app.get('/find', isLoggedIn, (req, res) => {
  handle_Find(req, res);
});

// DETAILS - Show one player
app.get('/details', isLoggedIn, (req, res) => {
  handle_Details(req, res);
});

// EDIT - Show edit form
app.get('/edit', isLoggedIn, (req, res) => {
  handle_Edit(req, res);
});

// UPDATE - Handle edit submission
app.post('/update', isLoggedIn, (req, res) => {
  handle_Update(req, res);
});

// DELETE - Handle player deletion
app.post('/delete', isLoggedIn, (req, res) => {
  handle_Delete(req, res);
});

// ============================================================================
// REST API ROUTES (Public)
// ============================================================================

// GET all players (with optional filters)
app.get('/api/players', async (req, res) => {
  try {
    const { search, position } = req.query;
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } },
        { nationality: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    if (position) {
      query.position = position;
    }
    
    const players = await db.collection(COLLECTION_PLAYERS)
      .find(query)
      .toArray();
    
    res.json(players);
  } catch (err) {
    console.error('API GET /players error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET one player by ID
app.get('/api/players/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid player ID' });
    }
    
    const player = await db.collection(COLLECTION_PLAYERS)
      .findOne({ _id: new ObjectId(id) });
    
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    res.json(player);
  } catch (err) {
    console.error('API GET /players/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST - Create new player
app.post('/api/players', async (req, res) => {
  try {
    const { name, position, heightCm, dateOfBirth, nationality, squadNumber, stats, tags } = req.fields;
    
    if (!name) {
      return res.status(400).json({ error: 'Player name is required' });
    }
    
    const player = {
      name,
      position: position || 'Midfielder',
      heightCm: heightCm ? parseInt(heightCm) : null,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      nationality: nationality || '',
      squadNumber: squadNumber ? parseInt(squadNumber) : null,
      stats: {
        appearances: stats?.appearances ? parseInt(stats.appearances) : 0,
        goals: stats?.goals ? parseInt(stats.goals) : 0,
        assists: stats?.assists ? parseInt(stats.assists) : 0,
        minutes: stats?.minutes ? parseInt(stats.minutes) : 0
      },
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
      createdAt: new Date()
    };
    
    const result = await db.collection(COLLECTION_PLAYERS).insertOne(player);
    player._id = result.insertedId;
    
    res.status(201).json(player);
  } catch (err) {
    console.error('API POST /players error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT - Update player
app.put('/api/players/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid player ID' });
    }
    
    const { name, position, heightCm, dateOfBirth, nationality, squadNumber, stats, tags } = req.fields;
    
    const update = {
      $set: {
        updatedAt: new Date()
      }
    };
    
    if (name !== undefined) update.$set.name = name;
    if (position !== undefined) update.$set.position = position;
    if (heightCm !== undefined) update.$set.heightCm = parseInt(heightCm);
    if (dateOfBirth !== undefined) update.$set.dateOfBirth = new Date(dateOfBirth);
    if (nationality !== undefined) update.$set.nationality = nationality;
    if (squadNumber !== undefined) update.$set.squadNumber = parseInt(squadNumber);
    if (tags !== undefined) update.$set.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
    
    if (stats) {
      if (stats.appearances !== undefined) update.$set['stats.appearances'] = parseInt(stats.appearances);
      if (stats.goals !== undefined) update.$set['stats.goals'] = parseInt(stats.goals);
      if (stats.assists !== undefined) update.$set['stats.assists'] = parseInt(stats.assists);
      if (stats.minutes !== undefined) update.$set['stats.minutes'] = parseInt(stats.minutes);
    }
    
    const result = await db.collection(COLLECTION_PLAYERS)
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        update,
        { returnDocument: 'after' }
      );
    
    if (!result) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    res.json(result);
  } catch (err) {
    console.error('API PUT /players/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE - Remove player
app.delete('/api/players/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid player ID' });
    }
    
    const result = await db.collection(COLLECTION_PLAYERS)
      .deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    res.json({ message: 'Player deleted successfully' });
  } catch (err) {
    console.error('API DELETE /players/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// LINEUP API ROUTES (Protected)
// ============================================================================

// GET all lineups for current user
app.get('/api/lineups', isLoggedIn, async (req, res) => {
  try {
    const lineups = await db.collection(COLLECTION_LINEUPS)
      .find({ userEmail: req.user.email })
      .sort({ createdAt: -1 })
      .toArray();
    
    res.json(lineups);
  } catch (err) {
    console.error('API GET /lineups error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET one lineup by ID
app.get('/api/lineups/:id', isLoggedIn, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid lineup ID' });
    }
    
    const lineup = await db.collection(COLLECTION_LINEUPS)
      .findOne({ 
        _id: new ObjectId(id),
        userEmail: req.user.email // Only allow users to access their own lineups
      });
    
    if (!lineup) {
      return res.status(404).json({ error: 'Lineup not found' });
    }
    
    res.json(lineup);
  } catch (err) {
    console.error('API GET /lineups/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST - Create new lineup
app.post('/api/lineups', isLoggedIn, async (req, res) => {
  try {
    const { formation, positions, title } = req.body;
    
    // Validation
    if (!formation || !positions || !Array.isArray(positions)) {
      return res.status(400).json({ error: 'Formation and positions are required' });
    }
    
    if (positions.length !== 11) {
      return res.status(400).json({ error: 'Lineup must have exactly 11 players' });
    }
    
    const lineup = {
      userId: req.user._id,
      userEmail: req.user.email,
      userName: req.user.displayName || req.user.email,
      formation,
      positions,
      title: title || `Lineup ${new Date().toLocaleDateString()}`,
      createdAt: new Date()
    };
    
    const result = await db.collection(COLLECTION_LINEUPS).insertOne(lineup);
    lineup._id = result.insertedId;
    
    res.status(201).json(lineup);
  } catch (err) {
    console.error('API POST /lineups error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE - Remove lineup
app.delete('/api/lineups/:id', isLoggedIn, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid lineup ID' });
    }
    
    const result = await db.collection(COLLECTION_LINEUPS)
      .deleteOne({ 
        _id: new ObjectId(id),
        userEmail: req.user.email // Only allow users to delete their own lineups
      });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Lineup not found' });
    }
    
    res.json({ message: 'Lineup deleted successfully' });
  } catch (err) {
    console.error('API DELETE /lineups/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// HANDLER FUNCTIONS (MVC Style)
// ============================================================================

async function handle_Create(req, res) {
  try {
    const { name, position, heightCm, dateOfBirth, nationality, squadNumber, 
            appearances, goals, assists, minutes, tags } = req.fields;
    
    if (!name) {
      return res.render('create', { error: 'Player name is required' });
    }
    
    const player = {
      name,
      position: position || 'Midfielder',
      heightCm: heightCm ? parseInt(heightCm) : null,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      nationality: nationality || '',
      squadNumber: squadNumber ? parseInt(squadNumber) : null,
      stats: {
        appearances: appearances ? parseInt(appearances) : 0,
        goals: goals ? parseInt(goals) : 0,
        assists: assists ? parseInt(assists) : 0,
        minutes: minutes ? parseInt(minutes) : 0
      },
      tags: tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [],
      createdAt: new Date()
    };
    
    await db.collection(COLLECTION_PLAYERS).insertOne(player);
    res.redirect('/find');
  } catch (err) {
    console.error('handle_Create error:', err);
    res.render('create', { error: 'Failed to create player' });
  }
}

async function handle_Find(req, res) {
  try {
    const { q } = req.query;
    const query = {};
    
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { position: { $regex: q, $options: 'i' } },
        { nationality: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ];
    }
    
    const players = await db.collection(COLLECTION_PLAYERS)
      .find(query)
      .sort({ squadNumber: 1 })
      .toArray();
    
    res.render('list', { players, searchQuery: q || '' });
  } catch (err) {
    console.error('handle_Find error:', err);
    res.render('info', { message: 'Error loading players' });
  }
}

async function handle_Details(req, res) {
  try {
    const { _id } = req.query;
    
    if (!_id || !ObjectId.isValid(_id)) {
      return res.render('info', { message: 'Invalid player ID' });
    }
    
    const player = await db.collection(COLLECTION_PLAYERS)
      .findOne({ _id: new ObjectId(_id) });
    
    if (!player) {
      return res.render('info', { message: 'Player not found' });
    }
    
    res.render('details', { player });
  } catch (err) {
    console.error('handle_Details error:', err);
    res.render('info', { message: 'Error loading player details' });
  }
}

async function handle_Edit(req, res) {
  try {
    const { _id } = req.query;
    
    if (!_id || !ObjectId.isValid(_id)) {
      return res.render('info', { message: 'Invalid player ID' });
    }
    
    const player = await db.collection(COLLECTION_PLAYERS)
      .findOne({ _id: new ObjectId(_id) });
    
    if (!player) {
      return res.render('info', { message: 'Player not found' });
    }
    
    res.render('edit', { player, error: null });
  } catch (err) {
    console.error('handle_Edit error:', err);
    res.render('info', { message: 'Error loading player for editing' });
  }
}

async function handle_Update(req, res) {
  try {
    const { _id } = req.query;
    
    if (!_id || !ObjectId.isValid(_id)) {
      return res.render('info', { message: 'Invalid player ID' });
    }
    
    const { name, position, heightCm, dateOfBirth, nationality, squadNumber,
            appearances, goals, assists, minutes, tags } = req.fields;
    
    if (!name) {
      const player = await db.collection(COLLECTION_PLAYERS)
        .findOne({ _id: new ObjectId(_id) });
      return res.render('edit', { player, error: 'Player name is required' });
    }
    
    const update = {
      $set: {
        name,
        position: position || 'Midfielder',
        heightCm: heightCm ? parseInt(heightCm) : null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        nationality: nationality || '',
        squadNumber: squadNumber ? parseInt(squadNumber) : null,
        'stats.appearances': appearances ? parseInt(appearances) : 0,
        'stats.goals': goals ? parseInt(goals) : 0,
        'stats.assists': assists ? parseInt(assists) : 0,
        'stats.minutes': minutes ? parseInt(minutes) : 0,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [],
        updatedAt: new Date()
      }
    };
    
    await db.collection(COLLECTION_PLAYERS)
      .updateOne({ _id: new ObjectId(_id) }, update);
    
    res.redirect(`/details?_id=${_id}`);
  } catch (err) {
    console.error('handle_Update error:', err);
    res.render('info', { message: 'Error updating player' });
  }
}

async function handle_Delete(req, res) {
  try {
    const { _id } = req.query;
    
    if (!_id || !ObjectId.isValid(_id)) {
      return res.render('info', { message: 'Invalid player ID' });
    }
    
    const result = await db.collection(COLLECTION_PLAYERS)
      .deleteOne({ _id: new ObjectId(_id) });
    
    if (result.deletedCount === 0) {
      return res.render('info', { message: 'Player not found' });
    }
    
    res.redirect('/players');
  } catch (err) {
    console.error('handle_Delete error:', err);
    res.render('info', { message: 'Error deleting player' });
  }
}

// ============================================================================
// 404 HANDLER
// ============================================================================

app.use((req, res) => {
  res.status(404).render('info', { message: '404 - Page not found' });
});
