'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * PamiModal – Componente modal para consulta de autorizaciones por afiliado PAMI.
 * 
 * Aparece al clickear el botón "PAMI" en la Navbar.
 * El usuario ingresa el número de afiliado y se listan todas las autorizaciones.
 */
export default function PamiModal({ onClose }) {
  const [numeroAfiliado, setNumeroAfiliado] = useState('');
  const [resultados, setResultados] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);
  const inputRef = useRef(null);
  const modalRef = useRef(null);

  // Focus en el input al abrir
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 80);
  }, []);

  // Cerrar con Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Click fuera del modal
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const buscar = useCallback(async () => {
    const num = numeroAfiliado.trim().replace(/\s/g, '');
    if (!num) {
      setError('Ingresá el número de afiliado.');
      return;
    }

    setCargando(true);
    setError(null);
    setResultados(null);
    setBusquedaRealizada(false);

    try {
      const res = await fetch(
        `/api/pami/autorizaciones-afiliado?numeroAfiliado=${encodeURIComponent(num)}`,
        { credentials: 'include' }
      );
      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'SESSION_EXPIRED') {
          setError(
            <>
              Sesión PAMI expirada.{' '}
              <a
                href="https://farma.pami.org.ar/seguridad/iniciar-sesion"
                target="_blank"
                rel="noopener noreferrer"
                className="pami-modal-link"
              >
                Iniciá sesión aquí
              </a>{' '}
              y volvé a buscar.
            </>
          );
        } else {
          setError(data.error || 'Error al consultar PAMI.');
        }
        setCargando(false);
        return;
      }

      setResultados(data);
      setBusquedaRealizada(true);
    } catch (err) {
      setError('No se pudo conectar. Verificá tu conexión.');
    } finally {
      setCargando(false);
    }
  }, [numeroAfiliado]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') buscar();
  };

  // Normalizar la respuesta: puede venir como array directo, { items }, { autorizaciones }, { data }, etc.
  const items = resultados
    ? Array.isArray(resultados)
      ? resultados
      : resultados.items ?? resultados.autorizaciones ?? resultados.data ?? resultados.resultados ?? []
    : [];

  const total = resultados?.total ?? resultados?.totalItems ?? items.length ?? 0;

  return (
    <div className="pami-modal-backdrop" onClick={handleBackdropClick}>
      <div className="pami-modal" ref={modalRef} role="dialog" aria-modal="true" aria-label="Consulta PAMI por afiliado">
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
                placeholder="Ej: 15043937410100"
                value={numeroAfiliado}
                onChange={(e) => setNumeroAfiliado(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={20}
                autoComplete="off"
              />
              {numeroAfiliado && (
                <button
                  className="pami-modal-input-clear"
                  onClick={() => { setNumeroAfiliado(''); setResultados(null); setError(null); setBusquedaRealizada(false); inputRef.current?.focus(); }}
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
              {cargando ? (
                <span className="pami-spinner" />
              ) : (
                'Buscar'
              )}
            </button>
          </div>

          {error && (
            <div className="pami-modal-error" role="alert">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Resultados */}
        <div className="pami-modal-body">
          {cargando && (
            <div className="pami-modal-loading">
              <div className="pami-loading-dots">
                <span /><span /><span />
              </div>
              <p>Consultando PAMI...</p>
            </div>
          )}

          {!cargando && busquedaRealizada && items.length === 0 && (
            <div className="pami-modal-empty">
              <span className="pami-modal-empty-icon">📋</span>
              <p>No se encontraron autorizaciones para este afiliado.</p>
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
                <a
                  href={`https://farma.pami.org.ar/autorizaciones`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pami-modal-link pami-modal-ver-pami"
                >
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
                        <td className="pami-td-fecha">
                          {formatFecha(item.fechaHora ?? item.fecha ?? item.fechaAutorizacion)}
                        </td>
                        <td className="pami-td-opf">
                          <code>{item.opf ?? item.numeroAutorizacion ?? item.idAutorizacion ?? '—'}</code>
                        </td>
                        <td className="pami-td-receta">
                          {item.numeroReceta ?? item.receta ?? '—'}
                        </td>
                        <td className="pami-td-plan">
                          <span className="pami-badge-plan">
                            {item.nombrePlan ?? item.plan ?? '—'}
                          </span>
                        </td>
                        <td className="pami-td-tipo">
                          {item.tipoReceta ?? item.tipo ?? '—'}
                        </td>
                        <td className="pami-td-productos">
                          {renderProductos(item.productos ?? item.items)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {!cargando && !busquedaRealizada && !error && (
            <div className="pami-modal-hint">
              <p>Ingresá el número de afiliado PAMI y presioná <strong>Buscar</strong> o <kbd>Enter</kbd>.</p>
              <p className="pami-modal-hint-note">Necesitás tener la sesión activa en <a href="https://farma.pami.org.ar" target="_blank" rel="noopener noreferrer" className="pami-modal-link">farma.pami.org.ar</a>.</p>
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
    return d.toLocaleString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return raw;
  }
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
