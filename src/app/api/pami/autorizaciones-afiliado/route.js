/**
 * API Route: /api/pami/autorizaciones-afiliado
 *
 * Proxy hacia PAMI farma. Recibe la cookie de sesión PAMI desde
 * el header X-Pami-Cookie (enviado por el cliente) y la reenvía.
 *
 * Query params:
 *   - numeroAfiliado: string (requerido)
 *   - idConvenio: string (opcional, default 15 = PAMI)
 *   - fechaDesde: string ISO (opcional)
 *   - fechaHasta: string ISO (opcional)
 *   - pagina: number (opcional, default 1)
 *
 * Header requerido:
 *   - X-Pami-Cookie: <valor completo del header Cookie de PAMI>
 *     (lo envía el cliente, que sí tiene acceso a las cookies de pami.org.ar)
 */

import { NextResponse } from 'next/server';

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

  // La cookie la envía el cliente en el header personalizado X-Pami-Cookie
  const pamiCookie = request.headers.get('x-pami-cookie') || '';

  if (!pamiCookie) {
    return NextResponse.json(
      {
        error: 'No hay sesión PAMI disponible. Iniciá sesión en farma.pami.org.ar y volvé a intentarlo.',
        code: 'NO_COOKIE',
      },
      { status: 401 }
    );
  }

  // Construir los query params para PAMI
  const pamiParams = new URLSearchParams();
  pamiParams.set('numeroAfiliado', numeroAfiliado);
  pamiParams.set('idConvenio', searchParams.get('idConvenio') || '15');

  if (searchParams.get('fechaDesde')) {
    pamiParams.set('fechaDesde', searchParams.get('fechaDesde'));
  }
  if (searchParams.get('fechaHasta')) {
    pamiParams.set('fechaHasta', searchParams.get('fechaHasta'));
  }
  if (searchParams.get('pagina')) {
    pamiParams.set('pagina', searchParams.get('pagina'));
  }

  const pamiUrl = `${PAMI_ENDPOINT}?${pamiParams.toString()}`;

  console.log('[PAMI proxy] Calling:', pamiUrl);
  console.log('[PAMI proxy] Cookie length:', pamiCookie.length);

  try {
    const pamiResponse = await fetch(pamiUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json, text/plain, */*',
        Cookie: pamiCookie,
        Referer: `${PAMI_BASE}/autorizaciones`,
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      redirect: 'manual',
    });

    console.log('[PAMI proxy] Response status:', pamiResponse.status);

    // 302 → sesión expirada
    if (pamiResponse.status === 302 || pamiResponse.status === 301) {
      return NextResponse.json(
        {
          error: 'Sesión PAMI expirada. Iniciá sesión en farma.pami.org.ar y volvé a intentarlo.',
          code: 'SESSION_EXPIRED',
        },
        { status: 401 }
      );
    }

    if (pamiResponse.status === 401 || pamiResponse.status === 403) {
      return NextResponse.json(
        {
          error: 'Sin autorización en PAMI. Verificá que tenés la sesión activa.',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    if (!pamiResponse.ok) {
      const errorText = await pamiResponse.text();
      console.error('[PAMI proxy] Error response:', errorText.substring(0, 200));
      return NextResponse.json(
        {
          error: `Error de PAMI: HTTP ${pamiResponse.status}`,
          detail: errorText.substring(0, 500),
        },
        { status: pamiResponse.status }
      );
    }

    const contentType = pamiResponse.headers.get('content-type') || '';
    let data;

    if (contentType.includes('application/json')) {
      data = await pamiResponse.json();
    } else {
      const text = await pamiResponse.text();
      console.log('[PAMI proxy] Non-JSON response:', text.substring(0, 300));
      // Intentar parsear igual por si viene sin content-type correcto
      try {
        data = JSON.parse(text);
      } catch {
        return NextResponse.json(
          { error: 'PAMI devolvió una respuesta inesperada.', detail: text.substring(0, 300) },
          { status: 502 }
        );
      }
    }

    return NextResponse.json(data, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.error('[PAMI proxy] Fetch error:', err?.message, err?.cause?.code);
    return NextResponse.json(
      {
        error: 'No se pudo conectar con PAMI.',
        detail: err?.message,
        code: err?.cause?.code,
      },
      { status: 502 }
    );
  }
}
