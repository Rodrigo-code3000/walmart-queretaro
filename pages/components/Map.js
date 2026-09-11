import { useEffect, useRef } from 'react';

export default function MapComponent({ data, selectedCp }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  // Renderizar mapa cuando cambian los datos
  useEffect(() => {
    if (!mapRef.current || !data || data.length === 0) return;

    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    const L = require('leaflet');
    require('leaflet/dist/leaflet.css');

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
    const usedCoords = {};

    data.forEach(item => {
      let lat = parseFloat(item.latitude);
      let lon = parseFloat(item.longitude);

      if (!lat || !lon) return;

      const key = `${lat.toFixed(3)},${lon.toFixed(3)}`;
      if (usedCoords[key]) {
        lat += (Math.random() - 0.5) * 0.05;
        lon += (Math.random() - 0.5) * 0.05;
      }
      usedCoords[key] = true;

      const ventas = parseFloat(item.total_ventas);
      const intensity = Math.min(ventas / maxVentas, 1);

      let color;
      if (intensity >= 0.66) {
        color = '#27ae60';
      } else if (intensity >= 0.33) {
        color = '#f39c12';
      } else {
        color = '#e74c3c';
      }

      const radius = 8 + intensity * 25;

      const fmt = (n) => '$' + Number(n).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

      const topProductosHTML = item.top_productos
        .slice(0, 5)
        .map((prod) => `
          <div style="padding: 6px 0; border-bottom: 1px solid #f0f0f0;">
            <span style="font-weight:700; color:#3B82F6;">#${prod.ranking}</span>
            <span style="margin-left:6px; color:#374151;">${prod.item_desc}</span>
            <div style="margin-top:2px; color:#9CA3AF; font-size:11px;">
              ${prod.cantidad} unidades · ${fmt(parseFloat(prod.ventas))}
            </div>
          </div>
        `)
        .join('');

      const popupContent = `
        <div style="font-family: 'Inter', -apple-system, sans-serif; font-size: 13px; width: 300px; padding: 4px;">
          <div style="font-size:16px; font-weight:700; color:#111827; margin-bottom:2px;">${item.municipio}</div>
          <div style="font-size:12px; color:#6B7280; margin-bottom:12px;">CP ${item.codigo_postal} · ${item.estado}</div>
          <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-bottom:12px;">
            <div>
              <div style="font-size:10px; color:#9CA3AF; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Ventas</div>
              <div style="font-size:15px; font-weight:700; color:#059669;">${fmt(ventas)}</div>
            </div>
            <div>
              <div style="font-size:10px; color:#9CA3AF; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Unidades</div>
              <div style="font-size:15px; font-weight:700; color:#3B82F6;">${item.total_unidades}</div>
            </div>
            <div>
              <div style="font-size:10px; color:#9CA3AF; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Registros</div>
              <div style="font-size:15px; font-weight:700; color:#F59E0B;">${item.registros}</div>
            </div>
          </div>
          <div style="font-size:10px; color:#9CA3AF; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">Top 5 productos</div>
          ${topProductosHTML}
        </div>
      `;

      L.circleMarker([lat, lon], {
        radius: radius,
        fillColor: color,
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.85,
      })
        .bindPopup(popupContent, { maxWidth: 320 })
        .addTo(mapInstance.current);
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [data]);

  // Volar al CP seleccionado desde la tabla
  useEffect(() => {
    if (!mapInstance.current || !selectedCp) return;
    const lat = parseFloat(selectedCp.latitude);
    const lon = parseFloat(selectedCp.longitude);
    if (!lat || !lon) return;
    mapInstance.current.flyTo([lat, lon], 12, { duration: 1.2 });
  }, [selectedCp]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: '5px' }} />;
}