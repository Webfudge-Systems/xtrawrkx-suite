// API endpoint for Chrome extension integration
import { NextResponse } from 'next/server';

// Mock data for development - replace with actual database calls
let contacts = [];
let contactIdCounter = 1;

export async function POST(request) {
    try {
        const contactData = await request.json();

        // Validate required fields
        if (!contactData.name) {
            return NextResponse.json(
                { success: false, error: 'Contact name is required' },
                { status: 400 }
            );
        }

        if (!contactData.owner) {
            return NextResponse.json(
                { success: false, error: 'Contact owner is required' },
                { status: 400 }
            );
        }

        // Check for duplicates if LinkedIn URL is provided
        if (contactData.socialProfiles?.linkedin) {
            const existingContact = contacts.find(contact =>
                contact.socialProfiles?.linkedin === contactData.socialProfiles.linkedin
            );

            if (existingContact) {
                return NextResponse.json(
                    { success: false, error: 'Contact with this LinkedIn profile already exists' },
                    { status: 409 }
                );
            }
        }

        // Create new contact
        const newContact = {
            id: contactIdCounter++,
            ...contactData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            // Set defaults for missing fields
            status: contactData.status || 'prospect',
            leadSource: contactData.leadSource || 'linkedin',
            decisionRole: contactData.decisionRole || 'other',
            tags: contactData.tags || ['linkedin'],
            engagementScore: contactData.engagementScore || 0,
            lastActivity: contactData.lastActivity || new Date().toISOString().split('T')[0]
        };

        // Add to mock database
        contacts.push(newContact);


        return NextResponse.json({
            success: true,
            data: newContact,
            message: 'Contact created successfully'
        });

    } catch (error) {
        console.error('Error creating contact via Chrome extension:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');
        const linkedin = searchParams.get('linkedin');

        // Check for duplicate contacts
        if (email || linkedin) {
            const isDuplicate = contacts.some(contact => {
                if (email && contact.email === email) return true;
                if (linkedin && contact.socialProfiles?.linkedin === linkedin) return true;
                return false;
            });

            return NextResponse.json({ isDuplicate });
        }

        // Return all contacts (for development/testing)
        return NextResponse.json({
            success: true,
            data: contacts,
            total: contacts.length
        });

    } catch (error) {
        console.error('Error fetching contacts:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}


