import { NextResponse } from 'next/server';
import { users } from '@/lib/appwrite-server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const { userId, prefs } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        if (!prefs || typeof prefs !== 'object') {
            return NextResponse.json({ error: 'Preferences object is required' }, { status: 400 });
        }

        // Update preferences using the server-side SDK (which has bypass power)
        // Note: updatePrefs replaces all preferences with the new object provided
        // OR does it merge? In Appwrite Users SDK (server), it replaces.
        // We should first get existing prefs if we want to merge, but for this specific 
        // request "profileImageUrl" is the main one.

        const user = await users.get(userId);
        const updatedPrefs = { ...user.prefs, ...prefs };

        const response = await users.updatePrefs(userId, updatedPrefs);

        return NextResponse.json({ success: true, prefs: response.prefs });

    } catch (error) {
        console.error('[API Update Preferences] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Error updating preferences' },
            { status: 500 }
        );
    }
}
