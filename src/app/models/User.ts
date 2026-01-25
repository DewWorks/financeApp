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
                if (!Array.isArray(value) || value.length === 0) return false;
                // Valida cada número do array
                // Import dinâmico ou uso direto se possível, mas em models mongoose com commonjs/es6 mix pode ser chato.
                // Vou assumir que o import funcionará no topo.
                return value.every(phone => {
                    // Validação básica se é string não vazia, a validação estrita será feita antes de salvar ou aqui se importarmos.
                    return typeof phone === 'string' && phone.trim().length > 0;
                });
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
        type: { type: String, enum: Object.values(IUserTypesVerification) },
        channels: [String],
        expiresAt: Date,
        verified: { type: Boolean, default: false }
    },
    subscription: {
        plan: {
            type: String,
            enum: ['FREE', 'PRO', 'MAX'],
            default: 'FREE'
        },
        status: {
            type: String,
            enum: ['ACTIVE', 'CANCELED', 'PAST_DUE', 'TRIAL'],
            default: 'ACTIVE'
        },
        providerId: String,    // Stripe Customer ID
        subscriptionId: String, // Stripe Sub ID
        expiresAt: Date
    }
});

export const User = mongoose.model<IUser>("User", UserSchema);
