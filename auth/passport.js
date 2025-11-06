const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// Passport setup function - call this with db reference
function setupPassport(db) {
  const usersCollection = db.collection('users');

  // Configure Google OAuth Strategy
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  async function(accessToken, refreshToken, profile, done) {
    try {
      // Extract user info from Google profile
      const googleId = profile.id;
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
      const displayName = profile.displayName || 'Google User';
      const avatarUrl = profile.photos && profile.photos[0] ? profile.photos[0].value : null;

      // Upsert user in database
      const result = await usersCollection.findOneAndUpdate(
        { providerId: googleId },
        {
          $set: {
            provider: 'google',
            providerId: googleId,
            email: email,
            displayName: displayName,
            avatarUrl: avatarUrl,
            lastLogin: new Date()
          },
          $setOnInsert: {
            createdAt: new Date()
          }
        },
        {
          upsert: true,
          returnDocument: 'after'
        }
      );

      // Get the user document - handle both old and new MongoDB driver formats
      let user = result.value || result;
      
      // If still null, fetch the user directly
      if (!user || !user._id) {
        user = await usersCollection.findOne({ providerId: googleId });
      }
      
      if (!user) {
        return done(new Error('Failed to create or find user'), null);
      }
      
      // Return minimal user object
      return done(null, {
        _id: user._id.toString(),
        displayName: user.displayName,
        email: user.email,
        avatarUrl: user.avatarUrl
      });
    } catch (err) {
      return done(err, null);
    }
  }));

  // Serialize user to session (store minimal info)
  passport.serializeUser(function(user, done) {
    done(null, user);
  });

  // Deserialize user from session
  passport.deserializeUser(function(user, done) {
    done(null, user);
  });
}

// Middleware to check if user is authenticated
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  // Store the original URL to redirect after login
  req.session.next = req.originalUrl;
  res.redirect('/login');
}

module.exports = { setupPassport, isLoggedIn };
