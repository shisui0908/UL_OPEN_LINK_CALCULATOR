let formulaActual = '';
let chart = null;
const prefixes = [
    { value: 1, symbol: '', name: 'unidad' },
    { value: 1e3, symbol: 'k', name: 'kilo' },
    { value: 1e6, symbol: 'M', name: 'mega' },
    { value: 1e9, symbol: 'G', name: 'giga' },
    { value: 1e12, symbol: 'T', name: 'tera' },
    { value: 1e15, symbol: 'P', name: 'Peta' },
    { value: 1e18, symbol: 'E', name: 'exa' },
    { value: 1e-3, symbol: 'm', name: 'mili' },
    { value: 1e-6, symbol: 'μ', name: 'micro' },
    { value: 1e-9, symbol: 'n', name: 'nano' },
    { value: 1e-12, symbol: 'p', name: 'pico' },
    { value: 1e-15, symbol: 'f', name: 'femto' },
    { value: 1e-18, symbol: 'a', name: 'atto' }
];

const splitterLosses = {
    '1:2': 3,
    '1:4': 6,
    '1:8': 9,
    '1:16': 12,
    '1:32': 15,
    '1:64': 18,
    '1:128': 21,
    '1:256': 24
};

const coaxialCables = {
    'RG-6/U (75 Ω)': {
        '50 MHz': 3.65,
        '200 MHz': 7.52,
        '800 MHz': 15.2,
        '1 GHz': 17.1,
        '3 GHz': 32
    },
    'RG-58/U (50 Ω)': {
        '50 MHz': 6.8,
        '200 MHz': 14,
        '1 GHz': 32,
        '3 GHz': 60
    },
    'RG-8/U (50 Ω)': {
        '50 MHz': 3.9,
        '200 MHz': 8.2,
        '1 GHz': 19,
        '3 GHz': 35
    },
    'RG-213/U (50 Ω)': {
        '50 MHz': 4.1,
        '200 MHz': 8.6,
        '1 GHz': 20,
        '3 GHz': 38
    },
    'LMR-400 (50 Ω)': {
        '50 MHz': 1.2,
        '200 MHz': 2.5,
        '1 GHz': 6.6,
        '3 GHz': 12.5
    },
    'HDF-195 (75 Ω)': {
        '50 MHz': 2.1,
        '200 MHz': 4.3,
        '1 GHz': 10.5,
        '3 GHz': 20
    },
    'Cable Heliax 1/2" (50 Ω)': {
        '900 MHz': 3.2,
        '2.4 GHz': 5.5,
        '5.8 GHz': 8.5
    }
};

const reelDistances = [1, 1.5, 2, 2.5, 5, 7.5, 10, 12.5, 15, 17.5, 20, 25, 30, 40, 50, 75, 100, 150, 200, 250, 300, 400, 500];

document.addEventListener('DOMContentLoaded', function() {
    const connectivityBtn = document.getElementById('connectivityBtn');
    if (connectivityBtn) {
        connectivityBtn.addEventListener('click', function() {
            window.open('https://app.powerbi.com/view?r=eyJrIjoiODc0NTg5OTctM2RiYS00N2QyLTljZmQtZTY4ZTE1MzAxNmY1IiwidCI6IjFhMDY3M2M2LTI0ZTEtNDc2ZC1iYjRkLWJhNmE5MWEzYzU4OCIsImMiOjR9&pageName=ReportSection1ea80349a287d67788d0', '_blank');
        });
    }

    if (window.location.pathname.includes('calculos.html')) {
        cargarCalculo();
    }
});

function formatResult(value, unit) {
    if (value === 0) return `0 ${unit}`; 
    const absValue = Math.abs(value);
    if (absValue >= 1000 || absValue <= 0.001) {
        const prefix = prefixes.find(p => absValue >= p.value * 0.9 && absValue < p.value * 1000);
        if (prefix) {
            return `${(value / prefix.value).toFixed(4)} ${prefix.symbol}${unit}`;
        }
    }
    return `${value.toFixed(4)} ${unit}`;
}

