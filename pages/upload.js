import { useState, useRef } from 'react';

export default function Upload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.status === 'ok') {
        setResult(data);
      } else {
        setError(data.message || 'Error al procesar el archivo');
      }
    } catch (err) {
      setError('Error de conexión: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div style={{ backgroundColor: '#F7F8FA', minHeight: '100vh', fontFamily: "'Inter', -apple-system, sans-serif" }}>

      <div style={{ backgroundColor: '#0F1923', padding: '0 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#FFFFFF', letterSpacing: '-0.3px' }}>
              Carga de Datos
            </h1>
            <span style={{ fontSize: '13px', color: '#4A5568' }}>archivos semanales Walmart</span>
          </div>
          <a href="/" style={{ fontSize: '12px', color: '#6B7280', backgroundColor: 'rgba(255,255,255,0.06)', padding: '4px 12px', borderRadius: '20px', textDecoration: 'none' }}>
            Ver mapa
          </a>
        </div>
      </div>

      <div style={{ padding: '40px', maxWidth: '700px', margin: '0 auto' }}>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '28px', marginBottom: '24px' }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '600', color: '#111827' }}>
            Como funciona
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            {[
              { n: '1', title: 'Sube el archivo', desc: 'XLS o XLSX semanal de Walmart' },
              { n: '2', title: 'Deteccion automatica', desc: 'El sistema lee la semana y año del archivo' },
              { n: '3', title: 'Carga segura', desc: 'Solo inserta datos nuevos, nunca duplica' },
            ].map(step => (
              <div key={step.n} style={{ padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '8px', border: '1px solid #F3F4F6' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#3B82F6', marginBottom: '6px' }}>PASO {step.n}</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>{step.title}</div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '28px', marginBottom: '24px' }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '15px', fontWeight: '600', color: '#111827' }}>
            Seleccionar archivo
          </h2>

          <div
            onClick={() => fileRef.current?.click()}
            style={{ border: '2px dashed #E5E7EB', borderRadius: '10px', padding: '40px', textAlign: 'center', cursor: 'pointer', backgroundColor: file ? '#F0FDF4' : '#FAFAFA', borderColor: file ? '#059669' : '#E5E7EB', marginBottom: '20px' }}
          >
            <input ref={fileRef} type="file" accept=".xls,.xlsx" onChange={handleFile} style={{ display: 'none' }} />
            {file ? (
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#059669', marginBottom: '4px' }}>{file.name}</div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>{(file.size / 1024).toFixed(0)} KB · Click para cambiar</div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                  Click para seleccionar archivo
                </div>
                <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Formatos aceptados: .xls, .xlsx</div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleUpload}
              disabled={!file || loading}
              style={{ flex: 1, padding: '12px', backgroundColor: !file || loading ? '#E5E7EB' : '#0F1923', color: !file || loading ? '#9CA3AF' : '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: !file || loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Procesando...' : 'Cargar datos'}
            </button>
            {file && (
              <button
                onClick={reset}
                style={{ padding: '12px 20px', backgroundColor: '#F3F4F6', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {result && (
          <div style={{ backgroundColor: '#F0FDF4', borderRadius: '12px', border: '1px solid #BBF7D0', padding: '28px', marginBottom: '24px' }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '15px', fontWeight: '600', color: '#059669' }}>
              Carga completada
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
              {[
                { label: 'Semana', value: result.semana },
                { label: 'Año', value: result.año },
                { label: 'Tiendas', value: result.tiendas_encontradas },
                { label: 'Ventas insertadas', value: result.ventas_insertadas?.toLocaleString('es-MX') },
              ].map(kpi => (
                <div key={kpi.label} style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '8px', border: '1px solid #BBF7D0', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{kpi.label}</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#059669' }}>{kpi.value}</div>
                </div>
              ))}
            </div>
            {result.productos_nuevos > 0 && (
              <div style={{ fontSize: '13px', color: '#374151', marginBottom: '16px' }}>
                <strong>Productos nuevos agregados:</strong> {result.productos_nuevos}
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px' }}>
              <a href="/" style={{ flex: 1, padding: '12px', backgroundColor: '#059669', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', textAlign: 'center', textDecoration: 'none' }}>
                Ver en el mapa
              </a>
              <button onClick={reset} style={{ padding: '12px 20px', backgroundColor: '#FFFFFF', color: '#374151', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                Cargar otra semana
              </button>
            </div>
          </div>
        )}

        {error && (
          <div style={{ backgroundColor: '#FEF2F2', borderRadius: '12px', border: '1px solid #FECACA', padding: '20px' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#DC2626', marginBottom: '4px' }}>Error al procesar</div>
            <div style={{ fontSize: '13px', color: '#374151' }}>{error}</div>
          </div>
        )}

      </div>
    </div>
  );
}