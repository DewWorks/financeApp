import { IUser } from "@/interfaces/IUser";
import mongoose, { Schema } from "mongoose";

const UserSchema = new Schema<IUser>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    cel: String,
    address: String,
    cpf: String,
    tutorialGuide: { type: Boolean, default: true }, 
    executeQuery: { type: Boolean, default: false }
});

export const User = mongoose.model<IUser>("User", UserSchema);
