'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';

export default function Home() {
    const [searchTerm, setSearchTerm] = useState('');
    // Set de cajones a resaltar (puede ser más de uno)
    const [highlightedCajones, setHighlightedCajones] = useState(new Set());

    // Grid: 5 columnas × 9 filas = 45 cajones
    // Numeración: arriba→abajo primero, luego izquierda→derecha (columna por columna)
    const COLS = 5;
    const ROWS = 9;

    // Convierte índice de array → número de cajón
    const arrayIndexToCajon = (arrayIndex) => {
        const col = arrayIndex % COLS;
        const row = Math.floor(arrayIndex / COLS);
        return col * ROWS + row + 1;
    };

    // Devuelve el estilo naranja si el cajón está resaltado, o {} si no
    const getDrawerStyle = (arrayIndex) => {
        const cajonNum = arrayIndexToCajon(arrayIndex);
        if (highlightedCajones.has(cajonNum)) {
            return {
                background: 'linear-gradient(to bottom, #ffaf33 0%, #f39200 100%)',
                boxShadow: '0 0 15px rgba(243, 146, 0, 0.8), inset 0 2px 0 rgba(255,255,255,1)',
                borderBottom: '2px solid #b36b00',
                transform: 'translateY(-2px) scale(1.02)'
            };
        }
        return {};
    };

    // Modal state
    const [drawerModal, setDrawerModal] = useState({ open: false, cajon: null });
    const [drawerMeds, setDrawerMeds] = useState([]);
    const [loadingMeds, setLoadingMeds] = useState(false);

    useEffect(() => {
        const val = searchTerm.trim();

        const timer = setTimeout(async () => {
            if (val.length < 2) {
                setHighlightedCajones(new Set());
                return;
            }
            try {
                const { data, error } = await supabase
                    .from('laboratorios')
                    .select('cajon')
                    .ilike('nombre_comercial', `%${val}%`);

                if (error) throw error;

                if (data && data.length > 0) {
                    const cajones = new Set(data.map(item => item.cajon));
                    setHighlightedCajones(cajones);

                    // Scroll al primer cajón encontrado
                    const firstCajon = [...cajones][0];
                    // Convertir número de cajón → índice de array (inverso de arrayIndexToCajon)
                    // cajon = col * ROWS + row + 1 → col = Math.floor((cajon-1)/ROWS), row = (cajon-1) % ROWS
                    const col = Math.floor((firstCajon - 1) / ROWS);
                    const row = (firstCajon - 1) % ROWS;
                    const arrayIdx = row * COLS + col;
                    const gridEl = document.querySelector('.grid');
                    if (gridEl) {
                        const drawers = gridEl.querySelectorAll('.drawer');
                        drawers[arrayIdx]?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
                    }
                } else {
                    setHighlightedCajones(new Set());
                }
            } catch (err) {
                console.error('Error buscando en Supabase:', err);
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleDrawerClick = async (e) => {
        // e.currentTarget.classList.toggle('open');
        const drawerElement = e.currentTarget;
        const parent = drawerElement.parentNode;
        // Numeración: arriba → abajo, izquierda → derecha (columna por columna)
        // Grid: 5 columnas × 9 filas = 45 cajones
        const COLS = 5;
        const ROWS = 9;
        const arrayIndex = Array.from(parent.children).indexOf(drawerElement);
        const col = arrayIndex % COLS;   // columna 0..4
        const row = Math.floor(arrayIndex / COLS); // fila 0..8
        const cajonNumber = col * ROWS + row + 1;

        setDrawerModal({ open: true, cajon: cajonNumber });
        setLoadingMeds(true);
        setDrawerMeds([]);

        try {
            const { data, error } = await supabase
                .from('laboratorios')
                .select('nombre_comercial')
                .eq('cajon', cajonNumber)
                .order('nombre_comercial', { ascending: true });

            if (error) throw error;
            setDrawerMeds(data || []);
        } catch (err) {
            console.error('Error fetching meds for cajon:', err);
        } finally {
            setLoadingMeds(false);
        }
    };

    return (
        <>
            <Navbar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />



    

    <div className="cabinet-wrapper">
        <div className="cabinet-container">
            <div className="grid">
                
                
                <div className="drawer" style={getDrawerStyle(0)} onClick={handleDrawerClick} id="drawer-amixen-1-1">
                    <div className="logo-container">
                        <div className="bernabo-logo">
                            <svg viewBox="0 0 100 100" width="20" height="20">
                                
                                <path
                                    d="M 25 85 L 50 15 L 65 15 C 75 15 80 20 80 30 C 80 38 75 42 65 45 C 78 48 85 55 85 65 C 85 75 75 85 60 85 Z"
                                    fill="#003d82" />
                                
                                <path
                                    d="M 22 82 L 47 12 L 62 12 C 72 12 77 17 77 27 C 77 35 72 39 62 42 C 75 45 82 52 82 62 C 82 72 72 82 57 82 Z"
                                    fill="#1ea0d8" />
                                
                                <path d="M 47 30 L 60 30 C 65 30 65 40 60 40 L 43 40 Z" fill="white" />
                                
                                <path d="M 40 55 L 58 55 C 65 55 65 68 58 68 L 35 68 Z" fill="white" />
                            </svg>
                        </div>
                    </div>
                    <div className="label">Bernabó</div>
                </div>
                <div className="drawer" style={getDrawerStyle(1)} onClick={handleDrawerClick}>
                    <div className="logo-container">
                        <div className="sanitas-logo">
                            <div className="sanitas-s-icon">[S]</div>
                            <div className="sanitas-text">SANITAS</div>
                        </div>
                    </div>
                    <div className="label">Sanitas</div>
                </div>
                <div className="drawer" style={getDrawerStyle(2)} onClick={handleDrawerClick}>
                    <div className="logo-container">
                        <svg viewBox="0 0 100 40" width="70" height="28"
                            style={{"filter":"drop-shadow(0 1px 2px rgba(0,0,0,0.2))","marginTop":"2px"}}>
                            <rect x="0" y="0" width="100" height="40" fill="#e5e7eb" rx="2" />
                            <rect x="25" y="0" width="75" height="28" fill="#c25915" />

                            <circle cx="12.5" cy="14" r="9" fill="none" stroke="#222" strokeWidth="1.2" />
                            <text x="12.5" y="8" font-family="Arial" font-size="3.5" font-weight="bold" fill="#222"
                                text-anchor="middle">B</text>
                            <text x="12.5" y="11.5" font-family="Arial" font-size="3.5" font-weight="bold" fill="#222"
                                text-anchor="middle">A</text>
                            <text x="12.5" y="15.2" font-family="Arial" font-size="3.5" font-weight="bold" fill="#222"
                                text-anchor="middle">Y</text>
                            <text x="12.5" y="18.5" font-family="Arial" font-size="3.5" font-weight="bold" fill="#222"
                                text-anchor="middle">E</text>
                            <text x="12.5" y="22" font-family="Arial" font-size="3.5" font-weight="bold" fill="#222"
                                text-anchor="middle">R</text>

                            <text x="5.5" y="15.2" font-family="Arial" font-size="3.5" font-weight="bold" fill="#222"
                                text-anchor="middle">B</text>
                            <text x="9" y="15.2" font-family="Arial" font-size="3.5" font-weight="bold" fill="#222"
                                text-anchor="middle">A</text>
                            <text x="16" y="15.2" font-family="Arial" font-size="3.5" font-weight="bold" fill="#222"
                                text-anchor="middle">E</text>
                            <text x="19.5" y="15.2" font-family="Arial" font-size="3.5" font-weight="bold" fill="#222"
                                text-anchor="middle">R</text>

                            <text x="28" y="16" font-family="Arial" font-size="14" font-weight="bold"
                                fill="white">Luminal</text>
                            <text x="28" y="24" font-family="Arial" font-size="5" font-weight="bold" fill="white">Tablet
                                0.1 g</text>

                            <text x="28" y="35" font-family="Arial" font-size="4" font-weight="bold"
                                fill="#222">Antiepileptik</text>
                        </svg>
                    </div>
                    <div className="label category">Estupefacientes</div>
                </div>
                <div className="drawer" style={getDrawerStyle(3)} onClick={handleDrawerClick}>
                    <div className="logo-container" style={{"flexDirection":"row","gap":"4px","width":"100%"}}>
                        <div className="alcon-logo">
                            <div className="alcon-text">Alcon</div>
                        </div>
                        <div className="denver-logo">
                            <div className="denver-text">DF</div>
                        </div>
                    </div>
                    <div className="label">Poen Gotas<br />Denver Gotas</div>
                </div>
                <div className="drawer" style={getDrawerStyle(4)} onClick={handleDrawerClick}>
                    <div className="logo-container">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp"
                            width="34" height="34"
                            style={{"marginTop":"5px","filter":"drop-shadow(0 2px 3px rgba(0,0,0,0.2))","borderRadius":"50%"}} />
                    </div>
                    <div className="label category">Callcenter</div>
                </div>

                
                <div className="drawer" style={getDrawerStyle(5)} onClick={handleDrawerClick}>
                    <div className="logo-container"><img className="logo"
                            src="https://www.google.com/s2/favicons?domain=andromaco.com&sz=128" alt="Andrómaco"
                            onError={(e) => { e.currentTarget.style.display='none'; }} /></div>
                    <div className="label">Andrómaco<br />Microsules</div>
                </div>
                <div className="drawer" style={getDrawerStyle(6)} onClick={handleDrawerClick}>
                    <div className="logo-container">
                        <div className="adium-logo"
                            style={{"width":"70px","background":"white","border":"1px solid #e0e0e0","display":"flex","alignItems":"center","justifyContent":"center","borderRadius":"2px","height":"24px","padding":"0 2px","boxShadow":"0 1px 2px rgba(0,0,0,0.1)"}}>
                            <svg viewBox="0 0 100 100" width="16" height="16" style={{"marginRight":"3px"}}>
                                <rect x="0" y="0" width="100" height="100" rx="20" fill="#e3001b" />
                                <rect x="42" y="10" width="16" height="52" fill="white" />
                                <path d="M 12 62 A 38 38 0 0 0 88 62 Z" fill="white" />
                            </svg>
                            <div className="adium-text" style={{"fontSize":"10px","marginTop":"1px"}}>ADIUM</div>
                        </div>
                    </div>
                    <div className="label">Rafo (Adium)</div>
                </div>
                <div className="drawer" style={getDrawerStyle(7)} onClick={handleDrawerClick} id="drawer-reliveran-2-3">
                    <div className="logo-container" style={{"flexDirection":"row","gap":"4px","width":"100%"}}>
                        <div className="gador-logo" style={{"width":"65px"}}>
                            <div className="gador-cross">
                                <div className="blue"></div>
                                <div className="white"></div>
                                <div className="blue"></div>
                                <div className="white"></div>
                                <div className="blue"></div>
                                <div className="white"></div>
                                <div className="blue"></div>
                                <div className="white"></div>
                                <div className="blue"></div>
                            </div>
                            <div className="gador-text" style={{"fontSize":"11px"}}>Gador</div>
                        </div>
                        <div className="novartis-logo" style={{"width":"65px"}}>
                            <div className="novartis-mark">▼</div>
                            <div className="novartis-text">novartis</div>
                        </div>
                    </div>
                    <div className="label">Gador<br />Novartis</div>
                </div>
                <div className="drawer" style={getDrawerStyle(8)} onClick={handleDrawerClick}>
                    <div className="logo-container"></div>
                    <div className="label">Gotas</div>
                </div>
                <div className="drawer" style={getDrawerStyle(9)} onClick={handleDrawerClick}>
                    <div className="logo-container"><img className="logo"
                            src="https://www.google.com/s2/favicons?domain=ariston.com.ar&sz=128" alt="Ariston"
                            onError={(e) => { e.currentTarget.style.display='none'; }} /></div>
                    <div className="label">Ariston</div>
                </div>

                
                <div className="drawer" style={getDrawerStyle(10)} onClick={handleDrawerClick}>
                    <div className="logo-container">
                        <div className="lazar-logo">
                            <div className="lazar-box"><span className="lazar-l">L</span></div>
                            <div className="lazar-text">LAZAR</div>
                        </div>
                    </div>
                    <div className="label">Lazar</div>
                </div>
                <div className="drawer" style={getDrawerStyle(11)} onClick={handleDrawerClick}>
                    <div className="logo-container" style={{"flexDirection":"row","gap":"4px","width":"100%"}}>
                        <div className="adium-logo"
                            style={{"width":"65px","background":"white","border":"1px solid #e0e0e0","display":"flex","alignItems":"center","justifyContent":"center","borderRadius":"2px","height":"24px","padding":"0 2px","boxShadow":"0 1px 2px rgba(0,0,0,0.1)"}}>
                            <svg viewBox="0 0 100 100" width="16" height="16" style={{"marginRight":"3px"}}>
                                <rect x="0" y="0" width="100" height="100" rx="20" fill="#e3001b" />
                                <rect x="42" y="10" width="16" height="52" fill="white" />
                                <path d="M 12 62 A 38 38 0 0 0 88 62 Z" fill="white" />
                            </svg>
                            <div className="adium-text" style={{"fontSize":"9px","marginTop":"1px"}}>ADIUM</div>
                        </div>
                        <div className="nolter-logo" style={{"width":"65px"}}>
                            <div className="nolter-mark">
                                <div className="nolter-teal"></div>
                                <div className="nolter-white"></div>
                            </div>
                            <div className="nolter-text" style={{"fontSize":"9px"}}>NOLTER</div>
                        </div>
                    </div>
                    <div className="label">Raffo<br />Nolter</div>
                </div>
                <div className="drawer" style={getDrawerStyle(12)} onClick={handleDrawerClick}>
                    <div className="logo-container">
                        <div className="temis-logo">
                            <svg viewBox="0 0 24 24" width="14" height="14" style={{"marginBottom":"1px"}}>
                                <path d="M12 4 L4 18 C 5 22, 19 22, 20 18 L12 4" fill="none" stroke="white"
                                    strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <div className="temis-text1">TEMIS</div>
                            <div className="temis-text2">LOSTALO</div>
                        </div>
                    </div>
                    <div className="label">Temis Lostalo</div>
                </div>
                <div className="drawer" style={getDrawerStyle(13)} onClick={handleDrawerClick} id="drawer-totalmagnesiano-3-4">
                    <div className="logo-container"><img className="logo"
                            src="https://www.google.com/s2/favicons?domain=gsk.com&sz=128" alt="Glaxo"
                            onError={(e) => { e.currentTarget.style.display='none'; }} /></div>
                    <div className="label">Glaxo</div>
                </div>
                <div className="drawer" style={getDrawerStyle(14)} onClick={handleDrawerClick} id="drawer-aliviafleb-3-5">
                    <div className="logo-container" style={{"flexDirection":"row","gap":"4px","width":"100%"}}>
                        <div className="denver-logo">
                            <div className="denver-text">DF</div>
                        </div>
                    </div>
                    <div className="label">Ariston<br />Denver</div>
                </div>

                
                <div className="drawer" style={getDrawerStyle(15)} onClick={handleDrawerClick}>
                    <div className="logo-container">
                        <div className="lazar-logo">
                            <div className="lazar-box"><span className="lazar-l">L</span></div>
                            <div className="lazar-text">LAZAR</div>
                        </div>
                    </div>
                    <div className="label">Lazar</div>
                </div>
                <div className="drawer" style={getDrawerStyle(16)} onClick={handleDrawerClick}>
                    <div className="logo-container">
                        <div className="adium-logo"
                            style={{"width":"70px","background":"white","border":"1px solid #e0e0e0","display":"flex","alignItems":"center","justifyContent":"center","borderRadius":"2px","height":"24px","padding":"0 2px","boxShadow":"0 1px 2px rgba(0,0,0,0.1)"}}>
                            <svg viewBox="0 0 100 100" width="16" height="16" style={{"marginRight":"3px"}}>
                                <rect x="0" y="0" width="100" height="100" rx="20" fill="#e3001b" />
                                <rect x="42" y="10" width="16" height="52" fill="white" />
                                <path d="M 12 62 A 38 38 0 0 0 88 62 Z" fill="white" />
                            </svg>
                            <div className="adium-text" style={{"fontSize":"10px","marginTop":"1px"}}>ADIUM</div>
                        </div>
                    </div>
                    <div className="label">Raffo(Adium)</div>
                </div>
                <div className="drawer" style={getDrawerStyle(17)} onClick={handleDrawerClick}>
                    <div className="logo-container">
                        <div className="temis-logo">
                            <svg viewBox="0 0 24 24" width="14" height="14" style={{"marginBottom":"1px"}}>
                                <path d="M12 4 L4 18 C 5 22, 19 22, 20 18 L12 4" fill="none" stroke="white"
                                    strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <div className="temis-text1">TEMIS</div>
                            <div className="temis-text2">LOSTALO</div>
                        </div>
                    </div>
                    <div className="label">Temis Lostalo</div>
                </div>
                <div className="drawer" style={getDrawerStyle(18)} onClick={handleDrawerClick} id="drawer-evoquin-4-4">
                    <div className="logo-container"><img className="logo"
                            src="https://www.google.com/s2/favicons?domain=tevapharm.com&sz=128" alt="Teva"
                            onError={(e) => { e.currentTarget.style.display='none'; }} /></div>
                    <div className="label">Teva</div>
                </div>
                <div className="drawer" style={getDrawerStyle(19)} onClick={handleDrawerClick}>
                    <div className="logo-container">
                        <div className="richmond-logo">
                            <div className="richmond-icon">
                                <svg viewBox="0 0 100 100" width="20" height="20">
                                    <path d="M 5 25 L 12 25 L 12 50 L 5 50 Z" fill="#e30219" />
                                    <path
                                        d="M 10 25 C 40 15, 90 15, 95 30 C 105 45, 60 55, 30 65 C 20 68, 10 70, 10 70 C 20 65, 80 50, 85 35 C 88 28, 60 23, 10 27 Z"
                                        fill="#e30219" />
                                    <path d="M 15 65 C 35 60, 40 70, 45 85 C 47 95, 30 95, 20 85 Z" fill="#e30219" />
                                </svg>
                            </div>
                            <div className="richmond-text-container">
                                <div className="richmond-lab">Laboratorios</div>
                                <div className="richmond-text">RICHMOND</div>
                            </div>
                        </div>
                    </div>
                    <div className="label">Richmond</div>
                </div>

                
                <div className="drawer" style={getDrawerStyle(20)} onClick={handleDrawerClick} id="drawer-regulane-5-1">
                    <div className="logo-container"><img className="logo"
                            src="https://www.google.com/s2/favicons?domain=finadiet.com.ar&sz=128" alt="Finadiet"
                            onError={(e) => { e.currentTarget.style.display='none'; }} /></div>
                    <div className="label">Finadiet</div>
                </div>
                <div className="drawer" style={getDrawerStyle(21)} onClick={handleDrawerClick}>
                    <div className="logo-container" style={{"flexDirection":"row","gap":"4px","width":"100%"}}>
                        <div className="adium-logo"
                            style={{"width":"65px","background":"white","border":"1px solid #e0e0e0","display":"flex","alignItems":"center","justifyContent":"center","borderRadius":"2px","height":"24px","padding":"0 2px","boxShadow":"0 1px 2px rgba(0,0,0,0.1)"}}>
                            <svg viewBox="0 0 100 100" width="16" height="16" style={{"marginRight":"3px"}}>
                                <rect x="0" y="0" width="100" height="100" rx="20" fill="#e3001b" />
                                <rect x="42" y="10" width="16" height="52" fill="white" />
                                <path d="M 12 62 A 38 38 0 0 0 88 62 Z" fill="white" />
                            </svg>
                            <div className="adium-text" style={{"fontSize":"9px","marginTop":"1px"}}>ADIUM</div>
                        </div>
                        <div className="nolter-logo" style={{"width":"65px"}}>
                            <div className="nolter-mark">
                                <div className="nolter-teal"></div>
                                <div className="nolter-white"></div>
                            </div>
                            <div className="nolter-text" style={{"fontSize":"9px"}}>NOLTER</div>
                        </div>
                    </div>
                    <div className="label">Raffo<br />Nolter</div>
                </div>
                <div className="drawer" style={getDrawerStyle(22)} onClick={handleDrawerClick} id="drawer-aldactonea-5-3">
                    <div className="logo-container">
                        <div className="pfizer-logo">
                            <div className="pfizer-text">Pfizer</div>
                        </div>
                    </div>
                    <div className="label">Pfizer</div>
                </div>
                <div className="drawer" style={getDrawerStyle(23)} onClick={handleDrawerClick}>
                    <div className="logo-container"><img className="logo"
                            src="https://www.google.com/s2/favicons?domain=tevapharm.com&sz=128" alt="Teva"
                            onError={(e) => { e.currentTarget.style.display='none'; }} /></div>
                    <div className="label">Teva</div>
                </div>
                <div className="drawer" style={getDrawerStyle(24)} onClick={handleDrawerClick}>
                    <div className="logo-container" style={{"flexDirection":"row","gap":"4px","width":"100%"}}>
                        <div className="galderma-logo">
                            <div className="galderma-text-container">
                                <div className="galderma-text">GALDERMA</div>
                            </div>
                            <div className="galderma-icon">
                                <svg viewBox="0 0 100 200" width="10" height="18">
                                    <rect x="0" y="0" width="100" height="100" fill="#00509a" />
                                    <rect x="0" y="100" width="100" height="100" fill="#00a4c7" />
                                    <path d="M 80 50 L 30 100 L 80 150 L 50 150 L 20 120" fill="none" stroke="white"
                                        strokeWidth="12" />
                                    <rect x="35" y="170" width="30" height="12" fill="white" />
                                </svg>
                            </div>
                        </div>
                        <div className="janssen-logo">
                            <div className="janssen-text-col">
                                <div className="janssen-main">janssen</div>
                            </div>
                            <svg viewBox="0 0 100 100" width="12" height="16" style={{"marginLeft":"2px"}}>
                                <path
                                    d="M 10 20 C 50 40, 80 30, 80 30 C 60 50, 50 70, 30 100 C 30 100, 35 70, 50 50 C 50 50, 40 30, 10 20 Z"
                                    fill="#005e9e" />
                                <path d="M 40 50 L 95 45 L 90 55 L 40 60 Z" fill="#005e9e" />
                            </svg>
                        </div>
                    </div>
                    <div className="label">Galderma<br />Janssen</div>
                </div>

                
                <div className="drawer" style={getDrawerStyle(25)} onClick={handleDrawerClick} id="drawer-hexalercort-6-1">
                    <div className="logo-container"><img className="logo"
                            src="https://www.google.com/s2/favicons?domain=siegfried.com.ar&sz=128" alt="Siegfried"
                            onError={(e) => { e.currentTarget.style.display='none'; }} /></div>
                    <div className="label">Siegfried</div>
                </div>
                <div className="drawer" style={getDrawerStyle(26)} onClick={handleDrawerClick}>
                    <div className="logo-container" style={{"flexDirection":"row","gap":"4px","width":"100%"}}>
                        <div className="adium-logo"
                            style={{"width":"65px","background":"white","border":"1px solid #e0e0e0","display":"flex","alignItems":"center","justifyContent":"center","borderRadius":"2px","height":"24px","padding":"0 2px","boxShadow":"0 1px 2px rgba(0,0,0,0.1)"}}>
                            <svg viewBox="0 0 100 100" width="16" height="16" style={{"marginRight":"3px"}}>
                                <rect x="0" y="0" width="100" height="100" rx="20" fill="#e3001b" />
                                <rect x="42" y="10" width="16" height="52" fill="white" />
                                <path d="M 12 62 A 38 38 0 0 0 88 62 Z" fill="white" />
                            </svg>
                            <div className="adium-text" style={{"fontSize":"9px","marginTop":"1px"}}>ADIUM</div>
                        </div>
                        <div className="nolter-logo" style={{"width":"65px"}}>
                            <div className="nolter-mark">
                                <div className="nolter-teal"></div>
                                <div className="nolter-white"></div>
                            </div>
                            <div className="nolter-text" style={{"fontSize":"9px"}}>NOLTER</div>
                        </div>
                    </div>
                    <div className="label">Raffo<br />Nolter</div>
                </div>
                <div className="drawer" style={getDrawerStyle(27)} onClick={handleDrawerClick}>
                    <div className="logo-container">
                        <div className="pfizer-logo">
                            <div className="pfizer-text">Pfizer</div>
                        </div>
                    </div>
                    <div className="label">Pfizer<br />Rontang</div>
                </div>
                <div className="drawer" style={getDrawerStyle(28)} onClick={handleDrawerClick}>
                    <div className="logo-container"><img className="logo"
                            src="https://www.google.com/s2/favicons?domain=trbpharma.com.ar&sz=128" alt="TRB"
                            onError={(e) => { e.currentTarget.style.display='none'; }} /></div>
                    <div className="label">TRB</div>
                </div>
                <div className="drawer" style={getDrawerStyle(29)} onClick={handleDrawerClick}>
                    <div className="logo-container">
                        <div className="richet-logo">
                            <div className="richet-icon">
                                <svg viewBox="0 0 100 100" width="16" height="16">
                                    <path d="M 10 10 L 40 30 L 25 45 L 10 30 Z" fill="white" />
                                    <path d="M 10 40 L 60 70 L 45 85 L 10 60 Z" fill="white" />
                                    <path d="M 10 70 L 80 110 L 65 125 L 10 90 Z" fill="white" />
                                    <circle cx="60" cy="45" r="16" fill="#e3001b" />
                                </svg>
                            </div>
                            <div className="richet-text-container">
                                <div className="richet-text">RICHET</div>
                                <div className="richet-sub">DESDE 1947</div>
                            </div>
                        </div>
                    </div>
                    <div className="label">Richet</div>
                </div>

                
                <div className="drawer" style={getDrawerStyle(30)} onClick={handleDrawerClick}>
                    <div className="logo-container"><img className="logo"
                            src="https://www.google.com/s2/favicons?domain=siegfried.com.ar&sz=128" alt="Siegfried"
                            onError={(e) => { e.currentTarget.style.display='none'; }} /></div>
                    <div className="label">Siegfried</div>
                </div>
                <div className="drawer" style={getDrawerStyle(31)} onClick={handleDrawerClick} id="drawer-craveri-7-2">
                    <div className="logo-container">
                        <div className="craveri-logo">
                            <div className="craveri-text">CRAVERI</div>
                        </div>
                    </div>
                    <div className="label">Craveri</div>
                </div>
                <div className="drawer" style={getDrawerStyle(32)} onClick={handleDrawerClick}>
                    <div className="logo-container" style={{"flexDirection":"row","gap":"6px","width":"100%"}}>
                        <div className="sanofi-logo" style={{"width":"50px"}}>
                            <div className="sanofi-text" style={{"fontSize":"7px"}}>sanofi aventis</div>
                            <div className="sanofi-arc"></div>
                        </div>
                        <div className="panalab-logo"
                            style={{"background":"#1b4185","width":"22px","height":"22px","borderRadius":"4px","display":"flex","alignItems":"center","justifyContent":"center","color":"white","fontFamily":"Georgia, serif","fontSize":"15px","fontWeight":"normal","lineHeight":"1","boxShadow":"0 1px 2px rgba(0,0,0,0.2)"}}>
                            <span style={{"letterSpacing":"-3px","marginLeft":"-2px"}}>PL</span>
                        </div>
                    </div>
                    <div className="label">Sanofi<br />Panalab</div>
                </div>
                <div className="drawer" style={getDrawerStyle(33)} onClick={handleDrawerClick}>
                    <div className="logo-container"><img className="logo"
                            src="https://www.google.com/s2/favicons?domain=trbpharma.com.ar&sz=128" alt="TRB"
                            onError={(e) => { e.currentTarget.style.display='none'; }} /></div>
                    <div className="label">TRB</div>
                </div>
                <div className="drawer" style={getDrawerStyle(34)} onClick={handleDrawerClick}>
                    <div className="logo-container">
                        <div className="richet-logo">
                            <div className="richet-icon">
                                <svg viewBox="0 0 100 100" width="16" height="16">
                                    <path d="M 10 10 L 40 30 L 25 45 L 10 30 Z" fill="white" />
                                    <path d="M 10 40 L 60 70 L 45 85 L 10 60 Z" fill="white" />
                                    <path d="M 10 70 L 80 110 L 65 125 L 10 90 Z" fill="white" />
                                    <circle cx="60" cy="45" r="16" fill="#e3001b" />
                                </svg>
                            </div>
                            <div className="richet-text-container">
                                <div className="richet-text">RICHET</div>
                                <div className="richet-sub">DESDE 1947</div>
                            </div>
                        </div>
                    </div>
                    <div className="label">Richet</div>
                </div>

                
                <div className="drawer" style={getDrawerStyle(35)} onClick={handleDrawerClick}>
                    <div className="logo-container"><img className="logo"
                            src="https://www.google.com/s2/favicons?domain=siegfried.com.ar&sz=128" alt="Siegfried"
                            onError={(e) => { e.currentTarget.style.display='none'; }} /></div>
                    <div className="label">Siegfried</div>
                </div>
                <div className="drawer" style={getDrawerStyle(36)} onClick={handleDrawerClick}>
                    <div className="logo-container">
                        <div className="craveri-logo">
                            <div className="craveri-text">CRAVERI</div>
                        </div>
                    </div>
                    <div className="label">Craveri<br />Rossmore</div>
                </div>
                <div className="drawer" style={getDrawerStyle(37)} onClick={handleDrawerClick}>
                    <div className="logo-container">
                        <div className="panalab-logo"
                            style={{"background":"#1b4185","width":"26px","height":"26px","borderRadius":"4px","display":"flex","alignItems":"center","justifyContent":"center","color":"white","fontFamily":"Georgia, serif","fontSize":"18px","fontWeight":"normal","lineHeight":"1","boxShadow":"0 1px 2px rgba(0,0,0,0.2)"}}>
                            <span style={{"letterSpacing":"-3px","marginLeft":"-2px"}}>PL</span>
                        </div>
                    </div>
                    <div className="label">Panalab</div>
                </div>
                <div className="drawer" style={getDrawerStyle(38)} onClick={handleDrawerClick}>
                    <div className="logo-container">
                        <div className="dominguez-logo">
                            <div className="dominguez-d">D</div>
                            <div className="dominguez-text">DOMINGUEZ</div>
                        </div>
                    </div>
                    <div className="label">Dominguez</div>
                </div>
                <div className="drawer" style={getDrawerStyle(39)} onClick={handleDrawerClick}>
                    <div className="logo-container"><img className="logo"
                            src="https://www.google.com/s2/favicons?domain=eurofarma.com.ar&sz=128" alt="Eurofarma"
                            onError={(e) => { e.currentTarget.style.display='none'; }} /></div>
                    <div className="label">Eurofarma</div>
                </div>

                
                <div className="drawer" style={getDrawerStyle(40)} onClick={handleDrawerClick}>
                    <div className="logo-container" style={{"flexDirection":"row","gap":"4px","width":"100%"}}>
                        <div
                            style={{"boxShadow":"0 1px 2px rgba(0,0,0,0.2)","borderRadius":"4px","overflow":"hidden","width":"22px","height":"22px","flexShrink":"0"}}>
                            <svg viewBox="0 0 100 100" width="22" height="22">
                                <rect x="0" y="0" width="100" height="100" fill="#25256e" />
                                <path d="M 20 60 C 30 85, 70 85, 80 60" fill="none" stroke="white" strokeWidth="12"
                                    strokeLinecap="round" />
                                <path
                                    d="M 70 15 L 73 25 L 83 25 L 75 32 L 78 42 L 70 36 L 62 42 L 65 32 L 57 25 L 67 25 Z"
                                    fill="#eb4e41" />
                            </svg>
                        </div>
                        <div className="geminis-logo">
                            <svg viewBox="0 0 100 100" width="14" height="14" style={{"flexShrink":"0"}}>
                                <path d="M 25 35 A 25 25 0 0 1 75 35 L 75 65 A 25 25 0 0 1 25 65 Z" fill="none"
                                    stroke="#231f20" strokeWidth="12" />
                                <path d="M 31 50 L 69 50 L 69 65 A 19 19 0 0 1 31 65 Z" fill="#008c50" />
                                <line x1="25" y1="50" x2="75" y2="50" stroke="#231f20" strokeWidth="8" />
                            </svg>
                            <div className="geminis-text-col">
                                <div className="geminis-main">Géminis</div>
                                <div className="geminis-sub">Farmacéutica</div>
                            </div>
                        </div>
                    </div>
                    <div className="label">Servier<br />Géminis</div>
                </div>
                <div className="drawer" style={getDrawerStyle(41)} onClick={handleDrawerClick}>
                    <div className="logo-container" style={{"flexDirection":"row","gap":"4px","width":"100%"}}>
                        <div className="chobet-logo" style={{"width":"65px"}}>
                            <div className="chobet-left">
                                <div>S <span style={{"fontSize":"7px"}}>∆</span></div>
                                <div>CH</div>
                            </div>
                            <div className="chobet-right">
                                <div>SOUBEIRAN</div>
                                <div style={{"display":"flex","alignItems":"center"}}>CHOBET <div className="chobet-blue-box">
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mar-logo" style={{"width":"65px"}}>
                            <div className="mar-dots">●●<br />●●<br />●</div>
                            <div className="mar-text-container">
                                <div className="mar-lab">laboratorios</div>
                                <div className="mar-text">mar</div>
                            </div>
                        </div>
                    </div>
                    <div className="label">Chobet<br />Mar</div>
                </div>
                <div className="drawer" style={getDrawerStyle(42)} onClick={handleDrawerClick}>
                    <div className="logo-container">
                        <div className="panalab-logo"
                            style={{"background":"#1b4185","width":"26px","height":"26px","borderRadius":"4px","display":"flex","alignItems":"center","justifyContent":"center","color":"white","fontFamily":"Georgia, serif","fontSize":"18px","fontWeight":"normal","lineHeight":"1","boxShadow":"0 1px 2px rgba(0,0,0,0.2)"}}>
                            <span style={{"letterSpacing":"-3px","marginLeft":"-2px"}}>PL</span>
                        </div>
                    </div>
                    <div className="label">Panalab</div>
                </div>
                <div className="drawer" style={getDrawerStyle(43)} onClick={handleDrawerClick}>
                    <div className="logo-container" style={{"flexDirection":"row","gap":"4px","width":"100%"}}>
                        <div style={{"display":"flex","flexDirection":"column","alignItems":"center"}}>
                            <img className="logo" src="https://www.google.com/s2/favicons?domain=fecofar.com.ar&sz=128"
                                alt="Fecofar" style={{"width":"16px","height":"16px"}} onError={(e) => { e.currentTarget.style.display='none'; }} />
                        </div>
                        <div className="eurolab-logo" style={{"width":"50px"}}>
                            <div className="eurolab-swoosh" style={{"width":"35px","left":"5px"}}></div>
                            <div className="eurolab-main" style={{"fontSize":"10px"}}>EURO<span className="eurolab-lab"
                                    style={{"fontSize":"10px"}}>Lab</span></div>
                            <div className="eurolab-sub" style={{"fontSize":"4px"}}>Laboratorios Eurolab</div>
                        </div>
                    </div>
                    <div className="label">Fecofar<br />Eurolab</div>
                </div>
                <div className="drawer" style={getDrawerStyle(44)} onClick={handleDrawerClick} id="drawer-sildenafil-9-5">
                    <div className="logo-container">
                        <svg viewBox="0 0 100 100" width="40" height="40"
                            style={{"filter":"drop-shadow(0 2px 3px rgba(0,0,0,0.2))","marginTop":"2px"}}>
                            <defs>
                                <linearGradient id="blister" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0%" stopColor="#ffffff" />
                                    <stop offset="50%" stopColor="#e2e8f0" />
                                    <stop offset="100%" stopColor="#cbd5e1" />
                                </linearGradient>
                                <radialGradient id="bubble" cx="30%" cy="30%" r="50%">
                                    <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
                                    <stop offset="50%" stopColor="rgba(255,255,255,0.2)" />
                                    <stop offset="100%" stopColor="rgba(0,0,0,0.15)" />
                                </radialGradient>
                            </defs>
                            <rect x="15" y="20" width="70" height="60" rx="5" fill="url(#blister)" stroke="#94a3b8"
                                strokeWidth="1" />
                            <rect x="18" y="23" width="64" height="54" rx="3" fill="none" stroke="#94a3b8"
                                strokeWidth="1" strokeDasharray="1 2" />

                            <rect x="27" y="32" width="16" height="16" rx="4" fill="#3b82f6"
                                transform="rotate(45 35 40)" />
                            <circle cx="35" cy="40" r="12" fill="url(#bubble)" />

                            <rect x="57" y="32" width="16" height="16" rx="4" fill="#3b82f6"
                                transform="rotate(45 65 40)" />
                            <circle cx="65" cy="40" r="12" fill="url(#bubble)" />

                            <rect x="27" y="52" width="16" height="16" rx="4" fill="#3b82f6"
                                transform="rotate(45 35 60)" />
                            <circle cx="35" cy="60" r="12" fill="url(#bubble)" />

                            <rect x="57" y="52" width="16" height="16" rx="4" fill="#3b82f6"
                                transform="rotate(45 65 60)" />
                            <circle cx="65" cy="60" r="12" fill="url(#bubble)" />
                        </svg>
                    </div>
                    <div className="label category">Sildenafil</div>
                </div>

            </div>
        </div>
    </div>

    {/* Drawer Modal */}
    {drawerModal.open && (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '20px',
        }}>
            <div style={{
                background: 'white', borderRadius: '12px', padding: '24px',
                width: '100%', maxWidth: '400px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                animation: 'fadeIn 0.2s ease',
                position: 'relative'
            }}>
                <button 
                    onClick={() => setDrawerModal({ open: false, cajon: null })}
                    style={{
                        position: 'absolute', top: '16px', right: '16px',
                        background: 'none', border: 'none', fontSize: '20px',
                        cursor: 'pointer', color: '#666',
                    }}
                >
                    ✕
                </button>
                <h2 style={{ margin: '0 0 16px', color: '#12439a', fontSize: '22px' }}>
                    Cajón {drawerModal.cajon}
                </h2>
                <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
                    {loadingMeds ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>Cargando...</div>
                    ) : drawerMeds.length > 0 ? (
                        <ul style={{ margin: 0, padding: '0 0 0 20px', color: '#333' }}>
                            {drawerMeds.map((med, i) => (
                                <li key={i} style={{ marginBottom: '8px', fontSize: '15px' }}>
                                    <strong>{med.nombre_comercial}</strong> 
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#888', fontStyle: 'italic' }}>
                            Este cajón no tiene medicamentos registrados.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )}
</>
    );
}
