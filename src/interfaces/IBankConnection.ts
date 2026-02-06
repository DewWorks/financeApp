import { ObjectId } from "mongodb";

export interface IBankConnection {
    _id?: ObjectId;
    userId: ObjectId;
    provider: 'pluggy' | 'belvo';
    itemId: string; // ID da conexão na Pluggy
    status: PluggyItemStatus;
    accounts: IBankAccount[];
    lastSyncAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface IBankAccount {
    accountId: string; // ID da conta dentro do banco (Pluggy ID)
    name: string; // "Conta Corrente", "Nubank"
    number: string;
    balance: number;
    currency: string;
    type: string; // 'CHECKING_ACCOUNT', 'CREDIT_CARD', etc.
    subtype?: string;
}

export enum PluggyItemStatus {
    UPDATED = 'UPDATED',
    UPDATING = 'UPDATING',
    WAITING_USER_INPUT = 'WAITING_USER_INPUT',
    WAITING_USER_ACTION = 'WAITING_USER_ACTION',
    LOGIN_ERROR = 'LOGIN_ERROR',
    LOGIN_REQUIRED = 'LOGIN_REQUIRED', // Deprecated but might appear in older items or errors
    OUTDATED = 'OUTDATED',
    Merging = 'MERGING' // PascalCase in some docs, usually UPPER in API, safe to add if needed, but sticking to observed ones
}
