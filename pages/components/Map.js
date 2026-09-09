import { useEffect, useRef } from 'react';

export default function MapComponent({ data }) {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || !data || data.length === 0) return;

    const L = require('leaflet');
    require('leaflet/dist/leaflet.css');

    const map = L.map(mapRef.current).setView([20.59, -100.39], 9);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    const coordsMap = {
      '76116': [20.58, -100.41],
      '76130': [20.60, -100.40],
      '76146': [20.63, -100.38],
      '76160': [20.57, -100.42],
      '76180': [20.55, -100.39],
      '76118': [20.59, -100.40],
      '76803': [20.73, -99.99],
      '76147': [20.64, -100.37],
      '76190': [20.56, -100.43],
      '76135': [20.61, -100.39],
      '76110': [20.59, -100.38],
      '76138': [20.60, -100.42],
      '76246': [20.50, -100.35],
      '76750': [20.76, -99.70],
      '76500': [21.00, -99.62],
      '76220': [20.68, -100.15],
    };

    const maxVentas = Math.max(...data.map(d => parseFloat(d.total_ventas)));

    data.forEach(item => {
      const coords = coordsMap[item.codigo_postal] || [20.59, -100.39];
      const ventas = parseFloat(item.total_ventas);
      const intensity = Math.min(ventas / maxVentas, 1);
      
      const hue = intensity * 120;
      const color = `hsl(${hue}, 100%, 50%)`;
      const radius = 8 + intensity * 25;

      // Generar popup con TOP 5
      const topProductosHTML = item.top_productos
        .slice(0, 5)
        .map((prod, i) => `
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

      L.circleMarker(coords, {
        radius: radius,
        fillColor: color,
        color: '#333',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
      })
        .bindPopup(popupContent)
        .addTo(map);
    });
  }, [data]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: '5px' }} />;
}