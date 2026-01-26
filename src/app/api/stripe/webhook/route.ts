
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { User } from "@/app/models/User";
import { getMongoClient } from "@/db/connectionDb";
import { headers } from "next/headers";
import type { Stripe } from "stripe";
import connectToDatabase from "@/lib/mongoose";

// Helper to get raw body (Next.js 13+)
async function getRawBody(req: NextRequest): Promise<string> {
    const blob = await req.blob();
    return blob.text();
}

export async function POST(req: NextRequest) {
    await connectToDatabase();
    const rawBody = await req.text();
    const signature = (await headers()).get("Stripe-Signature") as string;

    let event: Stripe.Event;

    try {
        if (!process.env.STRIPE_WEBHOOK_SECRET) {
            // For dev/test without local listener, we might skip signature check IF explicitly allowed, 
            // but for security we should throw. 
            // NOTE: In local dev with 'stripe listen', we get a secret.
            throw new Error("STRIPE_WEBHOOK_SECRET not set");
        }
        event = stripe.webhooks.constructEvent(
            rawBody,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err: any) {
        console.error(`Webhook Signature Error: ${err.message}`);
        return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
    }

    // Connect DB
    await getMongoClient();

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.metadata?.userId;

                if (userId) {
                    // Update User Plan
                    // Retrieve subscription to know which plan it is (based on Price ID)
                    // Simplified: We assume Price ID maps to Plan. 
                    // Better: Check session.line_items or retrieve subscription details.

                    const subscriptionId = session.subscription as string;
                    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                    const priceId = subscription.items.data[0].price.id;

                    // Map Price ID to Plan (You should use ENV vars for these IDs)
                    let newPlan = 'FREE';
                    if (priceId === process.env.STRIPE_PLAN_PRO) newPlan = 'PRO';
                    if (priceId === process.env.STRIPE_PLAN_MAX) newPlan = 'MAX';

                    await User.findByIdAndUpdate(userId, {
                        "subscription.plan": newPlan,
                        "subscription.status": "ACTIVE",
                        "subscription.subscriptionId": subscriptionId,
                        "subscription.providerId": session.customer as string,
                        "subscription.expiresAt": new Date(subscription.current_period_end * 1000)
                    });
                    console.log(`User ${userId} upgraded to ${newPlan}`);
                }
                break;
            }

            case "customer.subscription.deleted": {
                const subscription = event.data.object as Stripe.Subscription;
                // Find user by subscription ID or Customer ID
                const customerId = subscription.customer as string;

                await User.findOneAndUpdate(
                    { "subscription.providerId": customerId },
                    {
                        "subscription.plan": "FREE",
                        "subscription.status": "CANCELED"
                    }
                );
                console.log(`Subscription deleted for customer ${customerId}`);
                break;
            }
            case "customer.subscription.updated": {
                // Sync status (past_due, active, etc)
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;

                await User.findOneAndUpdate(
                    { "subscription.providerId": customerId },
                    {
                        "subscription.status": subscription.status.toUpperCase(),
                        "subscription.expiresAt": new Date(subscription.current_period_end * 1000)
                    }
                );
                break;
            }
            default:
                console.log(`Unhandled event type ${event.type}`);
        }
    } catch (error) {
        console.error("Webhook Handler Error:", error);
        return NextResponse.json({ error: "Handler Failed" }, { status: 500 });
    }

    return NextResponse.json({ received: true });
}
