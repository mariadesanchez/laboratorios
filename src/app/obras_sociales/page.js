'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';

// Export URL pública del Google Sheet (CSV)
// Si el sheet no es público, deberás compartirlo como "Cualquiera con el link puede ver"
const SHEET_CSV_URL =
    'https://docs.google.com/spreadsheets/d/17c9DdhrTiHITpimja9--Gm7R9ZG_5lc0CkkER0crEP0/export?format=csv&gid=340905119';

function parseCSV(text) {
    const lines = text.trim().split('\n');
    if (lines.length === 0) return { headers: [], rows: [] };
    const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
    const rows = lines.slice(1).map(line => {
        // Handle quoted fields (may contain commas)
        const cols = [];
        let inQuote = false, current = '';
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
                inQuote = !inQuote;
            } else if (ch === ',' && !inQuote) {
                cols.push(current.trim());
                current = '';
            } else {
                current += ch;
            }
        }
        cols.push(current.trim());
        return cols;
    });
    return { headers, rows };
}

export default function ObrasSociales() {
    const [searchTerm, setSearchTerm] = useState('');
    const [data, setData] = useState({ headers: [], rows: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchSheet() {
            try {
                const res = await fetch(SHEET_CSV_URL);
                if (!res.ok) throw new Error('No se pudo cargar el sheet. ¿Está compartido como público?');
                const text = await res.text();
                setData(parseCSV(text));
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchSheet();
    }, []);

    const filteredRows = data.rows.filter(row =>
        row.some(cell => cell.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <>
            <Navbar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            <div className="table-wrapper">
                {loading && (
                    <div className="loading-message">
                        <div className="spinner"></div>
                        <span>Cargando datos del sheet...</span>
                    </div>
                )}
                {error && (
                    <div className="error-message">
                        ⚠️ Error: {error}
                        <br />
                        <small>Asegurate de que el Google Sheet esté compartido como <strong>Cualquiera con el link puede ver</strong>.</small>
                    </div>
                )}
                {!loading && !error && (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    {data.headers.map((h, i) => (
                                        <th key={i}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={data.headers.length} style={{ textAlign: 'center', color: '#888', padding: '40px' }}>
                                            No se encontraron resultados para &quot;{searchTerm}&quot;
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRows.map((row, ri) => (
                                        <tr key={ri}>
                                            {row.map((cell, ci) => (
                                                <td key={ci}>{cell}</td>
                                            ))}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}
