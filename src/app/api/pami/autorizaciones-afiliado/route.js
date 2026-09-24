/**
 * API Route: /api/pami/autorizaciones-afiliado
 * Proxy hacia PAMI farma que reenvía las cookies de sesión del usuario.
 *
 * Query params:
 *   - numeroAfiliado: string (requerido)
 *   - idConvenio: string (opcional, default 15 = PAMI)
 *   - fechaDesde: string ISO (opcional)
 *   - fechaHasta: string ISO (opcional)
 *   - pagina: number (opcional, default 1)
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const PAMI_BASE = 'https://farma.pami.org.ar';
const PAMI_ENDPOINT = `${PAMI_BASE}/api/autorizaciones/consulta-afiliado`;

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const numeroAfiliado = searchParams.get('numeroAfiliado');
  if (!numeroAfiliado) {
    return NextResponse.json(
      { error: 'El parámetro numeroAfiliado es requerido' },
      { status: 400 }
    );
  }

  // Construir los query params para PAMI
  const pamiParams = new URLSearchParams();
  pamiParams.set('numeroAfiliado', numeroAfiliado);

  const idConvenio = searchParams.get('idConvenio') || '15'; // 15 = PAMI por defecto
  pamiParams.set('idConvenio', idConvenio);

  if (searchParams.get('fechaDesde')) {
    pamiParams.set('fechaDesde', searchParams.get('fechaDesde'));
  }
  if (searchParams.get('fechaHasta')) {
    pamiParams.set('fechaHasta', searchParams.get('fechaHasta'));
  }
  if (searchParams.get('pagina')) {
    pamiParams.set('pagina', searchParams.get('pagina'));
  }

  // Reenviar las cookies de sesión del navegador del usuario hacia PAMI
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const cookieHeader = allCookies.map((c) => `${c.name}=${c.value}`).join('; ');

  // También reenviar la cookie del header original si viene
  const incomingCookieHeader = request.headers.get('cookie') || '';

  const pamiUrl = `${PAMI_ENDPOINT}?${pamiParams.toString()}`;

  try {
    const pamiResponse = await fetch(pamiUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json, text/plain, */*',
        Cookie: incomingCookieHeader || cookieHeader,
        Referer: `${PAMI_BASE}/autorizaciones`,
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      // No seguir redirecciones (si hay 302 a login, lo informamos)
      redirect: 'manual',
    });

    // Si PAMI devuelve redirección a login, la sesión expiró
    if (pamiResponse.status === 302 || pamiResponse.status === 301) {
      return NextResponse.json(
        {
          error: 'Sesión PAMI expirada. Por favor iniciá sesión en farma.pami.org.ar primero.',
          code: 'SESSION_EXPIRED',
        },
        { status: 401 }
      );
    }

    if (!pamiResponse.ok) {
      const errorText = await pamiResponse.text();
      return NextResponse.json(
        {
          error: `Error de PAMI: ${pamiResponse.status}`,
          detail: errorText.substring(0, 500),
        },
        { status: pamiResponse.status }
      );
    }

    const data = await pamiResponse.json();

    // Retornar los datos con headers CORS permisivos
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[PAMI proxy] Error al conectar con PAMI:', err);
    return NextResponse.json(
      { error: 'No se pudo conectar con PAMI. Verificá tu conexión.' },
      { status: 502 }
    );
  }
}
