'use client';
import { useState } from 'react';
import Navbar from '@/components/Navbar';

export default function VademecumCeliacos() {
  const [medicamento, setMedicamento] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debug, setDebug] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!medicamento.trim()) {
      setError('Ingresá el nombre comercial del medicamento.');
      return;
    }
    setError('');
    setLoading(true);
    setResults(null);
    setDebug(null);

    try {
      const res = await fetch('/api/vademecum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medicamento: medicamento.trim() }),
      });

      let data;
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Respuesta inválida del servidor: ${text.slice(0, 200)}`);
      }

      if (!res.ok) throw new Error(data.error || 'Error en la búsqueda');

      setResults(data.results ?? []);
      if (data.debug) setDebug(data.debug);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMedicamento('');
    setResults(null);
    setError('');
  };

  return (
    <>
      <Navbar />
      <div className="vd-page">
        {/* Header */}
        <div className="vd-header">
          <div className="vd-header-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="40" height="40">
              <path d="M9 3H4a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20 3h-5a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 14H4a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M17.5 14v6M14.5 17h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h1 className="vd-title">Vademecum Celíacos</h1>
            <p className="vd-subtitle">Consultá medicamentos aptos en el Vademecum PAMI</p>
          </div>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="vd-form">
          <div className="vd-form-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="vd-field">
              <label htmlFor="vd-med" className="vd-label">
                <span className="vd-label-icon">💊</span>
                Nombre Comercial
              </label>
              <input
                id="vd-med"
                type="text"
                className="vd-input"
                placeholder="Ej: Lotrial, Enalapril, Amoxidal..."
                value={medicamento}
                onChange={(e) => setMedicamento(e.target.value)}
                autoComplete="off"
                required
              />
            </div>
          </div>

          {error && (
            <div className="vd-error">
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="vd-actions">
            <button type="submit" className="vd-btn-search" disabled={loading}>
              {loading ? (
                <>
                  <span className="vd-spinner" />
                  Consultando PAMI...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                  Buscar
                </>
              )}
            </button>
            {(results !== null || medicamento) && (
              <button type="button" className="vd-btn-clear" onClick={handleClear}>
                Limpiar
              </button>
            )}
          </div>

          {loading && (
            <p className="vd-loading-note">
              ⏳ El vademecum PAMI puede demorar entre 10 y 20 segundos en responder...
            </p>
          )}
        </form>

        {/* Results */}
        {results !== null && (
          <div className="vd-results">
            <div className="vd-results-header">
              <h2 className="vd-results-title">
                {results.length === 0
                  ? 'Sin resultados'
                  : `${results.length} resultado${results.length !== 1 ? 's' : ''} encontrado${results.length !== 1 ? 's' : ''}`}
              </h2>
              {results.length > 0 && (
                <span className="vd-results-badge">{medicamento}</span>
              )}
            </div>

            {results.length === 0 ? (
              <div className="vd-empty">
                <div className="vd-empty-icon">🔍</div>
                <p>No se encontraron medicamentos con los filtros indicados.</p>
                <p className="vd-empty-sub">Probá con un nombre más corto o una variante comercial.</p>
              </div>
            ) : (
              <div className="vd-table-wrap">
                <table className="vd-table">
                  <thead>
                    <tr>
                      <th>Apto Celíaco</th>
                      <th>Registro</th>
                      <th>Laboratorio</th>
                      <th>Nombre Comercial</th>
                      <th>Forma</th>
                      <th>Presentación</th>
                      <th>Código de Barras</th>
                      <th>Droga / Principio Activo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((item, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'vd-row-even' : 'vd-row-odd'}>
                        <td style={{ textAlign: 'center', fontSize: '1.2rem' }}>
                          {item.isAptoCeliaco ? '✅' : '❌'}
                        </td>
                        <td className="vd-cell-mono">{item.registro}</td>
                        <td>{item.laboratorio}</td>
                        <td className="vd-cell-bold">{item.nombreComercial}</td>
                        <td>
                          <span className="vd-pill">{item.forma}</span>
                        </td>
                        <td>{item.presentacion}</td>
                        <td className="vd-cell-mono">{item.codigoBarras}</td>
                        <td className="vd-cell-droga">{item.droga}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Debug info (shown when results are empty but debug info exists) */}
        {debug && (
          <details className="vd-debug">
            <summary>🛠 Información de diagnóstico (debug)</summary>
            <pre style={{ fontSize: '11px', overflow: 'auto', maxHeight: '300px', whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(debug, null, 2)}
            </pre>
          </details>
        )}

        {/* Footer source */}
        <div className="vd-footer">
          <a
            href="https://servicios.pami.org.ar/vademecum/views/consultaPublica/listado.zul"
            target="_blank"
            rel="noopener noreferrer"
            className="vd-source-link"
          >
            🔗 Fuente: Vademecum PAMI (Consulta Pública)
          </a>
        </div>
      </div>
    </>
  );
}
