import { NextResponse } from "next/server";

const RAZORPAY_KEY_ID = "rzp_live_627XWffhtRryPe";
const RAZORPAY_KEY_SECRET = "I91oD4xHChJ8DJFDkjlB7vOh";

export async function POST(request) {
    try {
        const { amount, currency = "INR", description = "Season Registration Payment" } = await request.json();

        if (!amount || amount <= 0) {
            return NextResponse.json(
                { error: "Invalid amount" },
                { status: 400 }
            );
        }

        const orderData = {
            amount: Math.round(amount * 100), // Convert to paise
            currency: currency,
            receipt: `receipt_${Date.now()}`,
            notes: {
                description: description,
                created_at: new Date().toISOString(),
            },
        };

        const authString = Buffer.from(
            `${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`
        ).toString("base64");

        const response = await fetch("https://api.razorpay.com/v1/orders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Basic ${authString}`,
            },
            body: JSON.stringify(orderData),
        });

        if (!response.ok) {
            const errorData = await response.text();
            return NextResponse.json(
                { error: "Failed to create order", details: errorData },
                { status: 500 }
            );
        }

        const order = await response.json();

        return NextResponse.json({
            id: order.id,
            amount: order.amount,
            currency: order.currency,
            status: order.status,
        });

    } catch (error) {
        return NextResponse.json(
            { error: "Internal server error", details: error.message },
            { status: 500 }
        );
    }
}
