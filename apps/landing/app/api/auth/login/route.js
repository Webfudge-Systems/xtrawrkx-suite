import { NextResponse } from 'next/server';
import { CMS_CONFIG } from '@/src/config/cms';

const STRAPI_API_URL = CMS_CONFIG.STRAPI_API_URL || process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337/api';

export async function POST(request) {
    try {
        const body = await request.json();
        // CRM portal uses 'email' instead of 'identifier'
        const { email, password, identifier } = body;

        // Support both 'email' and 'identifier' for compatibility
        const userEmail = email || identifier;

        if (!userEmail || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Construct endpoint URL - using /api/auth/internal/login (same as CRM portal)
        const baseUrl = STRAPI_API_URL.endsWith('/')
            ? STRAPI_API_URL.slice(0, -1)
            : STRAPI_API_URL;

        const authEndpoint = `${baseUrl}/auth/internal/login`;

        // Proxy request to Strapi backend
        const response = await fetch(authEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                email: userEmail,
                password,
            }),
        });

        // Parse JSON response
        let data;
        try {
            data = await response.json();
        } catch (parseError) {
            console.error('Failed to parse response:', parseError);
            return NextResponse.json(
                {
                    error: 'Invalid response from authentication server',
                    details: 'Unable to process server response',
                },
                { status: 500 }
            );
        }

        if (!response.ok) {
            // Extract error message from various possible response structures
            const errorMessage =
                data.error?.message ||
                (typeof data.error === 'string' ? data.error : null) ||
                data.message ||
                'Authentication failed. Please try again.';

            return NextResponse.json(
                { error: errorMessage },
                { status: response.status }
            );
        }

        // Return response in format compatible with both token and jwt
        return NextResponse.json({
            jwt: data.token || data.jwt,
            token: data.token || data.jwt,
            user: data.user,
        }, { status: 200 });
    } catch (error) {
        console.error('Login API error:', error);
        return NextResponse.json(
            {
                error: error.message || 'Internal server error',
                details: 'Failed to connect to authentication server',
            },
            { status: 500 }
        );
    }
}

