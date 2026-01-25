import { ObjectId } from "mongodb";

export interface IUser {
    _id: ObjectId;
    name: string;
    email: string;
    password: string;
    cel?: string[];
    address?: string;
    cpf?: string;
    tutorialGuide?: boolean;
    executeQuery?: boolean;
    verification?: IUserVerification;
    subscription?: ISubscription;
    updatedAt?: Date;
    createdAt: Date;
}

export enum PlanType {
    FREE = 'FREE',
    PRO = 'PRO',
    MAX = 'MAX'
}

export interface ISubscription {
    plan: PlanType;
    status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'TRIAL';
    providerId?: string;
    subscriptionId?: string;
    expiresAt?: Date;
}

export interface IUserVerification {
    code: string
    type: IUserTypesVerification
    channels: ('email' | 'whatsapp')[]
    expiresAt: Date
    verified: boolean
}

export enum IUserTypesVerification {
    'reset-password',
    'verify-number',
    'mfa-login'
}
