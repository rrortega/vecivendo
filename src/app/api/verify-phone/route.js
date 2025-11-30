import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        const { phone, residential_id, action, code, name, address, location } = body;

        const apiUrl = process.env.PHONE_VERIFICATION_API_URL;

        if (!apiUrl) {
            return NextResponse.json({ error: "Configuration error: Missing API URL" }, { status: 500 });
        }

        const payload = {
            phone,
            residencial_id: residential_id,
            action,
            name,
            address,
            location
        };

        if (code) {
            payload.code = code;
        }

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ error: data.error || "Error en el servicio de verificación" }, { status: response.status });
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error("Verification proxy error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
