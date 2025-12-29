import { NextResponse } from 'next/server';

// Rate limiting: Map para rastrear intentos por IP y teléfono
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minuto
const MAX_ATTEMPTS_PER_WINDOW = 3; // Máximo 3 intentos por minuto

function getRateLimitKey(ip, phone) {
    return `${ip}-${phone}`;
}

function checkRateLimit(ip, phone) {
    const key = getRateLimitKey(ip, phone);
    const now = Date.now();
    const record = rateLimitMap.get(key);

    if (!record) {
        rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
        return true;
    }

    if (now > record.resetAt) {
        // Reset window
        rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
        return true;
    }

    if (record.count >= MAX_ATTEMPTS_PER_WINDOW) {
        return false;
    }

    record.count++;
    return true;
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { phone, residential_id, action, code, name, address, location, only_whatsapp } = body;

        // Obtener IP del cliente
        const forwarded = request.headers.get('x-forwarded-for');
        const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';

        // Validación básica
        if (!phone || !residential_id) {
            return NextResponse.json({ error: "Phone and residential_id are required" }, { status: 400 });
        }

        // CASO 1: Solo verificar WhatsApp (sin OTP)
        // Si solo queremos verificar WhatsApp, usar el endpoint de residencial
        if (only_whatsapp === true) {
            const residentialApiUrl = process.env.PHONE_RESIDENCIAL_API_URL;

            if (!residentialApiUrl) {
                return NextResponse.json({ error: "Configuration error: Missing Residential API URL" }, { status: 500 });
            }

            try {
                const checkResponse = await fetch(residentialApiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone, residential_id })
                });

                if (checkResponse.status === 404) {
                    return NextResponse.json(
                        { error: "Este número no está registrado en el residencial." },
                        { status: 404 }
                    );
                }

                if (!checkResponse.ok) {
                    console.error("Error validando residencial:", await checkResponse.text());
                    return NextResponse.json(
                        { error: "Error al validar permisos de residencial." },
                        { status: checkResponse.status }
                    );
                }

                const data = await checkResponse.json();
                return NextResponse.json(data);
            } catch (checkError) {
                console.error("Error de conexión validando residencial:", checkError);
                return NextResponse.json({ error: "Error de conexión validando residencial" }, { status: 500 });
            }
        }

        // CASO 2: Flujo OTP (envío de SMS)
        // Rate limiting solo para flujo OTP
        if (!checkRateLimit(ip, phone)) {
            return NextResponse.json(
                { error: "Demasiados intentos. Por favor espera un minuto antes de intentar nuevamente." },
                { status: 429 }
            );
        }

        // Flujo OTP normal
        const apiUrl = process.env.PHONE_VERIFICATION_API_URL;

        if (!apiUrl) {
            return NextResponse.json({ error: "Configuration error: Missing API URL" }, { status: 500 });
        }

        const payload = {
            phone,
            residential_id: residential_id,
            action,
            name,
            address,
            location
        };

        if (code) {
            payload.code = code;
        }

        // Validar pertenencia al residencial antes de enviar OTP
        if (!code && action !== 'verify') {
            const residentialApiUrl = process.env.PHONE_RESIDENCIAL_API_URL;
            if (residentialApiUrl) {
                try {
                    const checkResponse = await fetch(residentialApiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phone, residential_id })
                    });

                    if (checkResponse.status === 404) {
                        return NextResponse.json(
                            { error: "Este número no está registrado en el residencial." },
                            { status: 404 }
                        );
                    }

                    if (!checkResponse.ok) {
                        console.error("Error validando residencial:", await checkResponse.text());
                        return NextResponse.json(
                            { error: "Error al validar permisos de residencial." },
                            { status: checkResponse.status }
                        );
                    }
                } catch (checkError) {
                    console.error("Error de conexión validando residencial:", checkError);
                    return NextResponse.json({ error: "Error de conexión validando residencial" }, { status: 500 });
                }
            }
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
