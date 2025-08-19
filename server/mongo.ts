import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

// Get MongoDB connection URL with fallbacks
const getMongoUrl = () => {
  // Priority order: VERCEL_MONGO_URL > MONGO_URL > MONGODB_URI > localhost fallback
  const mongoUrl = process.env.VERCEL_MONGO_URL || process.env.MONGO_URL || process.env.MONGODB_URI;
  
  if (mongoUrl) {
    return mongoUrl;
  }
  
  // Fallback to localhost for development
  if (process.env.NODE_ENV === 'development') {
    return 'mongodb://localhost:27017';
  }
  
  throw new Error("VERCEL_MONGO_URL, MONGO_URL, or MONGODB_URI must be set for production");
};

const mongoUrl = getMongoUrl();
const dbName = process.env.VERCEL_MONGO_DB_NAME || process.env.MONGO_DB_NAME || 'ai_sales_girl';

let isConnected = false;

export async function connectMongo(): Promise<typeof mongoose> {
  console.log("MongoDB connection attempt - URL:", mongoUrl);
  console.log("MongoDB connection attempt - DB Name:", dbName);
  console.log("MongoDB connection attempt - Environment:", process.env.NODE_ENV);
  
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log("MongoDB already connected");
    return mongoose;
  }
  
  try {
    console.log("Connecting to MongoDB...");
    
    // Connection options
    const options = {
      dbName: dbName,
      // Connection pooling
      maxPoolSize: 10,
      minPoolSize: 1,
      // Timeout settings
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      // Retry settings
      retryWrites: true,
      w: 'majority',
      // SSL settings for Atlas
      ssl: mongoUrl.includes('mongodb+srv://'),
      // Authentication
      authSource: 'admin',
    };
    
    await mongoose.connect(mongoUrl, options);
    console.log("MongoDB connected successfully");
    isConnected = true;
    
    // Handle connection events
    mongoose.connection.on('error', (error) => {
      console.error('MongoDB connection error:', error);
      isConnected = false;
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      isConnected = false;
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
      isConnected = true;
    });
    
    return mongoose;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    isConnected = false;
    
    // Provide helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('ENOTFOUND')) {
        console.error("DNS resolution failed. Check your MongoDB connection string.");
        console.error("For local development, ensure MongoDB is running: brew services start mongodb-community");
        console.error("For production, verify your MongoDB Atlas connection string.");
      } else if (error.message.includes('ECONNREFUSED')) {
        console.error("Connection refused. Check if MongoDB is running on the specified port.");
      } else if (error.message.includes('Authentication failed')) {
        console.error("Authentication failed. Check your username and password.");
      }
    }
    
    throw error;
  }
}

// User
const UserSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: false }, // Optional for Google OAuth users
    googleId: { type: String, unique: true, sparse: true, index: true }, // Google OAuth ID
    email: { type: String, required: false }, // Email from Google
    displayName: { type: String, required: false }, // Display name from Google
    avatar: { type: String, required: false }, // Avatar URL from Google
    authMethod: { type: String, enum: ['local', 'google'], default: 'local' }, // Authentication method
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

export type MongoUser = InferSchemaType<typeof UserSchema> & { _id: any };

// UserSettings
const UserSettingsSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true, required: true },
    vapiPrivateKey: { type: String },
    assistantId: { type: String },
    phoneNumberId: { type: String },
    defaultCustomerNumber: { type: String },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

export type MongoUserSettings = InferSchemaType<typeof UserSettingsSchema> & { _id: any };

// Session (DB-backed session tokens)
const SessionSchema = new Schema(
  {
    token: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true, required: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
  },
  { versionKey: false }
);

export type MongoSession = InferSchemaType<typeof SessionSchema> & { _id: any };

// Call records (to mirror existing Postgres calls table)
const CallSchema = new Schema(
  {
    name: { type: String, required: true },
    company: { type: String },
    email: { type: String },
    phone: { type: String },
    status: { type: String, required: true },
    notes: { type: String },
    recording_url: { type: String },
    timestamp: { type: Date, default: Date.now },
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
  },
  { versionKey: false }
);

export type MongoCall = InferSchemaType<typeof CallSchema> & { _id: any };

export const UserModel: Model<MongoUser> = mongoose.models.User || mongoose.model("User", UserSchema);
export const UserSettingsModel: Model<MongoUserSettings> =
  mongoose.models.UserSettings || mongoose.model("UserSettings", UserSettingsSchema);
export const SessionModel: Model<MongoSession> = mongoose.models.Session || mongoose.model("Session", SessionSchema);
export const CallModel: Model<MongoCall> = mongoose.models.Call || mongoose.model("Call", CallSchema);


