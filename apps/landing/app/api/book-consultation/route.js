import { NextResponse } from "next/server";
import { BookingService } from "@/src/services/databaseService";

export async function POST(request) {
    try {
        const formData = await request.json();

        // Validate required fields
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.consultationType || !formData.preferredDate) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Create booking service instance
        const bookingService = new BookingService();

        // Prepare booking data for database
        const bookingData = {
            // Consultation Type
            consultationType: formData.consultationType,

            // Contact Information
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone || '',
            company: formData.company || '',
            jobTitle: formData.jobTitle || '',

            // Meeting Details
            purpose: formData.purpose || '',
            preferredDate: formData.preferredDate,
            preferredTime: formData.preferredTime || '',
            alternativeDate: formData.alternativeDate || '',
            alternativeTime: formData.alternativeTime || '',
            timezone: formData.timezone || 'EST',
            meetingMode: formData.meetingMode || 'video',

            // Additional Information
            agenda: formData.agenda || '',
            participants: formData.participants || 1,
            specialRequests: formData.specialRequests || '',

            // Preferences
            newsletter: formData.newsletter || false,

            // Status tracking
            status: 'pending_confirmation',
            source: 'book_meet_modal'
        };

        // Save to database
        const savedBooking = await bookingService.createBooking(bookingData);

        // Prepare email data for notification
        const emailData = {
            type: 'consultation_booking',
            data: {
                // Use primaryContactEmail format for compatibility with existing email service
                primaryContactEmail: formData.email,
                contactName: `${formData.firstName} ${formData.lastName}`,
                firstName: formData.firstName,
                lastName: formData.lastName,

                // Booking specific data
                consultationType: formData.consultationType,
                company: formData.company,
                jobTitle: formData.jobTitle,
                phone: formData.phone,

                // Meeting details
                purpose: formData.purpose,
                preferredDate: formData.preferredDate,
                preferredTime: formData.preferredTime,
                alternativeDate: formData.alternativeDate,
                alternativeTime: formData.alternativeTime,
                timezone: formData.timezone,
                meetingMode: formData.meetingMode,

                // Additional context
                agenda: formData.agenda,
                participants: formData.participants,
                specialRequests: formData.specialRequests,
                newsletter: formData.newsletter,

                // Database reference
                bookingId: savedBooking.id,
                submittedAt: new Date().toISOString()
            }
        };

        // Send only admin notification email (not user confirmation yet)
        // User confirmation will be sent when admin confirms the booking
        try {
            const adminNotificationData = {
                type: 'consultation_booking',
                data: {
                    ...emailData.data,
                    sendToAdmin: true, // Flag to send only admin notification
                    sendToUser: false  // Don't send user confirmation yet
                }
            };

            const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/send-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(adminNotificationData)
            });

            if (!emailResponse.ok) {
                // Don't fail the entire process if email fails
            }
        } catch (emailError) {
            // Don't fail the entire process if email fails
        }

        return NextResponse.json({
            success: true,
            message: "Consultation booking submitted successfully",
            bookingId: savedBooking.id
        });

    } catch (error) {
        return NextResponse.json(
            {
                error: "Failed to submit consultation booking",
                details: error.message
            },
            { status: 500 }
        );
    }
}
