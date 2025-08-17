import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const mongoUrl = process.env.MONGO_URL || process.env.MONGODB_URI || "";

let isConnected = false;

export async function connectMongo(): Promise<typeof mongoose> {
  console.log("MongoDB connection attempt - URL:", mongoUrl);
  console.log("MongoDB connection attempt - DB Name:", process.env.MONGO_DB_NAME);
  
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log("MongoDB already connected");
    return mongoose;
  }
  
  if (!mongoUrl) {
    console.error("No MongoDB URL provided");
    throw new Error("MONGO_URL/MONGODB_URI must be set to use Mongo storage");
  }
  
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUrl, {
      dbName: process.env.MONGO_DB_NAME || undefined,
    });
    console.log("MongoDB connected successfully");
    isConnected = true;
    return mongoose;
  } catch (error) {
    console.error("MongoDB connection error:", error);
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


