'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect, useRef } from 'react';

export default function Navbar({ searchTerm, setSearchTerm }) {
    const pathname = usePathname();
    const { user, loading, isAdmin, signInWithGoogle, signOut } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    // Cerrar el menú al hacer click fuera
    useEffect(() => {
        function handleClickOutside(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        }
        if (menuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [menuOpen]);

    // Cerrar el menú al navegar
    useEffect(() => {
        setMenuOpen(false);
    }, [pathname]);

    const authButton = !loading && (
        user ? (
            <button
                onClick={() => { signOut(); setMenuOpen(false); }}
                className="nav-btn nav-btn-auth"
            >
                Salir
            </button>
        ) : (
            <button
                onClick={() => { signInWithGoogle(); setMenuOpen(false); }}
                className="nav-btn nav-btn-ingresar"
            >
                Ingresar
            </button>
        )
    );

    return (
        <nav className="tkl-nav" ref={menuRef}>
            <div className="nav-container">
                <div className="nav-logo"></div>

                {/* Search bar */}
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

                {/* Desktop buttons */}
                <div className="nav-buttons" style={{ marginLeft: 'auto' }}>
                    <Link href="/" className={`nav-btn ${pathname === '/' ? 'active' : ''}`}>
                        Laboratorios
                    </Link>
                    <Link href="/obras_sociales" className={`nav-btn ${pathname === '/obras_sociales' ? 'active' : ''}`}>
                        Códigos
                    </Link>
                    <Link href="/vademecum_celiacos" className={`nav-btn ${pathname === '/vademecum_celiacos' ? 'active' : ''}`}>
                        Celíacos
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {authButton}
                    </div>
                </div>

                {/* Hamburger button (solo mobile) */}
                <button
                    className={`hamburger-btn ${menuOpen ? 'open' : ''}`}
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Menú"
                    aria-expanded={menuOpen}
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>

            {/* Dropdown mobile menu */}
            <div className={`mobile-menu ${menuOpen ? 'mobile-menu--open' : ''}`}>
                <Link href="/" className={`mobile-nav-btn ${pathname === '/' ? 'active' : ''}`}>
                    🏠 Laboratorios
                </Link>
                <Link href="/obras_sociales" className={`mobile-nav-btn ${pathname === '/obras_sociales' ? 'active' : ''}`}>
                    📋 Códigos
                </Link>
                <Link href="/vademecum_celiacos" className={`mobile-nav-btn ${pathname === '/vademecum_celiacos' ? 'active' : ''}`}>
                    🌾 Celíacos
                </Link>
                <div className="mobile-menu-divider"></div>
                <div className="mobile-auth">
                    {authButton}
                </div>
            </div>
        </nav>
    );
}
