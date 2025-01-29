import { IGoal } from "@/interfaces/IGoal";
import mongoose, { Schema, Document, ObjectId } from "mongoose";

const GoalSchema = new Schema<IGoal>({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    targetAmount: { type: Number, required: true },
    currentAmount: { type: Number, required: true },
    tag: { type: String, required: true }
});

export const Goal = mongoose.model<IGoal>("Goal", GoalSchema);
