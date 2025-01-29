import { ITransaction } from "@/interfaces/ITransaction";
import mongoose, { Schema, Document, ObjectId } from "mongoose";

const TransactionSchema = new Schema<ITransaction>({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["income", "expense"], required: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: String, required: true },
    tag: { type: String, required: true }
});

export const Transaction = mongoose.model<ITransaction>("Transaction", TransactionSchema);
