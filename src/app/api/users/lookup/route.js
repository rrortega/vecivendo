import { NextResponse } from 'next/server';
import { users } from '@/lib/appwrite-server';
import { Query } from 'node-appwrite';

export const dynamic = 'force-dynamic';

export async function GET(request) {


    const lockupN8N = async (phone) => {
        const lockupApiUrl = process.env.PHONE_LOCKUP_API_URL;
        try {
            const checkResponse = await fetch(lockupApiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone })
            });

            if (checkResponse.status === 404) {
                return null;
            }
            return checkResponse.json()

        } catch (checkError) {
            return null
        }
    }


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
        let userId = cleanPhone;
        if (userId.startsWith('52')) {
            if (userId.length === 12 && !userId.startsWith('521')) {
                userId = '521' + userId.substring(2);
            }
        }

        console.log(`🔍 [API] Looking up user with phone: ${cleanPhone} (mapped ID: ${userId})`);

        let match = null;
        try {
            // First attempt: direct lookup by ID (more efficient)
            match = await users.get(userId);
            console.log(`✅ [API] User found by ID: ${userId}`);
        } catch (e) {
            // Second attempt: list and filter (for legacy or differently formatted users)
            const response = await users.list({
                queries: [Query.contains('phone', last10)],
                limit: 5 // Get a few to filter
            });

            match = response.users.find(u => {
                if (!u.phone) return false;
                const uPhone = u.phone.replace(/\D/g, '');
                return uPhone.endsWith(last10);
            });
            if (match) console.log(`✅ [API] User found by phone list match: ${match.$id}`);
        }

        if (match) {
            //console.log(`✅ [API] User found: ${match.$id} (exact match)`);
            const lk = await lockupN8N(cleanPhone);
            if (lk?.profileImageUrl) {
                users.updatePrefs({
                    userId: match.$id,
                    prefs: {
                        profileImageUrl: lk.profileImageUrl
                    }
                });
            }
            if ((lk?.name ?? '').length && !match.name.length) {
                users.updateName({
                    userId: match.$id,
                    name: lk?.name
                });
            }

            return NextResponse.json({
                $id: match.$id,
                name: match.name ?? lk?.name,
                email: match.email,
                phone: match.phone,
                registrationDate: match.registration,
                phoneVerification: match.phoneVerification,
                profileImageUrl: match.prefs?.profileImageUrl ?? lk?.profileImageUrl,
                residencial: lk?.residencial,
                numberExistsOnWhatsApp: lk?.numberExists ?? match.phoneVerification
            });
        }

        //console.log(`⚠️ [API] No user found for phone: ${phone}`);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });

    } catch (error) {
        //console.error('❌ [API] Error looking up user:', error);
        return NextResponse.json(
            { error: error.message || 'Error looking up user' },
            { status: 500 }
        );
    }
}

