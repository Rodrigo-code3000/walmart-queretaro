import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('./components/Map'), { ssr: false });

export default function Home() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [totalVentas, setTotalVentas] = useState(0);

  useEffect(() => {
    fetch('/api/ventas')
      .then(r => r.json())
      .then(result => {
        if (result.data) {
          setData(result.data);
          const suma = result.data.reduce((sum, d) => sum + parseFloat(d.total_ventas), 0);
          setTotalVentas(suma);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error:', err);
        setLoading(false);
      });
  }, []);

 const dataFiltrada = data.filter(d => 
  (d.codigo_postal && d.codigo_postal.includes(filtro)) || 
  (d.municipio && d.municipio.toLowerCase().includes(filtro.toLowerCase()))
);

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <h1 style={{ color: '#333' }}>🗺️ Mapa de Calor - Ventas Walmart Querétaro</h1>
      
      {/* BUSCADOR */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Buscar por código postal o municipio..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '14px',
            border: '1px solid #ddd',
            borderRadius: '5px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        />
      </div>

      {/* RESUMEN */}
      <div style={{ 
        marginBottom: '30px', 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#2c3e50' }}>📊 Resumen</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
          <div>
            <p style={{ fontSize: '12px', color: '#7f8c8d' }}>TOTAL VENTAS</p>
            <h3 style={{ margin: 0, color: '#27ae60' }}>${totalVentas.toFixed(2)}</h3>
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#7f8c8d' }}>CÓDIGOS POSTALES</p>
            <h3 style={{ margin: 0, color: '#3498db' }}>{dataFiltrada.length}</h3>
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#7f8c8d' }}>TOTAL REGISTROS</p>
            <h3 style={{ margin: 0, color: '#e74c3c' }}>{dataFiltrada.reduce((sum, d) => sum + parseInt(d.registros), 0)}</h3>
          </div>
        </div>
      </div>

      {loading ? (
        <p>Cargando datos de Supabase...</p>
      ) : (
        <>
          {/* MAPA */}
          <div style={{ 
            marginBottom: '30px',
            height: '500px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            overflow: 'hidden'
          }}>
            <MapComponent data={dataFiltrada} />
          </div>

          {/* TABLA CON TOP 5 PRODUCTOS */}
          <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            {dataFiltrada.map((cp, idx) => (
              <div key={idx} style={{ borderBottom: '2px solid #ecf0f1', padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div>
                    <p style={{ fontSize: '11px', color: '#7f8c8d', margin: 0 }}>CÓDIGO POSTAL</p>
                    <h3 style={{ margin: '5px 0 0 0', color: '#2c3e50' }}>{cp.codigo_postal}</h3>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: '#7f8c8d', margin: 0 }}>MUNICIPIO</p>
                    <h3 style={{ margin: '5px 0 0 0', color: '#2c3e50' }}>{cp.municipio}</h3>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: '#7f8c8d', margin: 0 }}>TOTAL VENTAS</p>
                    <h3 style={{ margin: '5px 0 0 0', color: '#27ae60' }}>${parseFloat(cp.total_ventas).toFixed(2)}</h3>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: '#7f8c8d', margin: 0 }}>REGISTROS</p>
                    <h3 style={{ margin: '5px 0 0 0', color: '#e74c3c' }}>{cp.registros}</h3>
                  </div>
                </div>

                {/* TOP 5 PRODUCTOS */}
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#34495e', margin: '10px 0 10px 0' }}>🏆 TOP 5 PRODUCTOS:</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                    {cp.top_productos.map((prod, i) => (
                      <div key={i} style={{
                        backgroundColor: '#f8f9fa',
                        padding: '10px',
                        borderRadius: '5px',
                        border: '1px solid #ecf0f1'
                      }}>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e74c3c', marginBottom: '5px' }}>
                          #{prod.ranking}
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '5px' }}>
                          {prod.item_desc.substring(0, 30)}...
                        </div>
                        <div style={{ fontSize: '11px', color: '#7f8c8d' }}>
                          📦 {prod.cantidad} unidades
                        </div>
                        <div style={{ fontSize: '11px', color: '#27ae60', fontWeight: 'bold' }}>
                          ${parseFloat(prod.ventas).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}