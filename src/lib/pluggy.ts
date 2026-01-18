import { PluggyClient } from 'pluggy-sdk';

let pluggyClient: PluggyClient | null = null;

export const getPluggyClient = () => {
    if (pluggyClient) return pluggyClient;

    const clientId = process.env.PLUGGY_CLIENT_ID;
    const clientSecret = process.env.PLUGGY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error("Missing PLUGGY_CLIENT_ID or PLUGGY_CLIENT_SECRET in environment variables.");
    }

    pluggyClient = new PluggyClient({
        clientId: clientId,
        clientSecret: clientSecret,
    });

    return pluggyClient;
};
