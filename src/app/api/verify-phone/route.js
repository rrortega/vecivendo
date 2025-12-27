import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        const { phone, residential_id, action, code, name, address, location, only_whatsapp } = body;

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
            location,
            only_whatsapp
        };

        if (code) {
            payload.code = code;
        }

        // Nueva lógica: Validar pertenencia al residencial antes de enviar OTP
        // Solo si NO es una verificación final (es decir, estamos solicitando el código)
        // Y si NO estamos en modo solo_whatsapp (que ya valida por su cuenta)
        if (!code && action !== 'verify' && !only_whatsapp) {
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
                        // Si falla por otra razón (500, etc), logueamos pero tal vez queramos bloquear o permitir?
                        // Por seguridad, si el servicio de chequeo falla, mejor no enviar OTP.
                        console.error("Error validando residencial:", await checkResponse.text());
                        return NextResponse.json(
                            { error: "Error al validar permisos de residencial." },
                            { status: checkResponse.status }
                        );
                    }

                    // Si retorna 200, continuamos al siguiente paso (OTP)
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
