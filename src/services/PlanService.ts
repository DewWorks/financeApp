import { User } from "@/app/models/User";
import { getMongoClient } from "@/db/connectionDb";
import { ObjectId } from "mongodb";
import { PlanType } from "@/interfaces/IUser";

type FeatureKey = 'WHATSAPP_BOT' | 'OPEN_FINANCE' | 'DEEP_INSIGHTS' | 'UNLIMITED_TRANSACTIONS';

// Hierarchy Definition: Free < Pro < Max
const PLAN_LEVELS: Record<PlanType, number> = {
    [PlanType.FREE]: 0,
    [PlanType.PRO]: 1,
    [PlanType.MAX]: 2
};

const FEATURE_REQUIREMENTS: Record<FeatureKey, number> = {
    'WHATSAPP_BOT': 1,         // Requires Pro (1) or higher
    'UNLIMITED_TRANSACTIONS': 1, // Requires Pro (1) or higher
    'DEEP_INSIGHTS': 1,        // Requires Pro (1) or higher (Basic), MAX for full but let's stick to Pro for access
    'OPEN_FINANCE': 2          // Requires Max (2)
};

const TRANSACTION_LIMIT_FREE = 200;

export class PlanService {

    /**
     * Checks if a user has permission to use a specific feature based on their plan hierarchy.
     * @param userId The User ID
     * @param feature The feature to check
     * @returns true if allowed
     */
    static async canUseFeature(userId: string | ObjectId, feature: FeatureKey): Promise<boolean> {
        const user = await User.findById(userId).select('subscription.plan').lean();

        if (!user || !user.subscription) return false; // Default to blocked if no data

        const userPlan = (user.subscription.plan as PlanType) || PlanType.FREE;
        const userLevel = PLAN_LEVELS[userPlan];
        const requiredLevel = FEATURE_REQUIREMENTS[feature];

        return userLevel >= requiredLevel;
    }

    /**
     * Checks if the user can add a new transaction.
     * Returns true if allowed, or throws error if limit reached.
     */
    static async checkTransactionLimit(userId: string | ObjectId): Promise<boolean> {
        const user = await User.findById(userId).select('subscription.plan').lean();
        const userPlan = (user?.subscription?.plan as PlanType) || PlanType.FREE;

        // If Pro or Max, unlimited
        if (PLAN_LEVELS[userPlan] >= PLAN_LEVELS[PlanType.PRO]) {
            return true;
        }

        // If Free, check count
        // We use a raw count for performance
        const client = await getMongoClient();
        const db = client.db("financeApp");

        // Count transactions for current month? Or total? 
        // Roadmap says "200/mês". Let's filter by current month.
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const count = await db.collection('transactions').countDocuments({
            userId: new ObjectId(userId),
            date: { $gte: startOfMonth }
        });

        if (count >= TRANSACTION_LIMIT_FREE) {
            return false;
        }

        return true;
    }

    /**
     * Helper to get strict plan details
     */
    static async getSubscriptionDetails(userId: string | ObjectId) {
        const user = await User.findById(userId).select('subscription').lean();
        if (!user) throw new Error("User not found");

        return {
            plan: (user.subscription?.plan as PlanType) || PlanType.FREE,
            status: user.subscription?.status || 'ACTIVE',
            isProOrAbove: (PLAN_LEVELS[(user.subscription?.plan as PlanType) || PlanType.FREE]) >= PLAN_LEVELS[PlanType.PRO]
        };
    }
}
