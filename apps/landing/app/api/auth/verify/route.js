import { NextResponse } from 'next/server';
import { CMS_CONFIG } from '@/src/config/cms';

const STRAPI_API_URL = CMS_CONFIG.STRAPI_API_URL || process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337/api';

export async function GET(request) {
    try {
        const authHeader = request.headers.get('authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Authorization token required' },
                { status: 401 }
            );
        }

        const token = authHeader.replace('Bearer ', '');

        // Proxy the request to Strapi backend with populated relationships (like CRM portal)
        const response = await fetch(`${STRAPI_API_URL}/users/me?populate=primaryRole,userRoles`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            // Return the actual status code from Strapi
            const errorData = await response.json().catch(() => ({ error: 'Token verification failed' }));
            return NextResponse.json(
                { error: errorData.error || errorData.message || 'Token verification failed' },
                { status: response.status }
            );
        }

        const user = await response.json();
        return NextResponse.json(user, { status: 200 });
    } catch (error) {
        console.error('Token verification error:', error);
        return NextResponse.json(
            {
                error: error.message || 'Internal server error',
                details: 'Failed to verify token',
            },
            { status: 500 }
        );
    }
}

