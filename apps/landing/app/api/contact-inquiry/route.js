import { NextResponse } from "next/server";
import { ContactService } from "@/src/services/databaseService";

export async function POST(request) {
    try {
        const formData = await request.json();

        // Validate required fields
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.message) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Create contact service instance
        const contactService = new ContactService();

        // Prepare inquiry data for database
        const inquiryData = {
            // Personal Information
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone || '',

            // Organization Information
            company: formData.company || '',
            jobTitle: formData.jobTitle || '',
            website: formData.website || '',

            // Inquiry Details
            inquiryType: formData.inquiryType || 'general',
            purpose: formData.purpose || '',
            priority: formData.priority || 'medium',

            // Contact Preferences
            preferredContact: formData.preferredContact || 'email',
            bestTimeToCall: formData.bestTimeToCall || '',

            // Additional Information
            hearAboutUs: formData.hearAboutUs || '',
            message: formData.message,

            // Consent
            newsletter: formData.newsletter || false,
            privacy: formData.privacy || false,

            // Status tracking
            status: 'new',
            source: 'contact_form'
        };

        // Save to database
        const savedInquiry = await contactService.createInquiry(inquiryData);

        // Prepare email data for notification
        const emailData = {
            type: 'contact_inquiry',
            data: {
                // Use primaryContactEmail format for compatibility with existing email service
                primaryContactEmail: formData.email,
                contactName: `${formData.firstName} ${formData.lastName}`,
                firstName: formData.firstName,
                lastName: formData.lastName,

                // Contact inquiry specific data
                inquiryType: formData.inquiryType,
                priority: formData.priority,
                company: formData.company,
                jobTitle: formData.jobTitle,
                phone: formData.phone,
                message: formData.message,

                // Additional context
                purpose: formData.purpose,
                preferredContact: formData.preferredContact,
                bestTimeToCall: formData.bestTimeToCall,
                hearAboutUs: formData.hearAboutUs,
                website: formData.website,
                newsletter: formData.newsletter,

                // Database reference
                inquiryId: savedInquiry.id,
                submittedAt: new Date().toISOString()
            }
        };

        // Send email notification
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
            message: "Contact inquiry submitted successfully",
            inquiryId: savedInquiry.id
        });

    } catch (error) {
        return NextResponse.json(
            {
                error: "Failed to submit contact inquiry",
                details: error.message
            },
            { status: 500 }
        );
    }
}
