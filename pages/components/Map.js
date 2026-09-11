import { useEffect, useRef } from 'react';

export default function MapComponent({ data }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    if (!mapRef.current || !data || data.length === 0) return;

    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    const L = require('leaflet');
    require('leaflet/dist/leaflet.css');

    // Centro dinámico basado en los datos filtrados
    const dataCon = data.filter(d => d.latitude && d.longitude);
    const centerLat = dataCon.length > 0
      ? dataCon.reduce((sum, d) => sum + parseFloat(d.latitude), 0) / dataCon.length
      : 20.59;
    const centerLon = dataCon.length > 0
      ? dataCon.reduce((sum, d) => sum + parseFloat(d.longitude), 0) / dataCon.length
      : -99.0;

    mapInstance.current = L.map(mapRef.current).setView([centerLat, centerLon], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(mapInstance.current);

    const maxVentas = Math.max(...data.map(d => parseFloat(d.total_ventas)));

    data.forEach(item => {
      // USAR COORDENADAS DE LA BD
      const lat = parseFloat(item.latitude);
      const lon = parseFloat(item.longitude);

      if (!lat || !lon) return; // Skip si no tiene coords

      const ventas = parseFloat(item.total_ventas);
      const intensity = Math.min(ventas / maxVentas, 1);
      const hue = intensity * 120;
      const color = `hsl(${hue}, 100%, 50%)`;
      const radius = 8 + intensity * 25;

      const topProductosHTML = item.top_productos
        .slice(0, 5)
        .map((prod) => `
          <div style="padding: 5px 0; border-bottom: 1px solid #eee;">
            <strong>#${prod.ranking}</strong> ${prod.item_desc}
            <br/><small>📦 ${prod.cantidad} unidades | $${parseFloat(prod.ventas).toFixed(2)}</small>
          </div>
        `)
        .join('');

      const popupContent = `
        <div style="font-family: Arial; font-size: 12px; width: 300px;">
          <h3 style="margin: 0 0 10px 0; color: #2c3e50;">${item.municipio}</h3>
          <strong>CP: ${item.codigo_postal}</strong><br/>
          💰 Ventas: <strong>$${ventas.toFixed(2)}</strong><br/>
          📦 Unidades: ${item.total_unidades}<br/>
          📊 Registros: ${item.registros}<br/>
          <hr style="margin: 10px 0;"/>
          <strong>🏆 TOP 5 PRODUCTOS:</strong>
          ${topProductosHTML}
        </div>
      `;

      L.circleMarker([lat, lon], {
        radius: radius,
        fillColor: color,
        color: '#333',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
      })
        .bindPopup(popupContent)
        .addTo(mapInstance.current);
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [data]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: '5px' }} />;
}