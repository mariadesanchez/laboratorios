'use client';
import { useState } from 'react';
import Navbar from '@/components/Navbar';

export default function ObrasSociales() {
    const [searchTerm, setSearchTerm] = useState('');

    return (
        <>
            <Navbar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

    

    <div className="table-container">
        <table id="dataTable">
            <thead>
                <tr>
                    <th>Obra Social</th>
                    <th>Código</th>
                    <th>Nota</th>
                </tr>
            </thead>
            <tbody id="tableBody">
                <tr><td colspan="3" className="loader">Descargando datos desde Excel...</td></tr>
            </tbody>
        </table>
    </div>

    
    
        </>
    );
}
