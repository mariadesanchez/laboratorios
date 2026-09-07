'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';

export default function ObrasSociales() {
    const [searchTerm, setSearchTerm] = useState('');
    const [codigos, setCodigos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchCodigos() {
            try {
                const { data, error } = await supabase
                    .from('codigos')
                    .select('obra_social, codigo, nota')
                    .order('obra_social', { ascending: true });

                if (error) throw error;
                setCodigos(data || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchCodigos();
    }, []);

    const filtered = codigos.filter(row =>
        row.obra_social?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.nota?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <Navbar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            <div className="table-wrapper">
                {loading && (
                    <div className="loading-message">
                        <div className="spinner"></div>
                        <span>Cargando códigos...</span>
                    </div>
                )}
                {error && (
                    <div className="error-message">
                        ⚠️ Error al cargar datos: {error}
                    </div>
                )}
                {!loading && !error && (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Obra Social</th>
                                    <th>Código</th>
                                    <th>Nota</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} style={{ textAlign: 'center', color: '#888', padding: '40px' }}>
                                            No se encontraron resultados para &quot;{searchTerm}&quot;
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((row, i) => (
                                        <tr key={i}>
                                            <td>{row.obra_social}</td>
                                            <td style={{ fontWeight: '700', color: '#12439a', letterSpacing: '0.5px' }}>
                                                {row.codigo}
                                            </td>
                                            <td style={{ color: '#c0392b', fontSize: '13px' }}>
                                                {row.nota || ''}
                                            </td>
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
