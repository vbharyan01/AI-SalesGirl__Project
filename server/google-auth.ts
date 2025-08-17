import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { getStorage } from './storage';

const storage = getStorage();

// Configure Google OAuth strategy only if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
    scope: ['profile', 'email']
  }, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists
    let user = await storage.getUserByGoogleId(profile.id);
    
    if (!user) {
      // Create new user if they don't exist
      const email = profile.emails?.[0]?.value;
      const username = profile.displayName || email?.split('@')[0] || `user_${Date.now()}`;
      
      user = await storage.createGoogleUser({
        googleId: profile.id,
        username,
        email: email || '',
        displayName: profile.displayName || '',
        avatar: profile.photos?.[0]?.value || ''
      });
    }
    
    return done(null, user);
  } catch (error) {
    return done(error as Error);
  }
  }));
}

// Serialize user for the session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await storage.getUserById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export default passport;