function calcular() {
    if (!formulaActual) return;
    
    const inputValues = obtenerValores();
    if (!inputValues) return;

    try {
        let resultado;
        switch(formulaActual) {
            case 'longitud_onda':
                resultado = (3e8) / inputValues.frecuencia;
                document.getElementById('respuesta').value = formatResult(resultado, 'm');
                break;
            case 'capacidad_informacion':
                resultado = inputValues.ancho_banda * Math.log2(1 + (inputValues.senal / inputValues.ruido));
                document.getElementById('respuesta').value = formatResult(resultado, 'bps');
                break;
            case 'ruido':
                const tempK = inputValues.unidadTemp === 'C' ? inputValues.temperatura + 273.15 : inputValues.temperatura;
                resultado = 1.380649e-23 * tempK * (inputValues.fmax - inputValues.fmin);
                document.getElementById('respuesta').value = formatResult(resultado, 'W');
                break;
            case 'voltaje_ruido_termico':
                resultado = Math.sqrt(4 * inputValues.resistencia * inputValues.ruido);
                document.getElementById('respuesta').value = formatResult(resultado, 'V');
                break;
            case 'factor_ruido':
                resultado = (inputValues.stx / inputValues.ntx) / (inputValues.srx / inputValues.nrx);
                document.getElementById('respuesta').value = resultado.toFixed(4);
                break;
            case 'indicador_ruido':
                resultado = 10 * Math.log10(inputValues.factor_ruido);
                document.getElementById('respuesta').value = `${resultado.toFixed(2)} dB`;
                break;
            case 'factor_escalamiento':
                resultado = inputValues.srx / inputValues.stx;
                document.getElementById('respuesta').value = resultado.toFixed(4);
                break;
            case 'indice_refraccion':
                const thetaRad = inputValues.thetaRef * (Math.PI / 180);
                resultado = Math.asin((inputValues.n1 / inputValues.n2) * Math.sin(thetaRad)) * (180 / Math.PI);
                document.getElementById('respuesta').value = `${resultado.toFixed(2)}°`;
                break;
            case 'angulo_critico_refraccion':
                resultado = Math.asin(inputValues.n2 / inputValues.n1) * (180 / Math.PI);
                document.getElementById('respuesta').value = `${resultado.toFixed(2)}°`;
                break;
            case 'presupuesto_enlace_coaxial':
            case 'presupuesto_enlace_fftx':
                let ptx;
                if (inputValues.ptx_unit === 'watts') {
                    ptx = 10 * Math.log10(inputValues.ptx / 1e-3);
                } else {
                    ptx = inputValues.ptx;
                }
                
                const lconectores = inputValues.lconectores * inputValues.cantidad_conectores;
                const amplificadores = inputValues.amplificadores;
                const lpasivos = inputValues.lpasivos;
                const lcable = inputValues.lcable;
                
                if (formulaActual === 'presupuesto_enlace_fftx') {
                    const atenuacionEmpalme = ((inputValues.total_distance / inputValues.reel_distance) - 1) * inputValues.atenuacion_empalme_valor;
                    resultado = ptx - lconectores - lcable - atenuacionEmpalme - lpasivos + amplificadores;
                } else {
                    resultado = ptx - lconectores - lcable - lpasivos + amplificadores;
                }
                
                document.getElementById('respuesta').value = `${resultado.toFixed(2)} dBm`;
                break;
            case 'conversion_desiveles_wats':
                resultado = Math.pow(10, inputValues.PdBW / 10);
                document.getElementById('respuesta').value = formatResult(resultado, 'W');
                break;
            case 'conversor_adimensional':
                resultado = Math.pow(10, inputValues.dB / 10);
                document.getElementById('respuesta').value = resultado.toFixed(4);
                break;
            case 'conversor_potencial':
                resultado = Math.pow(10, (inputValues.dBm - 30) / 10);
                document.getElementById('respuesta').value = formatResult(resultado, 'W');
                break;
            case 'conversor_wats_decibelios':
                resultado = 10 * Math.log10(inputValues.PW) + 30;
                document.getElementById('respuesta').value = `${resultado.toFixed(2)} dBm`;
                break;
            default:
                document.getElementById('respuesta').value = 'Fórmula no implementada';
        }
    } catch (error) {
        console.error('Error en el cálculo:', error);
        document.getElementById('respuesta').value = 'Error en el cálculo';
    }
}

