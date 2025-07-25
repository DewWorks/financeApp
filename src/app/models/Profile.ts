import { IProfile } from "@/interfaces/IProfile";
import mongoose, { Schema } from "mongoose";

const ProfileSchema = new Schema<IProfile>({
    name: { type: String, required: true },
    type: { type: String, enum: ["SHARED"], required: true },
    members: [
        {
            userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
            permission: {
                type: String,
                enum: ["ADMIN", "COLABORATOR", "VIEWER"],
                default: "COLABORATOR"
            }
        }
    ],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

export const Profile = mongoose.model<IProfile>("Profile", ProfileSchema);
