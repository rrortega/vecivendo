import { NextResponse } from 'next/server';
import { users } from '@/lib/appwrite-server';
import { Query } from 'node-appwrite';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const phone = searchParams.get('phone');

        if (!phone) {
            return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
        }

        // Clean phone number: remove non-digits
        const cleanPhone = phone.replace(/\D/g, '');

        // We need at least 10 digits to make a reliable match
        if (cleanPhone.length < 10) {
            return NextResponse.json({ error: 'Phone number too short' }, { status: 400 });
        }

        const last10 = cleanPhone.slice(-10);

        console.log(`🔍 [API] Looking up user with phone ending in: ${last10}`);

        // List users and filter manually since Appwrite Query.search on phone might be strict
        // Ideally we would use Query.equal('phone', ...) but formats vary (+52..., 52...)
        // For now, we'll fetch a batch and filter. 
        // Note: In a large user base, this is inefficient. 
        // Better approach: Use a cloud function or ensure standard phone format storage.
        // For this MVP/Context: We will try to search by the full number if provided with +, 
        // or just list recent users and find a match.

        // Strategy: Search for the phone number as provided, and also try to match last 10 digits
        // Appwrite Users API 'list' has a search parameter but it searches name, email, phone.

        // Appwrite Users API doesn't support partial match on phone easily without fulltext index.
        // We will fetch the latest 100 users and filter manually.
        // This is a limitation of the current implementation.

        const response = await users.list([
            Query.limit(100),
            Query.orderDesc('$createdAt')
        ]);

        const match = response.users.find(u => {
            if (!u.phone) return false;
            const uPhone = u.phone.replace(/\D/g, '');
            return uPhone.endsWith(last10);
        });

        if (match) {
            console.log(`✅ [API] User found: ${match.$id}`);
            return NextResponse.json({
                $id: match.$id,
                name: match.name,
                email: match.email,
                phone: match.phone,
                registrationDate: match.registration
            });
        }

        console.log(`⚠️ [API] No user found for phone: ${phone}`);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });

    } catch (error) {
        console.error('❌ [API] Error looking up user:', error);
        return NextResponse.json(
            { error: error.message || 'Error looking up user' },
            { status: 500 }
        );
    }
}
