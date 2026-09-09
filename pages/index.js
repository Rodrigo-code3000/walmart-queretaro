import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('./components/Map'), { ssr: false });

export default function Home() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
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

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <h1 style={{ color: '#333' }}>🗺️ Mapa de Calor - Ventas Walmart Querétaro</h1>
      
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
            <h3 style={{ margin: 0, color: '#3498db' }}>{data.length}</h3>
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#7f8c8d' }}>TOTAL REGISTROS</p>
            <h3 style={{ margin: 0, color: '#e74c3c' }}>{data.reduce((sum, d) => sum + parseInt(d.registros), 0)}</h3>
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
            height: '600px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            overflow: 'hidden'
          }}>
            <MapComponent data={data} />
          </div>

          {/* TABLA */}
          <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#34495e', color: 'white' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Código Postal</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Municipio</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Total Ventas</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Unidades</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Registros</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Producto Top</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #ecf0f1', backgroundColor: i % 2 === 0 ? '#f8f9fa' : 'white' }}>
                    <td style={{ padding: '12px' }}><strong>{row.codigo_postal}</strong></td>
                    <td style={{ padding: '12px' }}>{row.municipio}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#27ae60', fontWeight: 'bold' }}>
                      ${parseFloat(row.total_ventas).toFixed(2)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{row.total_unidades}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{row.registros}</td>
                    <td style={{ padding: '12px', color: '#e67e22', fontWeight: 'bold' }}>{row.producto_top}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}