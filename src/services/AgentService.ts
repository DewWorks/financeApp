import { GoogleGenerativeAI } from "@google/generative-ai";
import { getMongoClient } from "@/db/connectionDb";
import { ObjectId } from "mongodb";
import { Recommendation } from "@/app/models/Recommendation";
// import { NotificationService } from "./NotificationService"; // To be implemented in Phase 3

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

interface AgentContext {
    userId: string;
    historyProfiles: any[]; // Profiling Agent Output
    currentAnomalies: any[]; // Audit Agent Output
}

export class AgentService {

    /**
     * MAIN ORCHESTRATOR: Runs the full Agent Swarm Pipeline
     */
    static async runAgentPipeline(userId: string) {
        console.log(`[AgentService] Starting pipeline for ${userId}`);

        // 1. Profiling Agent (Analyze History)
        const profile = await this.profilingAgent(userId);
        if (!profile) return;

        // 2. Audit Agent (Detect Anomalies)
        const anomalies = await this.auditAgent(userId, profile);
        if (anomalies.length === 0) {
            console.log(`[AgentService] No anomalies detected.`);
            return;
        }

        // 3. Recommender Agent (Generate Insights)
        for (const anomaly of anomalies) {
            await this.recommenderAgent(userId, anomaly, profile);
        }
    }

    /**
     * PROFILING AGENT
     * Calculates average spending per category from last 90 days.
     */
    private static async profilingAgent(userId: string) {
        const client = await getMongoClient();
        const db = client.db('financeApp');

        // Date 90 days ago
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 90);

        const pipeline = [
            {
                $match: {
                    userId: new ObjectId(userId),
                    type: 'expense',
                    date: { $gte: startDate.toISOString().split('T')[0] } // Assuming date is string YYYY-MM-DD
                }
            },
            {
                $group: {
                    _id: "$tag", // or category
                    total: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            }
        ];

        const results = await db.collection('transactions').aggregate(pipeline).toArray();
        // Return structured profile (Average Monthly Spend)
        return results.map(r => ({
            category: r._id,
            avgMonthly: r.total / 3 // 90 days ~= 3 months
        }));
    }

    /**
     * AUDIT AGENT
     * Compares current month spending vs Profile.
     */
    private static async auditAgent(userId: string, profile: any[]) {
        const client = await getMongoClient();
        const db = client.db('financeApp');

        // Current Month Start
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

        const pipeline = [
            {
                $match: {
                    userId: new ObjectId(userId),
                    type: 'expense',
                    date: { $gte: startOfMonth }
                }
            },
            {
                $group: {
                    _id: "$tag",
                    currentTotal: { $sum: "$amount" }
                }
            }
        ];

        const currentSpending = await db.collection('transactions').aggregate(pipeline).toArray();
        const anomalies: any[] = [];

        for (const curr of currentSpending) {
            const baseline = profile.find(p => p.category === curr._id);
            if (!baseline) continue; // No history to compare

            // TRIGGER: If current spend > 1.2x Average (20% deviation) AND absolute > 100
            if (curr.currentTotal > (baseline.avgMonthly * 1.2) && curr.currentTotal > 100) {
                anomalies.push({
                    category: curr._id,
                    spent: curr.currentTotal,
                    average: baseline.avgMonthly,
                    excess: curr.currentTotal - baseline.avgMonthly
                });
            }
        }

        return anomalies;
    }

    /**
     * RECOMMENDER AGENT (GenAI)
     * Generates the advice text.
     */
    private static async recommenderAgent(userId: string, anomaly: any, profile: any[]) {
        // Anti-Spam Check: Don't generate if we already have a PENDING alert for this category today
        const client = await getMongoClient(); // Ensure we have client access if using Mongoose static
        // Alternatively use Mongoose logic if connected:
        // const existing = await Recommendation.findOne(...)

        const prompt = `
        Role: Intelligent Financial Assistant.
        Task: Create a short, actionable recommendation for a user who is overspending.
        
        Context:
        - Category: ${anomaly.category}
        - Normal Average: R$ ${anomaly.average.toFixed(2)}
        - Current Spend: R$ ${anomaly.spent.toFixed(2)}
        - Excess: R$ ${anomaly.excess.toFixed(2)}
        
        Requirements:
        1. Title: Short and urgent (e.g., "High Food Spending").
        2. Message: Fact-based explanation (e.g., "You spent 30% more than usual...").
        3. Step: One concrete action to save money next week.
        4. Impact: Estimate savings (conservative).
        5. Explanation: Detailed reasoning for the "Why?" modal.
        6. Language: Portuguese (Brazil).
        
        Output JSON:
        { "title": "", "message": "", "actionableStep": "", "impactEstimate": 0, "explanation": "" }
        `;

        try {
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            const jsonText = text.replace(/```json/g, "").replace(/```/g, "").trim();
            const advice = JSON.parse(jsonText);

            // Save to DB
            await Recommendation.create({
                userId: new ObjectId(userId),
                type: 'SPENDING_ALERT',
                category: anomaly.category,
                title: advice.title,
                message: advice.message,
                actionableStep: advice.actionableStep,
                impactEstimate: advice.impactEstimate,
                explanation: advice.explanation,
                status: 'PENDING'
            });

            console.log(`[AgentService] Saved recommendation for ${anomaly.category}`);

            // Phase 3: Trigger NotificationAgent here

        } catch (error) {
            console.error("[AgentService] AI Generation failed:", error);
        }
    }
}
