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
  const topProducto = dataFiltrada.length > 0 && selectedCp?.top_productos?.length > 0 
    ? selectedCp.top_productos[0] 
    : null;

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* HEADER */}
      <div style={{
        backgroundColor: '#2c3e50',
        color: 'white',
        padding: '20px 30px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        borderBottom: '3px solid #3498db'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ margin: '0 0 5px 0', fontSize: '28px', fontWeight: 'bold' }}>
              🗺️ Mapa de Calor Walmart
            </h1>
            <p style={{ margin: 0, fontSize: '12px', color: '#bdc3c7' }}>
              Análisis de ventas por código postal
            </p>
          </div>
          <div style={{ fontSize: '12px', color: '#95a5a6' }}>
            Estado: <strong>{filtroEstado}</strong> | CPs: <strong>{dataFiltrada.length}</strong>
          </div>
        </div>

        {/* FILTROS */}
        <Buscador onFiltro={handleFiltro} />
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
        
        {loading ? (
          <p style={{ textAlign: 'center', color: '#7f8c8d' }}>Cargando datos...</p>
        ) : (
          <>
            {/* MAPA - EL PROTAGONISTA */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '10px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              overflow: 'hidden',
              marginBottom: '30px',
              height: '500px'
            }}>
              <MapComponent data={dataFiltrada} />
            </div>

            {/* KPIs EN TARJETAS */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '15px',
              marginBottom: '30px'
            }}>
              {/* Total Ventas */}
              <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                borderLeft: '4px solid #27ae60'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ margin: '0 0 10px 0', fontSize: '11px', color: '#7f8c8d', fontWeight: 'bold' }}>
                      💰 TOTAL VENTAS
                    </p>
                    <h3 style={{ margin: 0, fontSize: '28px', color: '#27ae60', fontWeight: 'bold' }}>
                      ${totalVentas.toFixed(0)}
                    </h3>
                  </div>
                </div>
                <p style={{ margin: '10px 0 0 0', fontSize: '11px', color: '#95a5a6' }}>
                  {dataFiltrada.length} código(s) postal(es)
                </p>
              </div>

              {/* Códigos Postales */}
              <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                borderLeft: '4px solid #3498db'
              }}>
                <div>
                  <p style={{ margin: '0 0 10px 0', fontSize: '11px', color: '#7f8c8d', fontWeight: 'bold' }}>
                    📍 CÓDIGOS POSTALES
                  </p>
                  <h3 style={{ margin: 0, fontSize: '28px', color: '#3498db', fontWeight: 'bold' }}>
                    {dataFiltrada.length}
                  </h3>
                </div>
                <p style={{ margin: '10px 0 0 0', fontSize: '11px', color: '#95a5a6' }}>
                  en {filtroEstado}
                </p>
              </div>

              {/* Total Registros */}
              <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                borderLeft: '4px solid #e74c3c'
              }}>
                <div>
                  <p style={{ margin: '0 0 10px 0', fontSize: '11px', color: '#7f8c8d', fontWeight: 'bold' }}>
                    📊 TOTAL REGISTROS
                  </p>
                  <h3 style={{ margin: 0, fontSize: '28px', color: '#e74c3c', fontWeight: 'bold' }}>
                    {dataFiltrada.reduce((sum, d) => sum + parseInt(d.registros || 0), 0)}
                  </h3>
                </div>
                <p style={{ margin: '10px 0 0 0', fontSize: '11px', color: '#95a5a6' }}>
                  transacciones
                </p>
              </div>

              {/* Top Producto */}
              <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                borderLeft: '4px solid #f39c12'
              }}>
                <div>
                  <p style={{ margin: '0 0 10px 0', fontSize: '11px', color: '#7f8c8d', fontWeight: 'bold' }}>
                    🏆 TOP PRODUCTO
                  </p>
                  <h3 style={{ margin: 0, fontSize: '14px', color: '#f39c12', fontWeight: 'bold', lineHeight: '1.4' }}>
                    {topProducto ? topProducto.item_desc.substring(0, 25) + '...' : 'N/A'}
                  </h3>
                </div>
                <p style={{ margin: '10px 0 0 0', fontSize: '11px', color: '#95a5a6' }}>
                  {topProducto ? topProducto.cantidad + ' unidades' : '---'}
                </p>
              </div>
            </div>

            {/* TABLA - DETALLES */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '10px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              overflow: 'hidden'
            }}>
              <div style={{
                backgroundColor: '#34495e',
                color: 'white',
                padding: '20px',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                📈 DETALLES POR CÓDIGO POSTAL
              </div>

              {dataFiltrada.length === 0 ? (
                <p style={{ padding: '20px', textAlign: 'center', color: '#7f8c8d' }}>
                  No hay datos para los filtros seleccionados
                </p>
              ) : (
                dataFiltrada.map((cp, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => setSelectedCp(cp)}
                    style={{
                      padding: '20px',
                      borderBottom: '1px solid #ecf0f1',
                      cursor: 'pointer',
                      backgroundColor: selectedCp?.codigo_postal === cp.codigo_postal ? '#f0f8ff' : 'white',
                      transition: 'background-color 0.2s',
                      ':hover': { backgroundColor: '#f8f9fa' }
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 
                      selectedCp?.codigo_postal === cp.codigo_postal ? '#f0f8ff' : 'white'
                    }
                  >
                    {/* Encabezado CP */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                      <div>
                        <p style={{ fontSize: '11px', color: '#7f8c8d', margin: 0, fontWeight: 'bold' }}>📍 CP</p>
                        <h4 style={{ fontSize: '18px', color: '#2c3e50', margin: '5px 0 0 0', fontWeight: 'bold' }}>
                          {cp.codigo_postal}
                        </h4>
                        <p style={{ fontSize: '11px', color: '#95a5a6', margin: '3px 0 0 0' }}>
                          {cp.municipio}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: '11px', color: '#7f8c8d', margin: 0, fontWeight: 'bold' }}>💰 VENTAS</p>
                        <h4 style={{ fontSize: '18px', color: '#27ae60', margin: '5px 0 0 0', fontWeight: 'bold' }}>
                          ${parseFloat(cp.total_ventas).toFixed(0)}
                        </h4>
                      </div>
                      <div>
                        <p style={{ fontSize: '11px', color: '#7f8c8d', margin: 0, fontWeight: 'bold' }}>📦 UNIDADES</p>
                        <h4 style={{ fontSize: '18px', color: '#3498db', margin: '5px 0 0 0', fontWeight: 'bold' }}>
                          {cp.total_unidades}
                        </h4>
                      </div>
                      <div>
                        <p style={{ fontSize: '11px', color: '#7f8c8d', margin: 0, fontWeight: 'bold' }}>📊 REGISTROS</p>
                        <h4 style={{ fontSize: '18px', color: '#e74c3c', margin: '5px 0 0 0', fontWeight: 'bold' }}>
                          {cp.registros}
                        </h4>
                      </div>
                    </div>

                    {/* TOP 5 PRODUCTOS */}
                    {cp.top_productos.length > 0 && (
                      <div>
                        <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#34495e', margin: '15px 0 10px 0' }}>
                          🏆 TOP 5 PRODUCTOS
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                          {cp.top_productos.map((prod, i) => (
                            <div key={i} style={{
                              backgroundColor: '#f8f9fa',
                              padding: '12px',
                              borderRadius: '6px',
                              border: '1px solid #ecf0f1',
                              textAlign: 'center'
                            }}>
                              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#e74c3c', marginBottom: '5px' }}>
                                #{prod.ranking}
                              </div>
                              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '8px', lineHeight: '1.3' }}>
                                {prod.item_desc.substring(0, 25)}...
                              </div>
                              <div style={{ fontSize: '11px', color: '#7f8c8d', marginBottom: '3px' }}>
                                {prod.cantidad} unidades
                              </div>
                              <div style={{ fontSize: '12px', color: '#27ae60', fontWeight: 'bold' }}>
                                ${parseFloat(prod.ventas).toFixed(0)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}