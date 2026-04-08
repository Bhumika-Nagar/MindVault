import dotenv from "dotenv";
dotenv.config();
import express from "express";
import mongoose from "mongoose";
import { MongoServerError } from "mongodb";
import cors from "cors";
import mainRouter from "./routes/index";
const app= express();
app.use(express.json());
app.use(cors());

app.use("/api/v1",mainRouter);

const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;

async function startServer() {
    try {
        if (!MONGO_URI) {
            throw new Error("MONGO_URI is missing in .env");
        }

        await mongoose.connect(MONGO_URI);
        console.log("MongoDB connected");

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        if (error instanceof MongoServerError && error.code === 8000) {
            console.error("MongoDB authentication failed. Check Atlas Database Access credentials, password encoding in MONGO_URI, and Network Access allowlist.");
        }
        console.error("Server failed to start", error);
    }
}

startServer();