function obtenerValores() {
    const inputs = {};
    
    switch(formulaActual) {
        case 'longitud_onda':
            inputs.frecuencia = getValueWithPrefix('frecuencia');
            if (!inputs.frecuencia || inputs.frecuencia <= 0) {
                alert('Ingrese una frecuencia válida');
                return null;
            }
            break;
        case 'capacidad_informacion':
            inputs.ancho_banda = getValueWithPrefix('ancho_banda');
            inputs.senal = getValueWithPrefix('senal');
            inputs.ruido = getValueWithPrefix('ruido');
            if (!inputs.ancho_banda || !inputs.senal || !inputs.ruido || inputs.ruido === 0) {
                alert('Ingrese valores válidos (N ≠ 0)');
                return null;
            }
            break;
        case 'ruido':
            inputs.temperatura = parseFloat(document.getElementById('temperatura').value);
            inputs.unidadTemp = document.getElementById('unidadTemp').value;
            inputs.fmax = getValueWithPrefix('fmax');
            inputs.fmin = getValueWithPrefix('fmin');
            if (!inputs.temperatura || !inputs.fmax || !inputs.fmin || inputs.fmax <= inputs.fmin) {
                alert('Ingrese valores válidos (Fmax > Fmin)');
                return null;
            }
            break;
        case 'voltaje_ruido_termico':
            inputs.resistencia = getValueWithPrefix('resistencia');
            inputs.ruido = getValueWithPrefix('ruido');
            if (!inputs.resistencia || !inputs.ruido) {
                alert('Ingrese valores válidos');
                return null;
            }
            break;
        case 'factor_ruido':
            inputs.stx = getValueWithPrefix('stx');
            inputs.ntx = getValueWithPrefix('ntx');
            inputs.srx = getValueWithPrefix('srx');
            inputs.nrx = getValueWithPrefix('nrx');
            if (!inputs.stx || !inputs.ntx || !inputs.srx || !inputs.nrx || inputs.ntx === 0 || inputs.nrx === 0) {
                alert('Ingrese valores válidos');
                return null;
            }
            break;
        case 'indicador_ruido':
            inputs.factor_ruido = parseFloat(document.getElementById('factor_ruido').value);
            if (!inputs.factor_ruido || inputs.factor_ruido <= 0) {
                alert('Ingrese un factor de ruido válido');
                return null;
            }
            break;
        case 'factor_escalamiento':
            inputs.srx = getValueWithPrefix('srx');
            inputs.stx = getValueWithPrefix('stx');
            if (!inputs.srx || !inputs.stx || inputs.stx === 0) {
                alert('Ingrese valores válidos');
                return null;
            }
            break;
        case 'indice_refraccion':
            inputs.n1 = parseFloat(document.getElementById('n1').value);
            inputs.n2 = parseFloat(document.getElementById('n2').value);
            inputs.thetaRef = parseFloat(document.getElementById('thetaRef').value);
            if (!inputs.n1 || !inputs.n2 || !inputs.thetaRef) {
                alert('Ingrese valores válidos');
                return null;
            }
            break;
        case 'angulo_critico_refraccion':
            inputs.n1 = parseFloat(document.getElementById('n1').value);
            inputs.n2 = parseFloat(document.getElementById('n2').value);
            if (!inputs.n1 || !inputs.n2) {
                alert('Ingrese valores válidos');
                return null;
            }
            break;
        case 'presupuesto_enlace_coaxial':
        case 'presupuesto_enlace_fftx':
            inputs.ptx_unit = document.getElementById('ptx_unit').value;
            
            if (inputs.ptx_unit === 'watts') {
                inputs.ptx = getValueWithPrefix('ptx_watts');
                if (!inputs.ptx || inputs.ptx <= 0) {
                    alert('Ingrese una potencia válida');
                    return null;
                }
            } else if (inputs.ptx_unit === 'dBm') {
                inputs.ptx = parseFloat(document.getElementById('ptx_dbm').value);
                if (isNaN(inputs.ptx)) {
                    alert('Ingrese una potencia válida');
                    return null;
                }
            } else {
                alert('Seleccione una unidad de potencia');
                return null;
            }
            
            inputs.lconectores = parseFloat(document.getElementById('lconectores_valor').value);
            inputs.cantidad_conectores = parseInt(document.getElementById('cantidad_conectores').value);
            if (isNaN(inputs.lconectores) || isNaN(inputs.cantidad_conectores) || inputs.cantidad_conectores < 2) {
                alert('Ingrese valores válidos para conectores (mínimo 2 conectores)');
                return null;
            }
            
            inputs.amplificadores = sumarValores('amplificadores');
            
            // Calcular pérdidas por pasivos (splitters)
            inputs.lpasivos = 0;
            const splitterSelects = document.querySelectorAll('[id^="lpasivos_"]');
            splitterSelects.forEach(select => {
                if (select.value) inputs.lpasivos += parseFloat(select.value);
            });
            
            // Calcular pérdida por cable
            inputs.lcable = 0;
            const cableContainers = document.querySelectorAll('.cable-container');
            cableContainers.forEach(container => {
                const cableType = container.querySelector('.cable_type')?.value || 
                                 container.querySelector('.coaxial_cable_type')?.value;
                const frequency = container.querySelector('.coaxial_frequency')?.value;
                const distancia = parseFloat(container.querySelector('.cable_distance').value);
                
                if (formulaActual === 'presupuesto_enlace_fftx') {
                    const atenuacionKm = parseFloat(container.querySelector('.atenuacion_km').value);
                    if (!isNaN(atenuacionKm)) {
                        inputs.lcable += atenuacionKm * (distancia / 1000);
                    }
                } else {
                    if (cableType && frequency && coaxialCables[cableType] && coaxialCables[cableType][frequency]) {
                        const atenuacionPor100m = coaxialCables[cableType][frequency];
                        inputs.lcable += atenuacionPor100m * (distancia / 100);
                    }
                }
            });
            
            if (formulaActual === 'presupuesto_enlace_fftx') {
                inputs.reel_distance = parseFloat(document.getElementById('reel_distance').value);
                inputs.total_distance = parseFloat(document.getElementById('total_distance').value);
                inputs.atenuacion_empalme_valor = parseFloat(document.getElementById('atenuacion_empalme_valor').value);
                if (inputs.reel_distance <= 0 || inputs.total_distance <= 0 || isNaN(inputs.atenuacion_empalme_valor)) {
                    alert('Ingrese valores válidos para el empalme');
                    return null;
                }
            }
            
            if (isNaN(inputs.lconectores) || isNaN(inputs.lcable)) {
                alert('Ingrese valores válidos');
                return null;
            }
            break;
        case 'conversion_desiveles_wats':
            inputs.PdBW = parseFloat(document.getElementById('PdBW').value);
            if (isNaN(inputs.PdBW)) {
                alert('Ingrese un valor válido');
                return null;
            }
            break;
        case 'conversor_adimensional':
            inputs.dB = parseFloat(document.getElementById('dB').value);
            if (isNaN(inputs.dB)) {
                alert('Ingrese un valor válido');
                return null;
            }
            break;
        case 'conversor_potencial':
            inputs.dBm = parseFloat(document.getElementById('dBm').value);
            if (isNaN(inputs.dBm)) {
                alert('Ingrese un valor válido');
                return null;
            }
            break;
        case 'conversor_wats_decibelios':
            inputs.PW = getValueWithPrefix('PW');
            if (!inputs.PW || inputs.PW <= 0) {
                alert('Ingrese una potencia válida');
                return null;
            }
            break;
    }
    
    return inputs;
}

