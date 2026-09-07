'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar({ searchTerm, setSearchTerm }) {
    const pathname = usePathname();

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
                </div>
            </div>
        </nav>
    );
}
