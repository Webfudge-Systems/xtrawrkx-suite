import { NextResponse } from "next/server";
import { BookingService } from "@/src/services/databaseService";

export async function POST(request) {
    try {
        const { bookingId, confirmedBy } = await request.json();

        // Validate required fields
        if (!bookingId) {
            return NextResponse.json(
                { error: "Missing booking ID" },
                { status: 400 }
            );
        }

        // Create booking service instance
        const bookingService = new BookingService();

        // Get the booking details
        const booking = await bookingService.getById(bookingId);
        if (!booking) {
            return NextResponse.json(
                { error: "Booking not found" },
                { status: 404 }
            );
        }

        // Update booking status to confirmed
        await bookingService.confirmBooking(bookingId, confirmedBy);

        // Prepare email data for user confirmation
        const emailData = {
            type: 'consultation_booking',
            data: {
                primaryContactEmail: booking.email,
                contactName: `${booking.firstName} ${booking.lastName}`,
                firstName: booking.firstName,
                lastName: booking.lastName,

                // Booking specific data
                consultationType: booking.consultationType,
                company: booking.company,
                jobTitle: booking.jobTitle,
                phone: booking.phone,

                // Meeting details
                purpose: booking.purpose,
                preferredDate: booking.preferredDate,
                preferredTime: booking.preferredTime,
                alternativeDate: booking.alternativeDate,
                alternativeTime: booking.alternativeTime,
                timezone: booking.timezone,
                meetingMode: booking.meetingMode,

                // Additional context
                agenda: booking.agenda,
                participants: booking.participants,
                specialRequests: booking.specialRequests,
                newsletter: booking.newsletter,

                // Database reference
                bookingId: booking.id,
                confirmedAt: new Date().toISOString(),
                confirmedBy: confirmedBy,

                // Email flags
                sendToUser: true,   // Send user confirmation
                sendToAdmin: false  // Don't send admin notification again
            }
        };

        // Send confirmation email to user
        try {
            const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/send-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(emailData)
            });

            if (!emailResponse.ok) {
                // Don't fail the entire process if email fails
            }
        } catch (emailError) {
            // Don't fail the entire process if email fails
        }

        return NextResponse.json({
            success: true,
            message: "Booking confirmed and confirmation email sent",
            bookingId: bookingId
        });

    } catch (error) {
        return NextResponse.json(
            {
                error: "Failed to confirm booking",
                details: error.message
            },
            { status: 500 }
        );
    }
}