function sumarValores(baseId) {
    let total = 0;
    const inputs = document.querySelectorAll(`[id^="${baseId}_"]`);
    inputs.forEach(input => {
        const value = parseFloat(input.value);
        if (!isNaN(value)) total += value;
    });
    return total;
}

function getValueWithPrefix(inputId) {
    const inputElement = document.getElementById(inputId);
    const prefixElement = document.getElementById(`${inputId}-prefix`);
    
    if (!inputElement || !prefixElement) return 0;
    
    const value = parseFloat(inputElement.value);
    if (isNaN(value)) return 0;
    
    const prefixValue = parseFloat(prefixElement.value);
    return value * prefixValue;
}

function createPrefixSelector(id) {
    let html = `<select id="${id}-prefix" class="prefix-select">`;
    prefixes.forEach(prefix => {
        html += `<option value="${prefix.value}">${prefix.symbol} (${prefix.name})</option>`;
    });
    html += `</select>`;
    return html;
}

function cargarCalculo() {
    formulaActual = localStorage.getItem('calculo') || 'longitud_onda';
    const titulo = document.getElementById('tituloCalculo');
    const formulario = document.getElementById('formularioCalculo');
    const videoFrame = document.getElementById('formulaVideo');
    const formulaImg = document.getElementById('formulaImage');

    const multimediaConfig = {
        'longitud_onda': {
            video: 'https://www.youtube.com/embed/XpF7Bs4dmlE',
            imagen: 'imagenes/1.jpg',
            titulo: 'Longitud de Onda'
        },
        'capacidad_informacion': {
            video: 'https://www.youtube.com/embed/ryrK2SpjKLI',
            imagen: 'imagenes/2.jpg',
            titulo: 'Capacidad de Información'
        },
        'ruido': {
            video: 'https://www.youtube.com/embed/MH8_EnMBaJQ',
            imagen: 'imagenes/3.jpg',
            titulo: 'Ruido Térmico'
        },
        'voltaje_ruido_termico': {
            video: 'https://www.youtube.com/embed/FFv3_Y8Q-Sk',
            imagen: 'imagenes/4.jpg',
            titulo: 'Voltaje Ruido Térmico'
        },
        'factor_ruido': {
            video: 'https://www.youtube.com/embed/iUKHSkvFSLc',
            imagen: 'imagenes/5.jpg',
            titulo: 'Factor de Ruido'
        },
        'indicador_ruido': {
            video: 'https://www.youtube.com/embed/fVEIAD1mT_g',
            imagen: 'imagenes/6.jpg',
            titulo: 'Indicador de Ruido'
        },
        'factor_escalamiento': {
            video: 'https://www.youtube.com/embed/3yjPhcWXkjA',
            imagen: 'imagenes/7.jpg',
            titulo: 'Factor de Escalamiento'
        },
        'presupuesto_enlace_coaxial': {
            video: 'https://www.youtube.com/embed/l8vBFR7wVYY',
            imagen: 'imagenes/8.jpg',
            titulo: 'Presupuesto de Enlace Coaxial'
        },
        'presupuesto_enlace_fftx': {
            video: 'https://www.youtube.com/embed/l8vBFR7wVYY',
            imagen: 'imagenes/8.jpg',
            titulo: 'Presupuesto de Enlace FFTX'
        },
        'indice_refraccion': {
            video: '',
            imagen: 'imagenes/13.jpg',
            titulo: 'Índice de Refracción'
        },
        'angulo_critico_refraccion': {
            video: '',
            imagen: 'imagenes/14.jpg',
            titulo: 'Ángulo Crítico de Refracción'
        },
        'conversion_desiveles_wats': {
            video: 'https://youtu.be/AYGvoPv4YxU',
            imagen: 'imagenes/9.jpg',
            titulo: 'Conversión de dBW a Watts'
        },
        'conversor_adimensional': {
            video: 'https://youtu.be/XftMecR9Rak',
            imagen: 'imagenes/10.jpg',
            titulo: 'Conversor Adimensional'
        },
        'conversor_potencial': {
            video: 'https://youtu.be/AYGvoPv4YxU',
            imagen: 'imagenes/11.jpg',
            titulo: 'Conversor de dBm a Watts'
        },
        'conversor_wats_decibelios': {
            video: 'https://youtu.be/IG0ssSEFMrE',
            imagen: 'imagenes/12.jpg',
            titulo: 'Conversor de Watts a dBm'
        }
    };

    const config = multimediaConfig[formulaActual] || multimediaConfig['longitud_onda'];
    titulo.textContent = config.titulo;
    videoFrame.src = config.video;
    formulaImg.src = config.imagen;
    formulaImg.alt = `Fórmula de ${config.titulo}`;

    formulario.innerHTML = generarFormulario();
}

