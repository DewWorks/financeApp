import { User } from "@/app/models/User";
import { getMongoClient } from "@/db/connectionDb";
import connectToDatabase from "@/lib/mongoose";
import { ObjectId } from "mongodb";
import { IUser, PlanType } from "@/interfaces/IUser";

// Intent Types for cleaner validation
export type PlanIntent =
    | 'CREATE_TRANSACTION'
    | 'CONNECT_BANK'
    | 'USE_WHATSAPP'
    | 'USE_DEEP_INSIGHTS';

// Errors
export class PlanRestrictionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "PlanRestrictionError";
    }
}

// Hierarchy Definition
const PLAN_LEVELS: Record<PlanType, number> = {
    [PlanType.FREE]: 0,
    [PlanType.PRO]: 1,
    [PlanType.MAX]: 2
};

const TRANSACTION_LIMIT_FREE = 200;

export class PlanService {

    /**
     * Unified Validation Method.
     * Delegates to specific validators based on intent.
     * Throws PlanRestrictionError if not allowed.
     */
    static async validate(userId: string | ObjectId, intent: PlanIntent): Promise<void> {
        await connectToDatabase();
        const user = await User.findById(userId).select('subscription.plan').lean() as unknown as IUser;
        if (!user) throw new Error("User not found");

        const userPlan = (user.subscription?.plan as PlanType) || PlanType.FREE;
        const level = PLAN_LEVELS[userPlan];

        switch (intent) {
            case 'CREATE_TRANSACTION':
                await this.validateCreateTransaction(userId, level);
                break;
            case 'CONNECT_BANK':
                this.validateConnectBank(level);
                break;
            case 'USE_WHATSAPP':
                this.validateUseWhatsapp(level);
                break;
            case 'USE_DEEP_INSIGHTS':
                this.validateUseDeepInsights(level);
                break;
            default:
                throw new Error(`Intent ${intent} validation not implemented`);
        }
    }

    // --- Specific Validators ---

    private static async validateCreateTransaction(userId: string | ObjectId, level: number): Promise<void> {
        // Free users (Level 0) are limited. Pro+ (Level 1+) are unlimited.
        if (level === 0) {
            const isOverLimit = await this.isOverTransactionLimit(userId);
            if (isOverLimit) {
                throw new PlanRestrictionError(
                    `Limite de ${TRANSACTION_LIMIT_FREE} transações atingido no plano FREE. Faça upgrade para continuar.`
                );
            }
        }
    }

    private static validateConnectBank(level: number): void {
        // Only MAX (Level 2)
        if (level < 2) {
            throw new PlanRestrictionError("Conexão Bancária (Open Finance) disponível apenas no plano MAX.");
        }
    }

    private static validateUseWhatsapp(level: number): void {
        // Only PRO+ (Level 1+)
        if (level < 1) {
            throw new PlanRestrictionError("Bot de WhatsApp disponível apenas no plano PRO ou superior.");
        }
    }

    private static validateUseDeepInsights(level: number): void {
        // Only MAX (Level 2) for Deep Analysis
        if (level < 2) {
            throw new PlanRestrictionError("Insights Profundos disponíveis apenas no plano MAX.");
        }
    }

    // --- Helpers ---

    /**
     * Optimized Check: Does the 201st transaction exist?
     * Uses skip() instead of countDocuments() to satisfy "less costly than counting all".
     */
    private static async isOverTransactionLimit(userId: string | ObjectId): Promise<boolean> {
        const client = await getMongoClient();
        const db = client.db("financeApp");

        // We check if there are MORE than the limit.
        // If we find 1 document after skipping 200, it means they have at least 201.
        // This is O(offset + limit) = O(200 + 1) -> Very fast constant time.
        const cursor = db.collection('transactions')
            .find({ userId: new ObjectId(userId) })
            .project({ _id: 1 }) // Fetch only ID
            .skip(TRANSACTION_LIMIT_FREE)
            .limit(1);

        const hasMore = await cursor.hasNext();
        return hasMore; // If true, they have > 200 items.
    }

    // Helper for Frontend/API to get status without throwing
    static async getPermissions(userId: string | ObjectId) {
        await connectToDatabase();
        const user = await User.findById(userId).select('subscription').lean() as unknown as IUser;
        const plan = (user?.subscription?.plan as PlanType) || PlanType.FREE;
        const level = PLAN_LEVELS[plan];

        return {
            plan,
            canConnectBank: level >= 2,
            canUseWhatsapp: level >= 1,
            isTransactionUnlimited: level >= 1
        };
    }
}
