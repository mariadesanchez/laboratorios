'use client';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function VademecumCeliacos() {
  const [medicamento, setMedicamento] = useState('');
  const [laboratorio, setLaboratorio] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!medicamento.trim() && !laboratorio.trim()) {
      setError('Ingresá al menos el nombre del medicamento o el laboratorio.');
      return;
    }
    setError('');
    setLoading(true);
    setResults(null);

    try {
      const res = await fetch('/api/vademecum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicamento: medicamento.trim(),
          laboratorio: laboratorio.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error en la búsqueda');
      setResults(data.results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMedicamento('');
    setLaboratorio('');
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
          <div className="vd-form-grid">
            <div className="vd-field">
              <label htmlFor="vd-med" className="vd-label">
                <span className="vd-label-icon">💊</span>
                Nombre Comercial
              </label>
              <input
                id="vd-med"
                type="text"
                className="vd-input"
                placeholder="Ej: Lotrial, Enalapril..."
                value={medicamento}
                onChange={(e) => setMedicamento(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="vd-field">
              <label htmlFor="vd-lab" className="vd-label">
                <span className="vd-label-icon">🏭</span>
                Laboratorio
              </label>
              <input
                id="vd-lab"
                type="text"
                className="vd-input"
                placeholder="Ej: Roemmers, Gador..."
                value={laboratorio}
                onChange={(e) => setLaboratorio(e.target.value)}
                autoComplete="off"
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
            {(results !== null || medicamento || laboratorio) && (
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
                <span className="vd-results-badge">{medicamento || '—'} · {laboratorio || 'Todos los labs'}</span>
              )}
            </div>

            {results.length === 0 ? (
              <div className="vd-empty">
                <div className="vd-empty-icon">🔍</div>
                <p>No se encontraron medicamentos con los filtros indicados.</p>
                <p className="vd-empty-sub">Probá con un nombre más corto o sin filtro de laboratorio.</p>
              </div>
            ) : (
              <div className="vd-table-wrap">
                <table className="vd-table">
                  <thead>
                    <tr>
                      <th>Registro</th>
                      <th>Laboratorio</th>
                      <th>Nombre Comercial</th>
                      <th>Forma</th>
                      <th>Presentación</th>
                      <th>Droga / Principio Activo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((item, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'vd-row-even' : 'vd-row-odd'}>
                        <td className="vd-cell-mono">{item.registro}</td>
                        <td>{item.laboratorio}</td>
                        <td className="vd-cell-bold">{item.nombreComercial}</td>
                        <td>
                          <span className="vd-pill">{item.forma}</span>
                        </td>
                        <td>{item.presentacion}</td>
                        <td className="vd-cell-droga">{item.droga}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
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
