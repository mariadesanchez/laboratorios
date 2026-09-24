// 1. Guardar parámetros de la URL si venimos desde nuestra web
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('auto_beneficiario')) {
    sessionStorage.setItem('imed_auto_beneficiario', urlParams.get('auto_beneficiario'));
    sessionStorage.setItem('imed_auto_refnum', urlParams.get('auto_refnum'));
    
    // Limpiar la URL para que no quede fea
    window.history.replaceState({}, document.title, window.location.pathname);
}

const path = window.location.pathname.toLowerCase();

// 2. Pantalla de Beneficiario (Seleccionar financiador y poner socio)
if (path.includes('/beneficiario/logincan')) {
    const autoBen = sessionStorage.getItem('imed_auto_beneficiario');
    
    if (autoBen) {
        // Esperamos un momento para asegurar que el DOM cargó completo
        setTimeout(() => {
            const inputSocio = document.querySelector('input[name="txtNroSocio"]');
            // Encontrar el botón rojo "Continuar" que vimos en las capturas
            const btnContinuar = document.querySelector('.btn-danger') || document.querySelector('button[type="submit"]');
            
            if (inputSocio) {
                // Seleccionar PAMI por defecto en el select si existe y no está seleccionado
                const selectFinanciador = document.querySelector('select');
                if (selectFinanciador) {
                    for (let i = 0; i < selectFinanciador.options.length; i++) {
                        if (selectFinanciador.options[i].text.toUpperCase().includes('PAMI')) {
                            selectFinanciador.selectedIndex = i;
                            selectFinanciador.dispatchEvent(new Event('change', { bubbles: true }));
                            break;
                        }
                    }
                }

                // Escribir el número de socio
                inputSocio.value = autoBen;
                inputSocio.dispatchEvent(new Event('input', { bubbles: true }));
                inputSocio.dispatchEvent(new Event('change', { bubbles: true }));
                
                // Hacer clic en Continuar automáticamente
                if (btnContinuar) {
                    btnContinuar.click();
                }
            }
        }, 600);
    }
} 
// 3. Pantalla de Cancelación (Ingresar nro de referencia)
else if (path.includes('/cancelacion/index')) {
    const autoRef = sessionStorage.getItem('imed_auto_refnum');
    
    if (autoRef) {
        setTimeout(() => {
            // Buscar el input de número de referencia (por id o placeholder)
            const inputRef = document.getElementById('txtRefnum') || 
                             document.querySelector('input[placeholder*="referencia"]');
            
            if (inputRef) {
                inputRef.value = autoRef;
                inputRef.dispatchEvent(new Event('input', { bubbles: true }));
                inputRef.dispatchEvent(new Event('change', { bubbles: true }));
                
                // Buscar el botón rojo al lado del input (lupa) para validar
                const btnSearch = document.querySelector('.fa-search').closest('button') || 
                                  document.querySelector('button.bg-red');
                if (btnSearch) {
                    btnSearch.click();
                    // Limpiamos sessionStorage para no auto-llenar de nuevo por error
                    sessionStorage.removeItem('imed_auto_beneficiario');
                    sessionStorage.removeItem('imed_auto_refnum');
                }
            }
        }, 800);
    }
}
