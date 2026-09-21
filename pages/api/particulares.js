export default async function handler(req, res) {
  try {
    const { Client } = require('pg');
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    // Resumen por CP
    const resumenResult = await client.query(`
      SELECT 
        codigo_postal,
        estado,
        municipio,
        AVG(latitud)::float as latitude,
        AVG(longitud)::float as longitude,
        SUM(ventas)::float as ventas,
        SUM(unidades)::int as unidades,
        COUNT(*)::int as registros
      FROM ventas_particulares
      GROUP BY codigo_postal, estado, municipio
      ORDER BY ventas DESC
    `);

    // Top 5 productos por CP
    const productosResult = await client.query(`
      SELECT 
        codigo_postal,
        codigo,
        descripcion,
        SUM(unidades)::int as cantidad,
        SUM(ventas)::float as ventas
      FROM ventas_particulares
      GROUP BY codigo_postal, codigo, descripcion
      ORDER BY codigo_postal, SUM(ventas) DESC
    `);

    await client.end();

    // Agrupar TOP 5 por CP
    const productosPorCP = {};
    productosResult.rows.forEach(row => {
      const key = row.codigo_postal;
      if (!productosPorCP[key]) productosPorCP[key] = [];
      if (productosPorCP[key].length < 5) {
        productosPorCP[key].push({
          ranking: productosPorCP[key].length + 1,
          codigo: row.codigo,
          item_desc: row.descripcion,
          cantidad: row.cantidad,
          ventas: row.ventas
        });
      }
    });

    // Combinar
    const data = resumenResult.rows.map(row => ({
      ...row,
      top_productos: productosPorCP[row.codigo_postal] || []
    }));

    res.status(200).json({ status: 'ok', data: data });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
}