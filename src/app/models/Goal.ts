import { IGoal } from "@/interfaces/IGoal";
import mongoose, { Schema } from "mongoose";

const GoalSchema = new Schema<IGoal>({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    targetAmount: { type: Number, required: true },
    currentAmount: { type: Number, required: true }, // For savings: accumulates. For spending: actual spent (calculated dynamically or cached)
    tag: { type: String, required: true }, // Can serve as Category

    // New Fields for Unified System
    type: {
        type: String,
        enum: ['savings', 'spending'],
        default: 'savings',
        required: true
    },
    // Optional: Date range or recurrence
    period: {
        type: String,
        enum: ['monthly', 'yearly', 'once'],
        default: 'once'
    }
});

export const Goal = mongoose.model<IGoal>("Goal", GoalSchema);
