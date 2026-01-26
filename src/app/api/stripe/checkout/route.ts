
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { User } from "@/app/models/User";
import { PlanType } from "@/interfaces/IUser";
import connectToDatabase from "@/lib/mongoose";

export async function POST(req: NextRequest) {
    try {
        const { priceId, userId, successUrl, cancelUrl } = await req.json();

        if (!priceId || !userId) {
            return NextResponse.json({ error: "Missing priceId or userId" }, { status: 400 });
        }

        // Map Plan Name to Env ID if applicable
        let finalPriceId = priceId;
        if (priceId === 'PRO') finalPriceId = process.env.STRIPE_PLAN_PRO;
        if (priceId === 'MAX') finalPriceId = process.env.STRIPE_PLAN_MAX;

        if (!finalPriceId) {
            return NextResponse.json({ error: "Invalid Price ID configuration" }, { status: 400 });
        }

        // 1. Get User
        await connectToDatabase();
        const user = await User.findById(userId);

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // 2. Resolve Customer ID (Create if not exists)
        let customerId = user.subscription?.providerId;

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: user.name,
                metadata: {
                    userId: user._id.toString(),
                },
            });
            customerId = customer.id;

            // Save Stripe ID to User
            user.subscription = {
                plan: user.subscription?.plan || PlanType.FREE,
                status: user.subscription?.status || 'ACTIVE',
                subscriptionId: user.subscription?.subscriptionId,
                expiresAt: user.subscription?.expiresAt,
                providerId: customerId
            };
            await user.save();
        }

        // 3. Create Session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: finalPriceId,
                    quantity: 1,
                },
            ],
            success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?success=true`,
            cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing?canceled=true`,
            metadata: {
                userId: user._id.toString(),
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (err: any) {
        console.error("Stripe Checkout Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
