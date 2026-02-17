import mongoose,{Schema,Types} from "mongoose";
import { hash } from "node:crypto";
import { string } from "zod";

export interface ContentDocument{
  link:string;
  type:"image"|"video"|"article"|"audio"|"tweet";
  title:string;
  userId: Types.ObjectId;
  tags:Types.ObjectId[];
}

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
  title: { type: String, required: true },
  userId:{
    type:Schema.Types.ObjectId,
    ref:"User",
    required:true,
  },
  tags:[{
    type:Schema.Types.ObjectId,
    ref:"Tag",
    default:[],
  },
],
  
});

export const User = mongoose.model("User", userSchema);
export const Tag = mongoose.model("Tag", tagSchema);
export const Content = mongoose.model("Content", contentSchema);
export const Link= mongoose.model("Link",linkSchema);