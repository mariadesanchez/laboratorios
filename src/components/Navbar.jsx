'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function Navbar({ searchTerm, setSearchTerm }) {
    const pathname = usePathname();
    const { user, loading, isAdmin, signInWithGoogle, signOut } = useAuth();

    return (
        <nav className="tkl-nav">
            <div className="nav-container">
                <div className="nav-logo"></div>
                <div className="search-container">
                    <input
                        type="search"
                        id="searchInput"
                        placeholder="Buscar..."
                        autoComplete="off"
                        value={searchTerm ?? ''}
                        onChange={(e) => setSearchTerm && setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="nav-buttons">
                    <Link href="/" className={`nav-btn ${pathname === '/' ? 'active' : ''}`}>
                        Laboratorios
                    </Link>
                    <Link href="/obras_sociales" className={`nav-btn ${pathname === '/obras_sociales' ? 'active' : ''}`}>
                        Códigos
                    </Link>
                    
                    {/* Auth Controls */}
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {!loading && (
                            user ? (
                                <>
                                    {isAdmin && <span style={{ fontSize: '12px', color: '#fff', opacity: 0.8, display: 'none' }} className="user-email-mobile-hide">{user.email}</span>}
                                    <button 
                                        onClick={signOut}
                                        style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '15px', cursor: 'pointer', fontSize: '12px' }}
                                    >
                                        Salir
                                    </button>
                                </>
                            ) : (
                                <button 
                                    onClick={signInWithGoogle}
                                    style={{ background: '#f39200', color: '#000', border: 'none', padding: '6px 12px', borderRadius: '15px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                                >
                                    Ingresar
                                </button>
                            )
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
