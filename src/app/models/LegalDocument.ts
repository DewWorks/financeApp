
import mongoose, { Schema, Document } from "mongoose";

export interface ILegalDocument extends Document {
    slug: string; // e.g., 'terms-of-use'
    title: string;
    content: string; // Markdown
    version: string;
    isActive: boolean;
    updatedAt: Date;
}

const LegalDocumentSchema = new Schema<ILegalDocument>({
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    version: { type: String, default: "1.0" },
    isActive: { type: Boolean, default: true },
    updatedAt: { type: Date, default: Date.now }
});

export const LegalDocument = mongoose.models.LegalDocument || mongoose.model<ILegalDocument>("LegalDocument", LegalDocumentSchema);
