import { NextResponse } from 'next/server';
import { users, ID, Query } from '@/lib/appwrite-server';

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
        if (only_whatsapp === true) {
            const residentialApiUrl = process.env.PHONE_RESIDENCIAL_API_URL;

            if (!residentialApiUrl) {
                return NextResponse.json({ error: "Configuration error: Missing Residential API URL" }, { status: 500 });
            }

            try {
                const checkResponse = await fetch(residentialApiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone: phone.replace(/[\+\s]/g, '').trim(), residential_id })
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

                // --- INTEGRACIÓN APPWRITE AUTOMÁTICA ---
                // Si la validación de WhatsApp fue exitosa, también generamos sesión si el usuario lo requiere
                // (Aunque usualmente este caso es solo para checar acceso, si devuelve success podemos dar secret)
                if (data.status === 'success') {
                    try {
                        let userId = phone.replace(/[\+\s]/g, '').trim();
                        if (userId.startsWith('52') && userId.length === 12 && !userId.startsWith('521')) {
                            userId = '521' + userId.substring(2);
                        }
                        const token = await users.createToken(userId);
                        data.appwriteSecret = token.secret;
                        data.appwriteUserId = userId;
                    } catch (e) {
                        console.error("Error generating session secret for WhatsApp validation:", e.message);
                    }
                }

                return NextResponse.json(data);
            } catch (checkError) {
                console.error("Error de conexión validando residencial:", checkError);
                return NextResponse.json({ error: "Error de conexión validando residencial" }, { status: 500 });
            }
        }

        // CASO 2: Flujo OTP (envío de SMS)
        if (!checkRateLimit(ip, phone.replace(/[\+\s]/g, '').trim())) {
            return NextResponse.json(
                { error: "Demasiados intentos. Por favor espera un minuto antes de intentar nuevamente." },
                { status: 429 }
            );
        }

        const apiUrl = process.env.PHONE_VERIFICATION_API_URL;

        if (!apiUrl) {
            return NextResponse.json({ error: "Configuration error: Missing API URL" }, { status: 500 });
        }

        const payload = {
            phone: phone.replace(/[\+\s]/g, '').trim(),
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
                        body: JSON.stringify({ phone: phone.replace(/[\+\s]/g, '').trim(), residential_id })
                    });

                    if (checkResponse.status === 404) {
                        return NextResponse.json(
                            { error: "Este número no está registrado en el residencial." },
                            { status: 404 }
                        );
                    }
                } catch (checkError) {
                    console.error("Error de conexión validando residencial:", checkError);
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

        // --- INTEGRACIÓN APPWRITE AUTOMÁTICA ---
        // Si la acción fue 'verify' y fue exitosa, generamos la sesión
        if (action === 'verify' && data.status === 'success') {
            try {
                // Eliminar el signo + y manejar el prefijo 521 para IDs de Appwrite
                let userId = phone.replace(/[\+\s]/g, '').trim();

                if (userId.startsWith('52') && userId.length === 12 && !userId.startsWith('521')) {
                    userId = '521' + userId.substring(2);
                }

                // Generar token de sesión (secret) para que el frontend inicie sesión
                const token = await users.createToken(userId);

                data.appwriteSecret = token.secret;
                data.appwriteUserId = userId;

                console.log(`✅ Sesión Appwrite generada para ID: ${userId}`);
            } catch (appwriteError) {
                console.error("⚠️ Error generando sesión Appwrite (no fatal):", appwriteError.message);
            }
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error("Verification proxy error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
