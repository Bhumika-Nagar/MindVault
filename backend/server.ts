import dotenv from "dotenv";
dotenv.config();
import express from "express";
import mongoose from "mongoose";
const app= express();
app.use(express.json());

app.use("/api/v1")


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
        console.error("Server failed to start", error);
    }
}

startServer();