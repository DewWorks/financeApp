import { AuditLog } from "@/app/models/AuditLog";
import { getMongoClient } from "@/db/connectionDb";

export class AuditService {
    /**
     * Logs a security or critical business action.
     * @param action Name of the action (e.g., 'LOGIN_SUCCESS', 'DATA_EXPORT')
     * @param userId The user ID demonstrating who performed the action (optional)
     * @param details detailed object (e.g., changed fields, reason)
     * @param req Optional Request object to extract IP/UA
     */
    static async log(action: string, userId: string | undefined, details: any = {}, req?: Request) {
        try {
            let ip = 'unknown';
            let userAgent = 'unknown';

            if (req) {
                ip = req.headers.get("x-forwarded-for") || 'unknown';
                userAgent = req.headers.get("user-agent") || 'unknown';
            }

            // Using Mongoose Model if connected, or direct DB insert if preferred.
            // Since we usually use Mongoose models in this project for consistency:
            await AuditLog.create({
                action,
                userId,
                details,
                ip,
                userAgent
            });

            console.log(`[AUDIT] ${action} - User: ${userId || 'Anon'}`);

        } catch (error) {
            console.error(`[AUDIT_FAIL] Failed to log action: ${action}`, error);
            // Fail safe: Do not crash the app if audit fails
        }
    }
}
