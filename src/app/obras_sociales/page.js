'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';

const EMPTY_ROW = { obra_social: '', codigo: '', nota: '' };

export default function ObrasSociales() {
    const [searchTerm, setSearchTerm] = useState('');
    const [codigos, setCodigos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { isAdmin } = useAuth();

    // Modal state
    const [modal, setModal] = useState(null); // null | { mode: 'add' | 'edit' | 'delete', row: {} }
    const [form, setForm] = useState(EMPTY_ROW);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    async function fetchCodigos() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('codigos')
                .select('id, obra_social, codigo, nota')
                .order('obra_social', { ascending: true });
            if (error) throw error;
            setCodigos(data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { fetchCodigos(); }, []);

    function showToast(msg, type = 'success') {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    }

    function openAdd() {
        setForm(EMPTY_ROW);
        setModal({ mode: 'add' });
    }

    function openEdit(row) {
        setForm({ obra_social: row.obra_social, codigo: row.codigo, nota: row.nota || '' });
        setModal({ mode: 'edit', row });
    }

    function openDelete(row) {
        setModal({ mode: 'delete', row });
    }

    function closeModal() {
        setModal(null);
        setForm(EMPTY_ROW);
    }

    async function handleSave() {
        setSaving(true);
        try {
            if (modal.mode === 'add') {
                const { error } = await supabase.from('codigos').insert([{
                    obra_social: form.obra_social.trim(),
                    codigo: form.codigo.trim(),
                    nota: form.nota.trim() || null,
                }]);
                if (error) throw error;
                showToast('✅ Fila agregada correctamente');
            } else if (modal.mode === 'edit') {
                const { error } = await supabase.from('codigos').update({
                    obra_social: form.obra_social.trim(),
                    codigo: form.codigo.trim(),
                    nota: form.nota.trim() || null,
                }).eq('id', modal.row.id);
                if (error) throw error;
                showToast('✅ Fila actualizada correctamente');
            }
            closeModal();
            await fetchCodigos();
        } catch (err) {
            showToast('❌ Error: ' + err.message, 'error');
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        setSaving(true);
        try {
            const { error } = await supabase.from('codigos').delete().eq('id', modal.row.id);
            if (error) throw error;
            showToast('🗑️ Fila eliminada');
            closeModal();
            await fetchCodigos();
        } catch (err) {
            showToast('❌ Error: ' + err.message, 'error');
        } finally {
            setSaving(false);
        }
    }

    const filtered = codigos.filter(row =>
        row.obra_social?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.nota?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <Navbar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
                    background: toast.type === 'error' ? '#c0392b' : '#27ae60',
                    color: 'white', padding: '12px 20px', borderRadius: '8px',
                    fontWeight: '600', fontSize: '14px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                    animation: 'fadeIn 0.3s ease',
                }}>
                    {toast.msg}
                </div>
            )}

            <div className="table-wrapper">
                {/* Header with Add button */}
                {isAdmin && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                        <button onClick={openAdd} style={{
                            background: '#f39200', color: '#000', border: 'none',
                            padding: '10px 20px', borderRadius: '20px', fontWeight: '700',
                            fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                            gap: '8px', boxShadow: '0 2px 8px rgba(243,146,0,0.4)',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            + Agregar Obra Social
                        </button>
                    </div>
                )}

                {loading && (
                    <div className="loading-message">
                        <div className="spinner"></div>
                        <span>Cargando códigos...</span>
                    </div>
                )}
                {error && (
                    <div className="error-message">⚠️ Error al cargar datos: {error}</div>
                )}
                {!loading && !error && (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Obra Social</th>
                                    <th style={{ width: '110px', textAlign: 'center' }}>Código</th>
                                    <th>Nota</th>
                                    {isAdmin && <th style={{ width: '70px', textAlign: 'center' }}>Editar</th>}
                                    {isAdmin && <th style={{ width: '70px', textAlign: 'center' }}>Eliminar</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={isAdmin ? 5 : 3} style={{ textAlign: 'center', color: '#888', padding: '40px' }}>
                                            No se encontraron resultados{searchTerm ? ` para "${searchTerm}"` : ''}.
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((row) => (
                                        <tr key={row.id}>
                                            <td>{row.obra_social}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span style={{
                                                    display: 'inline-block',
                                                    width: '70px',
                                                    textAlign: 'center',
                                                    fontWeight: '700',
                                                    color: '#000',
                                                    background: '#f39200',
                                                    borderRadius: '6px',
                                                    padding: '4px 0',
                                                    letterSpacing: '0.5px',
                                                    fontSize: '13px',
                                                }}>
                                                    {row.codigo?.trim()}
                                                </span>
                                            </td>
                                            <td style={{ fontWeight: '700', fontSize: '13px' }}>
                                                {row.nota || ''}
                                            </td>
                                            {isAdmin && (
                                                <td style={{ textAlign: 'center' }}>
                                                    <button
                                                        onClick={() => openEdit(row)}
                                                        title="Editar"
                                                        style={{
                                                            background: 'none', border: 'none',
                                                            cursor: 'pointer', fontSize: '18px',
                                                            padding: '4px', lineHeight: 1,
                                                            filter: 'brightness(0)',
                                                        }}
                                                    >
                                                        ✏️
                                                    </button>
                                                </td>
                                            )}
                                            {isAdmin && (
                                                <td style={{ textAlign: 'center' }}>
                                                    <button
                                                        onClick={async () => {
                                                            if (window.confirm(`¿Deseas eliminar "${row.obra_social}"?`)) {
                                                                setModal({ mode: 'delete', row });
                                                                setSaving(true);
                                                                try {
                                                                    const { error } = await supabase.from('codigos').delete().eq('id', row.id);
                                                                    if (error) throw error;
                                                                    showToast('🗑️ Fila eliminada');
                                                                    await fetchCodigos();
                                                                } catch (err) {
                                                                    showToast('❌ Error: ' + err.message, 'error');
                                                                } finally {
                                                                    setSaving(false);
                                                                    setModal(null);
                                                                }
                                                            }
                                                        }}
                                                        title="Eliminar"
                                                        style={{
                                                            background: 'none', border: 'none',
                                                            cursor: 'pointer', fontSize: '18px',
                                                            padding: '4px', lineHeight: 1,
                                                            color: '#c0392b',
                                                        }}
                                                    >
                                                        🗑️
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {modal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, padding: '20px',
                }}>
                    <div style={{
                        background: 'white', borderRadius: '12px', padding: '32px',
                        width: '100%', maxWidth: '480px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                        animation: 'fadeIn 0.2s ease',
                    }}>
                        {modal.mode === 'delete' ? (
                            <>
                                <h2 style={{ margin: '0 0 16px', color: '#c0392b' }}>🗑️ Eliminar fila</h2>
                                <p style={{ color: '#444', marginBottom: '24px' }}>
                                    ¿Estás seguro que querés eliminar <strong>{modal.row.obra_social}</strong>?
                                    Esta acción no se puede deshacer.
                                </p>
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                    <button onClick={closeModal} style={btnSecondary}>Cancelar</button>
                                    <button onClick={handleDelete} disabled={saving} style={{ ...btnDanger, opacity: saving ? 0.7 : 1 }}>
                                        {saving ? 'Eliminando...' : 'Sí, eliminar'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h2 style={{ margin: '0 0 24px', color: '#12439a' }}>
                                    {modal.mode === 'add' ? '+ Agregar Obra Social' : '✏️ Editar Obra Social'}
                                </h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                                    <label style={labelStyle}>
                                        Obra Social *
                                        <input
                                            style={inputStyle}
                                            value={form.obra_social}
                                            onChange={e => setForm(f => ({ ...f, obra_social: e.target.value }))}
                                            placeholder="Ej: OSDE 40% ( OSD )"
                                        />
                                    </label>
                                    <label style={labelStyle}>
                                        Código *
                                        <input
                                            style={inputStyle}
                                            value={form.codigo}
                                            onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))}
                                            placeholder="Ej: OSD"
                                            maxLength={10}
                                        />
                                    </label>
                                    <label style={labelStyle}>
                                        Nota (opcional)
                                        <input
                                            style={inputStyle}
                                            value={form.nota}
                                            onChange={e => setForm(f => ({ ...f, nota: e.target.value }))}
                                            placeholder="Ej: Afiliado con la /"
                                        />
                                    </label>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                    <button onClick={closeModal} style={btnSecondary}>Cancelar</button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving || !form.obra_social.trim() || !form.codigo.trim()}
                                        style={{ ...btnPrimary, opacity: (saving || !form.obra_social.trim() || !form.codigo.trim()) ? 0.6 : 1 }}
                                    >
                                        {saving ? 'Guardando...' : 'Guardar'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
            `}</style>
        </>
    );
}

const labelStyle = {
    display: 'flex', flexDirection: 'column', gap: '6px',
    fontWeight: '600', color: '#333', fontSize: '14px',
};
const inputStyle = {
    padding: '10px 14px', borderRadius: '8px',
    border: '1.5px solid #ddd', fontSize: '14px',
    outline: 'none', fontFamily: 'inherit',
    transition: 'border-color 0.2s',
};
const btnPrimary = {
    background: '#f39200', color: '#000', border: 'none',
    padding: '10px 24px', borderRadius: '8px',
    fontWeight: '700', fontSize: '14px', cursor: 'pointer',
};
const btnSecondary = {
    background: '#f0f0f0', color: '#444', border: 'none',
    padding: '10px 24px', borderRadius: '8px',
    fontWeight: '600', fontSize: '14px', cursor: 'pointer',
};
const btnDanger = {
    background: '#c0392b', color: 'white', border: 'none',
    padding: '10px 24px', borderRadius: '8px',
    fontWeight: '700', fontSize: '14px', cursor: 'pointer',
};
