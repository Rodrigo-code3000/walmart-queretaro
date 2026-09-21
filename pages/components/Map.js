import { useEffect, useRef } from 'react';

export default function MapComponent({ data, selectedCp, capa }) {
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

    const fmt = (n) => '$' + Number(n).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    const getVentas = (item) => capa === 'walmart'
      ? parseFloat(item.total_ventas || 0)
      : parseFloat(item.ventas || 0);

    const usedCoords = {};

    data.forEach(item => {
      let lat = parseFloat(item.latitude || item.latitud);
      let lon = parseFloat(item.longitude || item.longitud);

      if (!lat || !lon) return;

      const key = `${lat.toFixed(3)},${lon.toFixed(3)}`;
      if (usedCoords[key]) {
        lat += (Math.random() - 0.5) * 0.05;
        lon += (Math.random() - 0.5) * 0.05;
      }
      usedCoords[key] = true;

      const ventas = getVentas(item);

      // COLORES POR RANGOS APROBADOS
      let color;
      let intensity;

      if (capa === 'walmart') {
        if (ventas >= 100000) {
          color = '#27ae60'; // Verde
          intensity = 1;
        } else if (ventas >= 10000) {
          color = '#f39c12'; // Naranja
          intensity = 0.6;
        } else {
          color = '#e74c3c'; // Rojo
          intensity = 0.3;
        }
      } else {
        if (ventas >= 30000) {
          color = '#27ae60'; // Verde
          intensity = 1;
        } else if (ventas >= 5000) {
          color = '#f39c12'; // Naranja
          intensity = 0.6;
        } else {
          color = '#e74c3c'; // Rojo
          intensity = 0.3;
        }
      }

      const radius = 8 + intensity * 25;

      let popupContent;

      if (capa === 'walmart') {
        const topProductosHTML = (item.top_productos || [])
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

        popupContent = `
          <div style="font-family: 'Inter', -apple-system, sans-serif; font-size: 13px; width: 300px; padding: 4px;">
            <div style="font-size:16px; font-weight:700; color:#111827; margin-bottom:2px;">${item.municipio}</div>
            <div style="font-size:12px; color:#6B7280; margin-bottom:12px;">CP ${item.codigo_postal} · ${item.estado}</div>
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-bottom:12px;">
              <div>
                <div style="font-size:10px; color:#9CA3AF; font-weight:600; text-transform:uppercase;">Ventas</div>
                <div style="font-size:15px; font-weight:700; color:#059669;">${fmt(ventas)}</div>
              </div>
              <div>
                <div style="font-size:10px; color:#9CA3AF; font-weight:600; text-transform:uppercase;">Unidades</div>
                <div style="font-size:15px; font-weight:700; color:#3B82F6;">${item.total_unidades}</div>
              </div>
              <div>
                <div style="font-size:10px; color:#9CA3AF; font-weight:600; text-transform:uppercase;">Registros</div>
                <div style="font-size:15px; font-weight:700; color:#F59E0B;">${item.registros}</div>
              </div>
            </div>
            <div style="font-size:10px; color:#9CA3AF; font-weight:600; text-transform:uppercase; margin-bottom:6px;">Top 5 productos</div>
            ${topProductosHTML}
          </div>
        `;
      } else {
        const topParticularesHTML = (item.top_productos || [])
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

        popupContent = `
          <div style="font-family: 'Inter', -apple-system, sans-serif; font-size: 13px; width: 300px; padding: 4px;">
            <div style="font-size:16px; font-weight:700; color:#111827; margin-bottom:2px;">${item.municipio}</div>
            <div style="font-size:12px; color:#6B7280; margin-bottom:12px;">CP ${item.codigo_postal} · ${item.estado}</div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px;">
              <div>
                <div style="font-size:10px; color:#9CA3AF; font-weight:600; text-transform:uppercase;">Ventas</div>
                <div style="font-size:15px; font-weight:700; color:#059669;">${fmt(ventas)}</div>
              </div>
              <div>
                <div style="font-size:10px; color:#9CA3AF; font-weight:600; text-transform:uppercase;">Unidades</div>
                <div style="font-size:15px; font-weight:700; color:#3B82F6;">${item.unidades}</div>
              </div>
            </div>
            <div style="font-size:10px; color:#9CA3AF; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">Top 5 productos</div>
            ${topParticularesHTML.length > 0 ? topParticularesHTML : '<div style="color:#9CA3AF; font-size:12px;">Sin productos registrados</div>'}
          </div>
        `;
      }

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

    // LEYENDA DE PARÁMETROS
    const leyenda = L.control({ position: 'bottomright' });
    leyenda.onAdd = () => {
      const div = L.DomUtil.create('div');
      const rangos = capa === 'walmart'
        ? [
            { color: '#27ae60', label: 'Más de $100,000' },
            { color: '#f39c12', label: '$10,000 — $100,000' },
            { color: '#e74c3c', label: 'Menos de $10,000' },
          ]
        : [
            { color: '#27ae60', label: 'Más de $30,000' },
            { color: '#f39c12', label: '$5,000 — $30,000' },
            { color: '#e74c3c', label: 'Menos de $5,000' },
          ];

      div.innerHTML = `
        <div style="
          background: white;
          padding: 14px 16px;
          border-radius: 10px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.12);
          font-family: 'Inter', -apple-system, sans-serif;
          min-width: 180px;
          border: 1px solid #E5E7EB;
        ">
          <div style="font-weight:700; color:#111827; margin-bottom:10px; font-size:11px; text-transform:uppercase; letter-spacing:0.6px;">
            Ventas por CP
          </div>
          ${rangos.map(r => `
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
              <div style="
                width:14px; height:14px;
                border-radius:50%;
                background:${r.color};
                flex-shrink:0;
                box-shadow: 0 1px 3px rgba(0,0,0,0.2);
              "></div>
              <span style="color:#374151; font-size:12px;">${r.label}</span>
            </div>
          `).join('')}
          <div style="margin-top:10px; padding-top:8px; border-top:1px solid #F3F4F6; font-size:10px; color:#9CA3AF;">
            ${capa === 'walmart' ? 'Canal Walmart' : 'Clientes Particulares'}
          </div>
        </div>
      `;
      return div;
    };
    leyenda.addTo(mapInstance.current);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [data, capa]);

  useEffect(() => {
    if (!mapInstance.current || !selectedCp) return;
    const lat = parseFloat(selectedCp.latitude || selectedCp.latitud);
    const lon = parseFloat(selectedCp.longitude || selectedCp.longitud);
    if (!lat || !lon) return;
    mapInstance.current.flyTo([lat, lon], 12, { duration: 1.2 });
  }, [selectedCp]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: '5px' }} />;
}