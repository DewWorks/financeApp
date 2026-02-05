import mongoose, { Schema, Document } from "mongoose";

export interface IAuditLog extends Document {
    action: string;
    userId?: string;
    details: any;
    ip?: string;
    userAgent?: string;
    createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
    action: { type: String, required: true, index: true },
    userId: { type: String, index: true },
    details: { type: Schema.Types.Mixed },
    ip: String,
    userAgent: String,
    createdAt: { type: Date, default: Date.now, expires: '365d' } // Auto-delete after 1 year
});

export const AuditLog = mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
