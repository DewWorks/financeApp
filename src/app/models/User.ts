import { IUser, IUserTypesVerification } from "@/interfaces/IUser";
import mongoose, { Schema } from "mongoose";

const UserSchema = new Schema<IUser>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    cel: {
        type: [String],
        required: true,
        validate: {
            validator: function (value: string[]) {
                return Array.isArray(value) && value.length > 0;
            },
            message: 'Pelo menos um número de celular é obrigatório',
        },
    },
    address: String,
    cpf: String,
    tutorialGuide: { type: Boolean, default: true }, 
    executeQuery: { type: Boolean, default: false },
    verification: {
        code: String,
        type: { type: IUserTypesVerification }, // 'reset-password' | 'verify-number' | 'mfa-login'
        channels: [String],
        expiresAt: Date,
        verified: { type: Boolean, default: false }
    }
});

export const User = mongoose.model<IUser>("User", UserSchema);
