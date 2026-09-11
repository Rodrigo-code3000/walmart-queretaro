import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Buscador from './components/Buscador';

const MapComponent = dynamic(() => import('./components/Map'), { ssr: false });

export default function Home() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroCp, setFiltroCp] = useState('');
  const [selectedCp, setSelectedCp] = useState(null);

  useEffect(() => {
    fetch('/api/ventas')
      .then(r => r.json())
      .then(result => {
        if (result.data) {
          setData(result.data);
          if (result.data.length > 0) {
            setFiltroEstado(result.data[0].estado || '');
            setSelectedCp(result.data[0]);
          }
        }
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, []);

  const handleFiltro = ({ estado, cp }) => {
    setFiltroEstado(estado);
    setFiltroCp(cp);
  };

  const dataFiltrada = data.filter(d => {
    const matchEstado = !filtroEstado || d.estado === filtroEstado;
    const matchCp = !filtroCp || d.codigo_postal === filtroCp;
    return matchEstado && matchCp;
  });

  const totalVentas = dataFiltrada.reduce((sum, d) => sum + parseFloat(d.total_ventas), 0);
  const totalUnidades = dataFiltrada.reduce((sum, d) => sum + parseInt(d.total_unidades || 0), 0);
  const totalRegistros = dataFiltrada.reduce((sum, d) => sum + parseInt(d.registros || 0), 0);
  const topProducto = selectedCp?.top_productos?.[0] || null;

  const fmt = (n) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`;

  return (
    <div style={{ backgroundColor: '#F7F8FA', minHeight: '100vh', fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* HEADER */}
      <div style={{ backgroundColor: '#0F1923', padding: '0 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#FFFFFF', letterSpacing: '-0.3px' }}>
              Análisis de Ventas
            </h1>
            <span style={{ fontSize: '13px', color: '#4A5568' }}>por código postal</span>
          </div>
          <span style={{ fontSize: '12px', color: '#6B7280', backgroundColor: 'rgba(255,255,255,0.06)', padding: '4px 12px', borderRadius: '20px' }}>
            {filtroEstado} · {dataFiltrada.length} CPs
          </span>
        </div>
        <div style={{ padding: '16px 0' }}>
          <Buscador onFiltro={handleFiltro} />
        </div>
      </div>

      {/* MAIN */}
      <div style={{ padding: '32px 40px', maxWidth: '1440px', margin: '0 auto' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: '#9CA3AF', fontSize: '14px' }}>
            Cargando datos...
          </div>
        ) : (
          <div>
            {/* MAPA */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px', height: '520px', border: '1px solid #E5E7EB' }}>
              <MapComponent data={dataFiltrada} />
            </div>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>

              <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '12px', border: '1px solid #E5E7EB', borderTop: '3px solid #059669' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#9CA3AF', fontWeight: '600', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                  Ventas totales
                </p>
                <h3 style={{ margin: 0, fontSize: '32px', color: '#059669', fontWeight: '700', letterSpacing: '-1px', lineHeight: 1 }}>
                  {fmt(totalVentas)}
                </h3>
                <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#9CA3AF' }}>
                  {dataFiltrada.length} códigos postales
                </p>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '12px', border: '1px solid #E5E7EB', borderTop: '3px solid #3B82F6' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#9CA3AF', fontWeight: '600', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                  Unidades vendidas
                </p>
                <h3 style={{ margin: 0, fontSize: '32px', color: '#3B82F6', fontWeight: '700', letterSpacing: '-1px', lineHeight: 1 }}>
                  {totalUnidades.toLocaleString()}
                </h3>
                <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#9CA3AF' }}>
                  en {filtroEstado}
                </p>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '12px', border: '1px solid #E5E7EB', borderTop: '3px solid #F59E0B' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#9CA3AF', fontWeight: '600', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                  Transacciones
                </p>
                <h3 style={{ margin: 0, fontSize: '32px', color: '#F59E0B', fontWeight: '700', letterSpacing: '-1px', lineHeight: 1 }}>
                  {totalRegistros.toLocaleString()}
                </h3>
                <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#9CA3AF' }}>
                  registros totales
                </p>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '12px', border: '1px solid #E5E7EB', borderTop: '3px solid #8B5CF6' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#9CA3AF', fontWeight: '600', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                  Producto líder
                </p>
                <h3 style={{ margin: 0, fontSize: '15px', color: '#8B5CF6', fontWeight: '700', lineHeight: '1.3' }}>
                  {topProducto ? topProducto.item_desc : '—'}
                </h3>
                <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#9CA3AF' }}>
                  {topProducto ? `${topProducto.cantidad} unidades` : 'Selecciona un CP'}
                </p>
              </div>

            </div>

            {/* TABLA DETALLE */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 28px', borderBottom: '1px solid #F3F4F6' }}>
                <h2 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#111827', letterSpacing: '-0.2px' }}>
                  Detalle por código postal
                </h2>
                <span style={{ fontSize: '12px', color: '#9CA3AF', backgroundColor: '#F3F4F6', padding: '3px 10px', borderRadius: '20px' }}>
                  {dataFiltrada.length} resultados
                </span>
              </div>

              {dataFiltrada.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>
                  No hay datos para los filtros seleccionados.
                </div>
              ) : (
                dataFiltrada.map((cp, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedCp(cp)}
                    style={{ padding: '20px 28px', borderBottom: '1px solid #F3F4F6', cursor: 'pointer', backgroundColor: selectedCp?.codigo_postal === cp.codigo_postal ? '#FAFBFF' : '#FFFFFF', transition: 'background-color 0.15s ease' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F9FAFB'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = selectedCp?.codigo_postal === cp.codigo_postal ? '#FAFBFF' : '#FFFFFF'; }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: '24px', marginBottom: '20px', alignItems: 'start' }}>
                      <div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#9CA3AF', fontWeight: '600', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                          Código postal
                        </p>
                        <p style={{ margin: '0 0 2px 0', fontSize: '22px', fontWeight: '700', color: '#111827', letterSpacing: '-0.5px' }}>
                          {cp.codigo_postal}
                        </p>
                        <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>
                          {cp.municipio} · {cp.estado}
                        </p>
                      </div>
                      <div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#9CA3AF', fontWeight: '600', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                          Ventas
                        </p>
                        <p style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#059669', letterSpacing: '-0.5px' }}>
                          {fmt(parseFloat(cp.total_ventas))}
                        </p>
                      </div>
                      <div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#9CA3AF', fontWeight: '600', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                          Unidades
                        </p>
                        <p style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#3B82F6', letterSpacing: '-0.5px' }}>
                          {parseInt(cp.total_unidades).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#9CA3AF', fontWeight: '600', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                          Registros
                        </p>
                        <p style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#F59E0B', letterSpacing: '-0.5px' }}>
                          {parseInt(cp.registros).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {cp.top_productos.length > 0 && (
                      <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '16px' }}>
                        <p style={{ margin: '0 0 12px 0', fontSize: '11px', color: '#9CA3AF', fontWeight: '600', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                          Top 5 productos
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                          {cp.top_productos.map((prod, i) => (
                            <div
                              key={i}
                              style={{ backgroundColor: prod.ranking === 1 ? '#FAFBFF' : '#FAFAFA', padding: '14px', borderRadius: '8px', border: prod.ranking === 1 ? '1px solid #DBEAFE' : '1px solid #F3F4F6' }}
                            >
                              <p style={{ margin: '0 0 6px 0', fontSize: '10px', fontWeight: '700', color: prod.ranking === 1 ? '#3B82F6' : '#D1D5DB', letterSpacing: '0.5px' }}>
                                #{prod.ranking}
                              </p>
                              <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '600', color: '#374151', lineHeight: '1.4' }}>
                                {prod.item_desc.length > 28 ? prod.item_desc.substring(0, 28) + '…' : prod.item_desc}
                              </p>
                              <p style={{ margin: '0 0 2px 0', fontSize: '11px', color: '#9CA3AF' }}>
                                {prod.cantidad} unidades
                              </p>
                              <p style={{ margin: 0, fontSize: '12px', color: '#059669', fontWeight: '700' }}>
                                ${parseFloat(prod.ventas).toFixed(0)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}