import { useState, useEffect } from 'react';

export default function Buscador({ onFiltro, capa }) {
  const [estados, setEstados] = useState([]);
  const [cpsPorEstado, setCpsPorEstado] = useState([]);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState('');
  const [cpSeleccionado, setCpSeleccionado] = useState('');

  // Recargar filtros cuando cambia la capa
  useEffect(() => {
    setEstadoSeleccionado('');
    setCpSeleccionado('');

    const endpoint = capa === 'walmart' ? '/api/filtros' : '/api/filtros-particulares';

    fetch(endpoint)
      .then(r => r.json())
      .then(result => {
        setEstados(result.estados || []);
        setCpsPorEstado(result.cps_por_estado || []);
        if (result.estados.length > 0) {
          setEstadoSeleccionado(result.estados[0].estado);
          onFiltro({ estado: result.estados[0].estado, cp: '' });
        }
      })
      .catch(err => console.error(err));
  }, [capa]);

  const cpsDelEstado = cpsPorEstado
    .filter(d => d.estado === estadoSeleccionado)
    .map(d => d.codigo_postal);

  const handleEstadoChange = (e) => {
    const estado = e.target.value;
    setEstadoSeleccionado(estado);
    setCpSeleccionado('');
    onFiltro({ estado, cp: '' });
  };

  const handleCpChange = (e) => {
    const cp = e.target.value;
    setCpSeleccionado(cp);
    onFiltro({ estado: estadoSeleccionado, cp });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
      <div>
        <label style={{ fontSize: '11px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Estado
        </label>
        <select
          value={estadoSeleccionado}
          onChange={handleEstadoChange}
          style={{ width: '100%', padding: '8px 12px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', fontSize: '13px', backgroundColor: 'rgba(255,255,255,0.08)', color: '#FFFFFF', marginTop: '4px' }}
        >
          {estados.map(e => (
            <option key={e.estado} value={e.estado} style={{ backgroundColor: '#1a2634', color: '#FFFFFF' }}>
              {e.estado}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label style={{ fontSize: '11px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Código postal
        </label>
        <select
          value={cpSeleccionado}
          onChange={handleCpChange}
          style={{ width: '100%', padding: '8px 12px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', fontSize: '13px', backgroundColor: 'rgba(255,255,255,0.08)', color: '#FFFFFF', marginTop: '4px' }}
        >
          <option value="" style={{ backgroundColor: '#1a2634' }}>Todos en {estadoSeleccionado}</option>
          {cpsDelEstado.map(cp => (
            <option key={cp} value={cp} style={{ backgroundColor: '#1a2634' }}>
              {cp}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}