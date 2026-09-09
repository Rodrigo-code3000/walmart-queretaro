import { useState, useEffect } from 'react';

export default function Buscador({ onFiltro }) {
  const [estados, setEstados] = useState([]);
  const [cpsPorEstado, setCpsPorEstado] = useState([]);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState('');
  const [cpSeleccionado, setCpSeleccionado] = useState('');

  useEffect(() => {
    fetch('/api/filtros')
      .then(r => r.json())
      .then(result => {
        setEstados(result.estados || []);
        setCpsPorEstado(result.cps_por_estado || []);
        if (result.estados.length > 0) {
          setEstadoSeleccionado(result.estados[0].estado);
        }
      })
      .catch(err => console.error(err));
  }, []);

  // CPs del estado seleccionado
  const cpsDelEstado = cpsPorEstado
    .filter(d => d.estado === estadoSeleccionado)
    .map(d => d.codigo_postal);

  const handleEstadoChange = (e) => {
    const estado = e.target.value;
    setEstadoSeleccionado(estado);
    setCpSeleccionado(''); // Reset CP
    onFiltro({ estado, cp: '' });
  };

  const handleCpChange = (e) => {
    const cp = e.target.value;
    setCpSeleccionado(cp);
    onFiltro({ estado: estadoSeleccionado, cp });
  };

  return (
    <div style={{
      marginBottom: '20px',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '10px'
    }}>
      <div>
        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#7f8c8d' }}>
          📍 ESTADO
        </label>
        <select
          value={estadoSeleccionado}
          onChange={handleEstadoChange}
          style={{
            width: '100%',
            padding: '10px',
            border: '2px solid #3498db',
            borderRadius: '5px',
            fontSize: '14px'
          }}
        >
          {estados.map(e => (
            <option key={e.estado} value={e.estado}>
              {e.estado}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#7f8c8d' }}>
          📮 CÓDIGO POSTAL
        </label>
        <select
          value={cpSeleccionado}
          onChange={handleCpChange}
          style={{
            width: '100%',
            padding: '10px',
            border: '2px solid #27ae60',
            borderRadius: '5px',
            fontSize: '14px'
          }}
        >
          <option value="">Ver todos en {estadoSeleccionado}</option>
          {cpsDelEstado.map(cp => (
            <option key={cp} value={cp}>
              {cp}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}