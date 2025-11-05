# 🚀 Quick Start Guide

## For Instructors/TAs - Fast Setup

This is a 5-minute setup guide to get the application running quickly.

### Prerequisites Check

```powershell
# Check Node.js (need v14+)
node --version

# Check MongoDB (need v4+)
mongod --version

# Check npm
npm --version
```

### Step 1: Install Dependencies (30 seconds)

```powershell
npm install
```

### Step 2: Configure Environment (1 minute)

Copy the example environment file:

```powershell
copy .env.example .env
```

Edit `.env` file - **Minimum required changes:**

```env
# Generate a random session secret (or use this test one)
SESSION_SECRET=test-secret-key-change-in-production-min32chars

# Add your Google OAuth credentials
GOOGLE_CLIENT_ID=your-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret-here
```

> **Note:** MongoDB URI defaults to `mongodb://localhost:27017` - no change needed for local MongoDB

### Step 3: Get Google OAuth Credentials (2 minutes)

**Quick method for testing:**

1. Go to: https://console.cloud.google.com/
2. Create/Select project
3. **APIs & Services > Credentials > Create Credentials > OAuth 2.0 Client ID**
4. Configure consent screen (minimal info needed)
5. Create OAuth client:
   - Type: **Web application**
   - Authorized redirect URIs: `http://localhost:3000/auth/google/callback`
6. Copy **Client ID** and **Client Secret** to `.env`

### Step 4: Start MongoDB (if not running)

**Option A - Local MongoDB:**
```powershell
mongod
```

**Option B - MongoDB Atlas (free cloud):**
- Go to https://www.mongodb.com/cloud/atlas
- Create free cluster (M0)
- Get connection string
- Update `MONGODB_URI` in `.env`

### Step 5: Seed Sample Data (optional, 10 seconds)

```powershell
npm run seed
```

This adds 10 Liverpool FC players for testing.

### Step 6: Start the Application

```powershell
npm run dev
```

Visit: **http://localhost:3000**

---

## Testing the Application

### ✅ Test Checklist (5 minutes)

1. **Authentication:**
   - [ ] Visit `http://localhost:3000` → redirects to `/login`
   - [ ] Click "Sign in with Google" → OAuth flow works
   - [ ] Successfully logged in → lands on `/find`

2. **Web Interface:**
   - [ ] View player list at `/find`
   - [ ] Search for a player (try "Salah")
   - [ ] Click "Add Player" → create a new player
   - [ ] View player details
   - [ ] Edit a player
   - [ ] Visit `/nonexistent` → 404 page

3. **REST API (use PowerShell or Postman):**

```powershell
# Get all players
curl http://localhost:3000/api/players

# Get one player (replace ID)
curl http://localhost:3000/api/players/PLAYER_ID_HERE

# Create a player
curl -X POST http://localhost:3000/api/players `
  -F "name=Test Player" `
  -F "position=Midfielder" `
  -F "squadNumber=99"

# Search players
curl "http://localhost:3000/api/players?search=Salah"
```

4. **Logout:**
   - [ ] Click logout → returns to login page

---

## Common Issues & Solutions

### Issue: "Cannot connect to MongoDB"
**Solution:** 
- Check MongoDB is running: `mongod`
- Check connection string in `.env`

### Issue: "Google OAuth error"
**Solution:**
- Verify Client ID and Secret in `.env`
- Check redirect URI matches: `http://localhost:3000/auth/google/callback`
- Make sure you're using `localhost`, not `127.0.0.1`

### Issue: "express-formidable error"
**Solution:**
- Make sure all dependencies installed: `npm install`
- Delete `node_modules` and reinstall: `rm -r node_modules; npm install`

### Issue: Port 3000 already in use
**Solution:**
- Change port in `.env`: `PORT=3001`
- Or kill the process: 
  ```powershell
  netstat -ano | findstr :3000
  taskkill /PID <PID> /F
  ```

---

## Project Features Demonstration

### 1. Google OAuth (Passport.js)
- File: `auth/passport.js`
- Strategy: GoogleStrategy
- User stored in session (serialized)
- Auto-creates user record in `users` collection

### 2. Protected Routes (isLoggedIn middleware)
- All MVC routes (`/create`, `/find`, `/edit`, etc.) require login
- REST API routes are **public** (no auth needed)
- Middleware in: `auth/passport.js`

### 3. MongoDB Driver (not Mongoose)
- Direct MongoClient usage
- Collections: `players`, `users`
- ObjectId validation for all queries

### 4. Form Handling (express-formidable)
- Middleware applied globally
- Access form data via `req.fields`
- Parses both URL-encoded and multipart forms

### 5. EJS Templates
- All views in `/views` folder
- Server-side rendering
- Embedded JavaScript syntax

### 6. REST API
- JSON responses
- Standard HTTP status codes
- CRUD operations: GET, POST, PUT, DELETE

---

## Architecture Overview

```
Request Flow:

Web Browser → Express → Session Check → Passport Auth
                ↓
          isLoggedIn middleware
                ↓
          Route handlers (MVC)
                ↓
          MongoDB queries
                ↓
          EJS templates
                ↓
          HTML Response

API Client → Express → Form Parser → REST handlers
                ↓
          MongoDB queries
                ↓
          JSON Response
```

---

## Grading Criteria Checklist

- [x] **OAuth Implementation** - Google OAuth with Passport
- [x] **Session Management** - express-session with secure config
- [x] **MongoDB Integration** - Native driver, no Mongoose
- [x] **REST API** - Full CRUD with JSON responses
- [x] **Form Handling** - express-formidable for all forms
- [x] **View Engine** - EJS templates
- [x] **Protected Routes** - isLoggedIn middleware
- [x] **Error Handling** - 404 catch-all
- [x] **Production Ready** - Trust proxy, secure cookies
- [x] **Code Structure** - Following HKMU samples
- [x] **Documentation** - Comprehensive README

---

## File Structure Reference

```
/auth
  └── passport.js          → Google OAuth config + middleware

/views
  ├── login.ejs           → Login page with Google button
  ├── list.ejs            → Player list with search
  ├── create.ejs          → Add player form
  ├── edit.ejs            → Edit player form
  ├── details.ejs         → Player details page
  └── info.ejs            → Generic info/404 page

server.js                  → Main app file
                            - Express setup
                            - MongoDB connection
                            - MVC routes (protected)
                            - REST API routes (public)
                            - 404 handler

package.json              → Dependencies
.env                      → Environment config
seed.js                   → Sample data seeder
```

---

## Testing Commands

```powershell
# Install
npm install

# Run with sample data
npm run seed
npm run dev

# Test REST API
curl http://localhost:3000/api/players
curl "http://localhost:3000/api/players?search=Salah"

# Open in browser
start http://localhost:3000
```

---

**Questions?** Check the full `README.md` for detailed documentation.

**Ready to go!** 🚀 You'll Never Walk Alone! 🔴⚽
