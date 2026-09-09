import { useState, useEffect } from 'react';

export default function Home() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetch('/api/ventas')
      .then(r => r.json())
      .then(result => {
        setData(result.data || []);
        setTotal(result.data?.reduce((sum, d) => sum + parseFloat(d.total_ventas), 0) || 0);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>🗺️ Mapa Walmart Querétaro</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Total Ventas: ${total.toFixed(2)}</h2>
        <p>Registros: {data.length}</p>
      </div>

      {loading ? (
        <p>Cargando datos...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ border: '1px solid #ddd', padding: '10px' }}>Código Postal</th>
              <th style={{ border: '1px solid #ddd', padding: '10px' }}>Municipio</th>
              <th style={{ border: '1px solid #ddd', padding: '10px' }}>Total Ventas</th>
              <th style={{ border: '1px solid #ddd', padding: '10px' }}>Registros</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                <td style={{ border: '1px solid #ddd', padding: '10px' }}>{row.codigo_postal}</td>
                <td style={{ border: '1px solid #ddd', padding: '10px' }}>{row.municipio}</td>
                <td style={{ border: '1px solid #ddd', padding: '10px' }}>${parseFloat(row.total_ventas).toFixed(2)}</td>
                <td style={{ border: '1px solid #ddd', padding: '10px' }}>{row.registros}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}