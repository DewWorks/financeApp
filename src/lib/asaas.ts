import axios from 'axios';

const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;

export const asaasClient = axios.create({
    baseURL: ASAAS_API_URL,
    headers: {
        'access_token': ASAAS_API_KEY || '',
        'Content-Type': 'application/json'
    }
});

export interface AsaasCustomer {
    id: string;
    name: string;
    email: string;
}

export interface AsaasSubscription {
    id: string;
    customer: string;
    value: number;
    nextDueDate: string;
    cycle: 'MONTHLY' | 'YEARLY';
    description: string;
    status: 'ACTIVE' | 'EXPIRED' | 'OVERDUE' | 'CANCELED';
}

export async function getOrCreateCustomer(name: string, email: string, cpfCnpj?: string): Promise<AsaasCustomer> {
    try {
        const { data: searchData } = await asaasClient.get(`/customers?email=${email}`);
        if (searchData.data && searchData.data.length > 0) {
            return searchData.data[0];
        }

        const { data: newCustomer } = await asaasClient.post('/customers', {
            name,
            email,
            cpfCnpj,
            notificationDisabled: true 
        });

        return newCustomer;
    } catch (error: any) {
        console.error("Asaas getOrCreateCustomer error:", error.response?.data || error.message);
        throw new Error("Failed to get or create Asaas customer");
    }
}

export async function createSubscription(
    customerId: string, 
    value: number, 
    description: string, 
    cycle: 'MONTHLY' | 'YEARLY' = 'MONTHLY'
) {
    try {
        const nextDueDate = new Date().toISOString().split('T')[0];

        const { data: subscription } = await asaasClient.post('/subscriptions', {
            customer: customerId,
            billingType: 'UNDEFINED',
            value,
            nextDueDate,
            cycle,
            description
        });

        const { data: payments } = await asaasClient.get(`/payments?subscription=${subscription.id}`);
        const firstPayment = payments.data[0];

        return {
            subscriptionId: subscription.id,
            invoiceUrl: firstPayment ? firstPayment.invoiceUrl : null
        };
    } catch (error: any) {
        console.error("Asaas createSubscription error:", error.response?.data || error.message);
        throw new Error("Failed to create Asaas subscription");
    }
}

export async function cancelSubscription(subscriptionId: string) {
    try {
        const { data } = await asaasClient.delete(`/subscriptions/${subscriptionId}`);
        return data;
    } catch (error: any) {
        console.error("Asaas cancelSubscription error:", error.response?.data || error.message);
        throw new Error("Failed to cancel Asaas subscription");
    }
}
