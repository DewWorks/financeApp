import mongoose, { Schema } from "mongoose";
import { IBankConnection } from "@/interfaces/IBankConnection";
import { PluggyItemStatus } from "@/interfaces/IBankConnection";

const BankAccountSchema = new Schema({
    accountId: { type: String, required: true },
    name: { type: String, required: true },
    number: { type: String },
    balance: { type: Number },
    currency: { type: String },
    type: { type: String },
    subtype: { type: String }
}, { _id: false });

const BankConnectionSchema = new Schema<IBankConnection>({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    provider: { type: String, enum: ['pluggy', 'belvo'], default: 'pluggy', required: true },
    itemId: { type: String, required: true, unique: true },
    status: { type: String, enum: Object.values(PluggyItemStatus), default: PluggyItemStatus.UPDATING },
    accounts: [BankAccountSchema],
    lastSyncAt: { type: Date }
}, {
    timestamps: true
});

// Evitar recompilação do modelo em Hot Reload do Next.js
export const BankConnection = mongoose.models.BankConnection || mongoose.model<IBankConnection>("BankConnection", BankConnectionSchema);