function generarFormulario() {
    let html = '';
    
    switch(formulaActual) {
        case 'longitud_onda':
            html = `
                <div class="form-group">
                    <label for="frecuencia">Frecuencia:</label>
                    <div class="input-with-prefix">
                        <input type="number" id="frecuencia" placeholder="300000000" step="any" required>
                        ${createPrefixSelector('frecuencia')}
                    </div>
                </div>
            `;
            break;
        case 'capacidad_informacion':
            html = `
                <div class="form-group">
                    <label for="ancho_banda">Ancho de Banda:</label>
                    <div class="input-with-prefix">
                        <input type="number" id="ancho_banda" placeholder="1000" step="any" required>
                        ${createPrefixSelector('ancho_banda')}
                    </div>
                </div>
                <div class="form-group">
                    <label for="senal">Señal (S):</label>
                    <div class="input-with-prefix">
                        <input type="number" id="senal" step="any" required>
                        ${createPrefixSelector('senal')}
                    </div>
                </div>
                <div class="form-group">
                    <label for="ruido">Ruido (N):</label>
                    <div class="input-with-prefix">
                        <input type="number" id="ruido" step="any" required>
                        ${createPrefixSelector('ruido')}
                    </div>
                </div>
            `;
            break;
        case 'ruido':
            html = `
                <div class="form-group">
                    <label for="temperatura">Temperatura:</label>
                    <input type="number" id="temperatura" step="any" required>
                </div>
                <div class="form-group">
                    <label for="unidadTemp">Unidad:</label>
                    <select id="unidadTemp" required>
                        <option value="K">Kelvin (K)</option>
                        <option value="C">Celsius (°C)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="fmax">Frecuencia Máxima:</label>
                    <div class="input-with-prefix">
                        <input type="number" id="fmax" step="any" required>
                        ${createPrefixSelector('fmax')}
                    </div>
                </div>
                <div class="form-group">
                    <label for="fmin">Frecuencia Mínima:</label>
                    <div class="input-with-prefix">
                        <input type="number" id="fmin" step="any" required>
                        ${createPrefixSelector('fmin')}
                    </div>
                </div>
            `;
            break;
        case 'voltaje_ruido_termico':
            html = `
                <div class="form-group">
                    <label for="resistencia">Resistencia (Ω):</label>
                    <div class="input-with-prefix">
                        <input type="number" id="resistencia" step="any" required>
                        ${createPrefixSelector('resistencia')}
                    </div>
                </div>
                <div class="form-group">
                    <label for="ruido">Ruido (N):</label>
                    <div class="input-with-prefix">
                        <input type="number" id="ruido" step="any" required>
                        ${createPrefixSelector('ruido')}
                    </div>
                </div>
            `;
            break;
        case 'factor_ruido':
            html = `
                <div class="form-group">
                    <label for="stx">Señal Tx (Stx):</label>
                    <div class="input-with-prefix">
                        <input type="number" id="stx" step="any" required>
                        ${createPrefixSelector('stx')}
                    </div>
                </div>
                <div class="form-group">
                    <label for="ntx">Ruido Tx (Ntx):</label>
                    <div class="input-with-prefix">
                        <input type="number" id="ntx" step="any" required>
                        ${createPrefixSelector('ntx')}
                    </div>
                </div>
                <div class="form-group">
                    <label for="srx">Señal Rx (Srx):</label>
                    <div class="input-with-prefix">
                        <input type="number" id="srx" step="any" required>
                        ${createPrefixSelector('srx')}
                    </div>
                </div>
                <div class="form-group">
                    <label for="nrx">Ruido Rx (Nrx):</label>
                    <div class="input-with-prefix">
                        <input type="number" id="nrx" step="any" required>
                        ${createPrefixSelector('nrx')}
                    </div>
                </div>
            `;
            break;
        case 'indicador_ruido':
            html = `
                <div class="form-group">
                    <label for="factor_ruido">Factor de Ruido (F):</label>
                    <input type="number" id="factor_ruido" step="any" required>
                </div>
            `;
            break;
        case 'factor_escalamiento':
            html = `
                <div class="form-group">
                    <label for="srx">Señal Rx (Srx):</label>
                    <div class="input-with-prefix">
                        <input type="number" id="srx" step="any" required>
                        ${createPrefixSelector('srx')}
                    </div>
                </div>
                <div class="form-group">
                    <label for="stx">Señal Tx (Stx):</label>
                    <div class="input-with-prefix">
                        <input type="number" id="stx" step="any" required>
                        ${createPrefixSelector('stx')}
                    </div>
                </div>
            `;
            break;
        case 'indice_refraccion':
            html = `
                <div class="form-group">
                    <label for="n1">Índice de refracción N1:</label>
                    <input type="number" id="n1" step="any" required>
                </div>
                <div class="form-group">
                    <label for="n2">Índice de refracción N2:</label>
                    <input type="number" id="n2" step="any" required>
                </div>
                <div class="form-group">
                    <label for="thetaRef">Ángulo de incidencia (θref) en grados:</label>
                    <input type="number" id="thetaRef" step="any" required>
                </div>
            `;
            break;
        case 'angulo_critico_refraccion':
            html = `
                <div class="form-group">
                    <label for="n1">Índice de refracción N1:</label>
                    <input type="number" id="n1" step="any" required>
                </div>
                <div class="form-group">
                    <label for="n2">Índice de refracción N2:</label>
                    <input type="number" id="n2" step="any" required>
                </div>
            `;
            break;
        case 'presupuesto_enlace_coaxial':
        case 'presupuesto_enlace_fftx':
            html = `
                <div class="form-group">
                    <label for="ptx">Potencia Tx (Ptx):</label>
                    <select id="ptx_unit" onchange="updatePtxFields()" required>
                        <option value="">Seleccione unidad</option>
                        <option value="dBm">dBm</option>
                        <option value="watts">Watts</option>
                    </select>
                    <div id="ptx_fields">
                        <!-- Aquí se cargarán los campos dinámicamente -->
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Pérdida Conectores (Lconectores):</label>
                    <div class="input-group">
                        <label for="lconectores_valor">Atenuación por conector (dB):</label>
                        <input type="number" id="lconectores_valor" step="any" required>
                    </div>
                    <div class="input-group">
                        <label for="cantidad_conectores">Cantidad de conectores (2-200):</label>
                        <input type="number" id="cantidad_conectores" min="2" max="200" value="2" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Pérdida Cable (Lcable):</label>
                    <div id="cables-container">
                        ${formulaActual === 'presupuesto_enlace_fftx' ? `
                            <div class="cable-container">
                                <select class="cable_type w-full mb-2" required>
                                    <option value="">Seleccione tipo de cable</option>
                                    <option value="monomodo">Mono modo</option>
                                    <option value="multimodo">Multimodo</option>
                                </select>
                                <div class="input-group">
                                    <label>Atenuación (dB/km):</label>
                                    <input type="number" class="atenuacion_km" step="any" required>
                                </div>
                                <div class="input-group">
                                    <label>Distancia (metros):</label>
                                    <input type="number" class="cable_distance" step="any" required>
                                </div>
                                <button type="button" onclick="this.parentElement.remove()" class="mt-2 bg-red-600 text-white px-2 py-1 rounded">Eliminar cable</button>
                            </div>
                        ` : `
                            <div class="cable-container">
                                <select class="coaxial_cable_type w-full mb-2" required>
                                    <option value="">Seleccione cable coaxial</option>
                                    ${Object.keys(coaxialCables).map(cable => 
                                        `<option value="${cable}">${cable}</option>`
                                    ).join('')}
                                </select>
                                <select class="coaxial_frequency w-full mb-2" required>
                                    <option value="">Seleccione frecuencia</option>
                                </select>
                                <div class="input-group">
                                    <label>Distancia (metros):</label>
                                    <input type="number" class="cable_distance" step="any" required>
                                </div>
                                <button type="button" onclick="this.parentElement.remove()" class="mt-2 bg-red-600 text-white px-2 py-1 rounded">Eliminar cable</button>
                            </div>
                        `}
                    </div>
                    <button type="button" onclick="agregarCable()" class="bg-blue-600 text-white px-2 py-1 rounded">+ Agregar cable</button>
                </div>
                
                <div class="form-group">
                    <label>Pérdidas Pasivas (Lpasivos):</label>
                    <div id="lpasivos-container">
                        <div class="flex items-center mb-2">
                            <select id="lpasivos_1" class="flex-grow">
                                <option value="">Seleccione splitter</option>
                                ${Object.entries(splitterLosses).map(([splitter, loss]) => 
                                    `<option value="${loss}">Splitter ${splitter} (${loss} dB)</option>`
                                ).join('')}
                            </select>
                            <button type="button" onclick="agregarCampoSelect('lpasivos', 'splitter')" class="ml-2 bg-blue-600 text-white px-2 py-1 rounded">+</button>
                        </div>
                    </div>
                </div>
                
                ${formulaActual === 'presupuesto_enlace_fftx' ? `
                <div class="form-group">
                    <label>Atenuación por empalme:</label>
                    <div class="input-group">
                        <label for="reel_distance">Distancia del carrete (km):</label>
                        <select id="reel_distance" required>
                            ${reelDistances.map(dist => 
                                `<option value="${dist}">Carrete de ${dist} km</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="input-group">
                        <label for="total_distance">Distancia total (km):</label>
                        <input type="number" id="total_distance" step="any" required>
                    </div>
                    <div class="input-group">
                        <label for="atenuacion_empalme_valor">Atenuación por empalme (dB):</label>
                        <input type="number" id="atenuacion_empalme_valor" step="any" required>
                    </div>
                </div>
                ` : ''}
                
                <div class="form-group">
                    <label>Amplificadores (A) en dB:</label>
                    <div id="amplificadores-container">
                        <div class="flex items-center mb-2">
                            <input type="number" id="amplificadores_1" step="any" class="flex-grow">
                            <button type="button" onclick="agregarCampo('amplificadores')" class="ml-2 bg-blue-600 text-white px-2 py-1 rounded">+</button>
                        </div>
                    </div>
                </div>
            `;
            break;
        case 'conversion_desiveles_wats':
            html = `
                <div class="form-group">
                    <label for="PdBW">Potencia en dBW:</label>
                    <input type="number" id="PdBW" step="any" required>
                </div>
            `;
            break;
        case 'conversor_adimensional':
            html = `
                <div class="form-group">
                    <label for="dB">Valor en dB:</label>
                    <input type="number" id="dB" step="any" required>
                </div>
            `;
            break;
        case 'conversor_potencial':
            html = `
                <div class="form-group">
                    <label for="dBm">Potencia en dBm:</label>
                    <input type="number" id="dBm" step="any" required>
                </div>
            `;
            break;
        case 'conversor_wats_decibelios':
            html = `
                <div class="form-group">
                    <label for="PW">Potencia en Watts:</label>
                    <div class="input-with-prefix">
                        <input type="number" id="PW" step="any" required>
                        ${createPrefixSelector('PW')}
                    </div>
                </div>
            `;
            break;
        default:
            html = '<p class="error">Fórmula no implementada</p>';
    }

    html += `
        <button type="button" onclick="calcular()" class="calculate-button">
            Calcular
        </button>
        <div class="resultado">
            <label>Resultado:</label>
            <input type="text" id="respuesta" readonly class="result-box">
        </div>
        <button type="button" onclick="volver()" class="calculate-buttonv">
            Volver al Menú
        </button>
    `;

    return html;
}

function updatePtxFields() {
    const unit = document.getElementById('ptx_unit').value;
    const ptxFields = document.getElementById('ptx_fields');
    
    if (unit === 'watts') {
        ptxFields.innerHTML = `
            <div class="input-with-prefix">
                <input type="number" id="ptx_watts" step="any" required>
                ${createPrefixSelector('ptx_watts')}
            </div>
        `;
    } else if (unit === 'dBm') {
        ptxFields.innerHTML = `
            <input type="number" id="ptx_dbm" step="any" required>
        `;
    } else {
        ptxFields.innerHTML = '';
    }
}

function agregarCable() {
    const container = document.getElementById('cables-container');
    const count = container.querySelectorAll('.cable-container').length + 1;
    const div = document.createElement('div');
    div.className = 'cable-container';
    
    if (formulaActual === 'presupuesto_enlace_fftx') {
        div.innerHTML = `
            <select class="cable_type w-full mb-2" required>
                <option value="">Seleccione tipo de cable</option>
                <option value="monomodo">Mono modo</option>
                <option value="multimodo">Multimodo</option>
            </select>
            <div class="input-group">
                <label>Atenuación (dB/km):</label>
                <input type="number" class="atenuacion_km" step="any" required>
            </div>
            <div class="input-group">
                <label>Distancia (metros):</label>
                <input type="number" class="cable_distance" step="any" required>
            </div>
            <button type="button" onclick="this.parentElement.remove()" class="mt-2 bg-red-600 text-white px-2 py-1 rounded">Eliminar cable</button>
        `;
    } else {
        div.innerHTML = `
            <select class="coaxial_cable_type w-full mb-2" required>
                <option value="">Seleccione cable coaxial</option>
                ${Object.keys(coaxialCables).map(cable => 
                    `<option value="${cable}">${cable}</option>`
                ).join('')}
            </select>
            <select class="coaxial_frequency w-full mb-2" required>
                <option value="">Seleccione frecuencia</option>
            </select>
            <div class="input-group">
                <label>Distancia (metros):</label>
                <input type="number" class="cable_distance" step="any" required>
            </div>
            <button type="button" onclick="this.parentElement.remove()" class="mt-2 bg-red-600 text-white px-2 py-1 rounded">Eliminar cable</button>
        `;
    }
    
    container.appendChild(div);
}

function agregarCampo(baseId) {
    const container = document.getElementById(`${baseId}-container`);
    const count = container.querySelectorAll('input').length + 1;
    const div = document.createElement('div');
    div.className = 'flex items-center mb-2';
    div.innerHTML = `
        <input type="number" id="${baseId}_${count}" step="any" class="flex-grow">
        <button type="button" onclick="this.parentElement.remove()" class="ml-2 bg-red-600 text-white px-2 py-1 rounded">-</button>
    `;
    container.appendChild(div);
}

function agregarCampoSelect(baseId, type) {
    const container = document.getElementById(`${baseId}-container`);
    const count = container.querySelectorAll('select').length + 1;
    const div = document.createElement('div');
    div.className = 'flex items-center mb-2';
    
    if (type === 'splitter') {
        div.innerHTML = `
            <select id="${baseId}_${count}" class="flex-grow">
                <option value="">Seleccione splitter</option>
                ${Object.entries(splitterLosses).map(([splitter, loss]) => 
                    `<option value="${loss}">Splitter ${splitter} (${loss} dB)</option>`
                ).join('')}
            </select>
            <button type="button" onclick="this.parentElement.remove()" class="ml-2 bg-red-600 text-white px-2 py-1 rounded">-</button>
        `;
    }
    
    container.appendChild(div);
}

// Actualizar frecuencias cuando se selecciona cable coaxial
document.addEventListener('change', function(e) {
    if (e.target.classList.contains('coaxial_cable_type')) {
        const cableType = e.target.value;
        const freqSelect = e.target.parentElement.querySelector('.coaxial_frequency');
        freqSelect.innerHTML = '<option value="">Seleccione frecuencia</option>';
        
        if (cableType && coaxialCables[cableType]) {
            for (const freq in coaxialCables[cableType]) {
                freqSelect.innerHTML += `<option value="${freq}">${freq}</option>`;
            }
        }
    }
});

function redirectToCalculos(calculo) {
    localStorage.setItem('calculo', calculo);
    window.location.href = 'calculos.html';
}

function volver() {
    window.location.href = 'index.html';
}