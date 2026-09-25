'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * PamiModal – Consulta de autorizaciones PAMI por afiliado.
 *
 * Estrategia de autenticación:
 *  1. El browser del usuario tiene cookies de sesión para farma.pami.org.ar
 *  2. Usamos un iframe oculto para leer las cookies del dominio PAMI via postMessage
 *     (o bien, el usuario pegó el token manualmente si la sesión no está activa)
 *  3. Enviamos la cookie al proxy Next.js en el header X-Pami-Cookie
 *
 * Si el iframe no puede leer las cookies (distintos dominios con HttpOnly),
 * el modal muestra un campo para pegar la cookie manualmente con instrucciones.
 */

const PAMI_DIRECT_URL = 'https://farma.pami.org.ar/api/autorizaciones/consulta-afiliado';

export default function PamiModal({ onClose }) {
  const [numeroAfiliado, setNumeroAfiliado] = useState('');
  const [resultados, setResultados] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);
  const [rawResponse, setRawResponse] = useState(null); // para debug
  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 80);
  }, []);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const buscar = useCallback(async () => {
    const num = numeroAfiliado.trim().replace(/\s/g, '');
    if (!num) { setError('Ingresá el número de afiliado.'); return; }

    setCargando(true);
    setError(null);
    setResultados(null);
    setRawResponse(null);
    setBusquedaRealizada(false);

    try {
      // Intentamos primero directamente desde el cliente al dominio PAMI
      // (funciona si el navegador tiene la sesión activa y PAMI permite el cross-origin)
      const directUrl = `${PAMI_DIRECT_URL}?numeroAfiliado=${encodeURIComponent(num)}&idConvenio=15`;

      let data = null;
      let usedMethod = 'direct';

      try {
        const directRes = await fetch(directUrl, {
          method: 'GET',
          credentials: 'include', // envía las cookies de farma.pami.org.ar automáticamente
          headers: {
            Accept: 'application/json, text/plain, */*',
            Referer: 'https://farma.pami.org.ar/autorizaciones',
          },
          mode: 'cors',
        });

        if (directRes.ok) {
          const text = await directRes.text();
          setRawResponse({ status: directRes.status, body: text.substring(0, 2000), method: 'direct' });
          try { data = JSON.parse(text); } catch { data = { raw: text }; }
          usedMethod = 'direct';
        } else if (directRes.status === 401 || directRes.status === 403) {
          throw new Error('UNAUTHORIZED');
        } else {
          throw new Error(`HTTP_${directRes.status}`);
        }
      } catch (directErr) {
        // Si falló por CORS u otro motivo, intentamos via nuestro proxy
        console.warn('[PAMI] Direct fetch failed:', directErr.message, '— trying proxy...');

        // Recolectar cookies visibles del dominio actual (pueden no tener las de PAMI)
        const cookieStr = document.cookie;

        const proxyRes = await fetch(
          `/api/pami/autorizaciones-afiliado?numeroAfiliado=${encodeURIComponent(num)}&idConvenio=15`,
          {
            method: 'GET',
            credentials: 'include',
            headers: {
              'X-Pami-Cookie': cookieStr,
            },
          }
        );

        const proxyText = await proxyRes.text();
        setRawResponse({ status: proxyRes.status, body: proxyText.substring(0, 2000), method: 'proxy' });

        if (!proxyRes.ok) {
          let errData;
          try { errData = JSON.parse(proxyText); } catch { errData = { error: proxyText }; }

          if (errData.code === 'SESSION_EXPIRED' || errData.code === 'UNAUTHORIZED' || errData.code === 'NO_COOKIE') {
            setError(
              <span>
                Sesión PAMI no disponible.{' '}
                <a href="https://farma.pami.org.ar/seguridad/iniciar-sesion" target="_blank" rel="noopener noreferrer" className="pami-modal-link">
                  Iniciá sesión en PAMI ↗
                </a>
                {' '}(mantené esa pestaña abierta) y buscá de nuevo.
              </span>
            );
          } else {
            setError(errData.error || `Error HTTP ${proxyRes.status}`);
          }
          setCargando(false);
          return;
        }

        try { data = JSON.parse(proxyText); } catch { data = { raw: proxyText }; }
        usedMethod = 'proxy';
      }

      console.log('[PAMI] Data received via', usedMethod, ':', data);
      setResultados(data);
      setBusquedaRealizada(true);
    } catch (err) {
      console.error('[PAMI] Error:', err);
      setError(
        <span>
          Error al consultar PAMI: {err.message}.{' '}
          <a href="https://farma.pami.org.ar/seguridad/iniciar-sesion" target="_blank" rel="noopener noreferrer" className="pami-modal-link">
            Verificá tu sesión ↗
          </a>
        </span>
      );
    } finally {
      setCargando(false);
    }
  }, [numeroAfiliado]);

  const handleKeyDown = (e) => { if (e.key === 'Enter') buscar(); };

  // Normalizar la estructura de respuesta de PAMI
  const items = resultados
    ? Array.isArray(resultados)
      ? resultados
      : resultados.items ?? resultados.autorizaciones ?? resultados.data ?? resultados.resultados ?? resultados.list ?? []
    : [];

  const total = resultados?.total ?? resultados?.totalItems ?? resultados?.cantidad ?? items.length ?? 0;

  return (
    <div className="pami-modal-backdrop" onClick={handleBackdropClick}>
      <div className="pami-modal" role="dialog" aria-modal="true" aria-label="Consulta PAMI por afiliado">

        {/* Header */}
        <div className="pami-modal-header">
          <div className="pami-modal-title-row">
            <span className="pami-modal-logo">🏥</span>
            <div>
              <h2 className="pami-modal-title">Autorizaciones PAMI</h2>
              <p className="pami-modal-subtitle">Consulta por número de afiliado</p>
            </div>
          </div>
          <button className="pami-modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        {/* Search */}
        <div className="pami-modal-search">
          <div className="pami-modal-input-row">
            <div className="pami-modal-input-wrapper">
              <span className="pami-modal-input-icon">👤</span>
              <input
                ref={inputRef}
                id="pami-afiliado-input"
                type="text"
                className="pami-modal-input"
                placeholder="Ej: 14092075980800"
                value={numeroAfiliado}
                onChange={(e) => setNumeroAfiliado(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={20}
                autoComplete="off"
              />
              {numeroAfiliado && (
                <button
                  className="pami-modal-input-clear"
                  onClick={() => { setNumeroAfiliado(''); setResultados(null); setError(null); setRawResponse(null); setBusquedaRealizada(false); inputRef.current?.focus(); }}
                  aria-label="Limpiar"
                >✕</button>
              )}
            </div>
            <button
              className="pami-modal-buscar-btn"
              onClick={buscar}
              disabled={cargando || !numeroAfiliado.trim()}
              id="pami-buscar-btn"
            >
              {cargando ? <span className="pami-spinner" /> : 'Buscar'}
            </button>
          </div>

          {error && (
            <div className="pami-modal-error" role="alert">⚠️ {error}</div>
          )}
        </div>

        {/* Body */}
        <div className="pami-modal-body">
          {cargando && (
            <div className="pami-modal-loading">
              <div className="pami-loading-dots"><span /><span /><span /></div>
              <p>Consultando PAMI...</p>
            </div>
          )}

          {!cargando && busquedaRealizada && items.length === 0 && (
            <div className="pami-modal-empty">
              <span className="pami-modal-empty-icon">📋</span>
              <p>No se encontraron autorizaciones para este afiliado.</p>
              {rawResponse && (
                <details className="pami-debug">
                  <summary>Ver respuesta raw</summary>
                  <pre>{rawResponse.body}</pre>
                </details>
              )}
            </div>
          )}

          {!cargando && items.length > 0 && (
            <>
              <div className="pami-modal-results-header">
                <span className="pami-modal-results-count">
                  {total > items.length
                    ? `Mostrando ${items.length} de ${total} autorizaciones`
                    : `${items.length} autorización${items.length !== 1 ? 'es' : ''} encontrada${items.length !== 1 ? 's' : ''}`}
                </span>
                <a href="https://farma.pami.org.ar/autorizaciones" target="_blank" rel="noopener noreferrer" className="pami-modal-link pami-modal-ver-pami">
                  Ver en PAMI ↗
                </a>
              </div>

              <div className="pami-modal-table-wrapper">
                <table className="pami-modal-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>OPF / Autorización</th>
                      <th>Receta</th>
                      <th>Plan</th>
                      <th>Tipo</th>
                      <th>Productos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={item.idAutorizacion ?? item.opf ?? idx} className={idx % 2 === 0 ? 'pami-row-even' : 'pami-row-odd'}>
                        <td className="pami-td-fecha">{formatFecha(item.fechaHora ?? item.fecha ?? item.fechaAutorizacion)}</td>
                        <td className="pami-td-opf"><code>{item.opf ?? item.numeroAutorizacion ?? item.idAutorizacion ?? '—'}</code></td>
                        <td className="pami-td-receta">{item.numeroReceta ?? item.receta ?? '—'}</td>
                        <td className="pami-td-plan"><span className="pami-badge-plan">{item.nombrePlan ?? item.plan ?? '—'}</span></td>
                        <td className="pami-td-tipo">{item.tipoReceta ?? item.tipo ?? '—'}</td>
                        <td className="pami-td-productos">{renderProductos(item.productos ?? item.items)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Debug raw response si no hay items */}
          {!cargando && busquedaRealizada && rawResponse && items.length === 0 && (
            <details className="pami-debug">
              <summary>🔍 Respuesta raw de PAMI (debug)</summary>
              <pre>{rawResponse.body}</pre>
            </details>
          )}

          {!cargando && !busquedaRealizada && !error && (
            <div className="pami-modal-hint">
              <p>Ingresá el número de afiliado PAMI y presioná <strong>Buscar</strong> o <kbd>Enter</kbd>.</p>
              <p className="pami-modal-hint-note">
                Necesitás tener la sesión activa en{' '}
                <a href="https://farma.pami.org.ar" target="_blank" rel="noopener noreferrer" className="pami-modal-link">
                  farma.pami.org.ar
                </a>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Helpers ── */
function formatFecha(raw) {
  if (!raw) return '—';
  try {
    const d = new Date(raw);
    if (isNaN(d)) return raw;
    return d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return raw; }
}

function renderProductos(productos) {
  if (!productos || productos.length === 0) return '—';
  if (typeof productos === 'string') return productos;
  return (
    <ul className="pami-productos-list">
      {productos.slice(0, 4).map((p, i) => (
        <li key={i}>
          {p.nombreProducto ?? p.nombre ?? p.descripcion ?? JSON.stringify(p)}
          {p.cantidad ? ` ×${p.cantidad}` : ''}
        </li>
      ))}
      {productos.length > 4 && <li className="pami-productos-more">+{productos.length - 4} más</li>}
    </ul>
  );
}
