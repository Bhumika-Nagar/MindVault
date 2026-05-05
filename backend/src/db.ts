import mongoose, { HydratedDocument, Model, Schema, Types } from "mongoose";

export type ContentType = "image" | "video" | "article" | "audio";
export type ContentStatus = "pending" | "processing" | "completed" | "failed";
export type ContentSourceType = "youtube" | "article" | "audio" | "generic";

export interface ContentDocument {
  link: string;
  type: ContentType;
  title: string;
  content: string;
  summary: string;
  status: ContentStatus;
  sourceType: ContentSourceType;
  metadata: Record<string, unknown>;
  userId?: Types.ObjectId;
  tags: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export type ContentModelDocument = HydratedDocument<ContentDocument>;

const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const tagSchema = new Schema({
  title: { type: String, required: false, unique: true }
});

const linkSchema= new Schema({
  hash:String,
  userId:{type:mongoose.Types.ObjectId, ref:'User',required:true}
})

const contentSchema = new Schema<ContentDocument>({
  link: { type: String, required: true },

  type: {
    type: String,
    enum: ["image", "video", "article", "audio"],
    required: true
  },
  title: { type: String, required: true, default: "Untitled" },

  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },

  tags: [{
    type: Schema.Types.ObjectId,
    ref: "Tag",
    default: [],
  }],

  content: { type: String, default: "" },

  summary: { type: String, default: "" },

  sourceType: {
    type: String,
    enum: ["youtube", "article", "audio", "generic"],
    default: "generic",
  },

  status: {
    type: String,
    enum: ["pending", "processing", "completed", "failed"],
    default: "pending",
  },

  metadata: {
    type: Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

contentSchema.index({ link: 1 }, { unique: true });

export const User = mongoose.model("User", userSchema);
export const Tag = mongoose.model("Tag", tagSchema);
export const Content = mongoose.model<ContentDocument, Model<ContentDocument>>("Content", contentSchema);
export const Link = mongoose.model("Link", linkSchema);

export const ensureDatabaseConnection = async (): Promise<typeof mongoose> => {
  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    return mongoose;
  }

  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI is missing.");
  }

  return mongoose.connect(mongoUri);
};
