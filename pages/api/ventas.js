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
        t.codigo_postal,
        t.municipio,
        SUM(v.pos_qty)::int as total_unidades,
        SUM(v.pos_sales)::float as total_ventas,
        COUNT(*)::int as registros
      FROM ventas v
      JOIN tiendas t ON v.store_id = t.store_id
      GROUP BY t.codigo_postal, t.municipio
      ORDER BY total_ventas DESC
    `);
    
    // Top 5 productos (simple, sin ROW_NUMBER)
    const productosResult = await client.query(`
      SELECT 
        t.codigo_postal,
        p.item_desc,
        SUM(v.pos_qty)::int as cantidad,
        SUM(v.pos_sales)::float as ventas
      FROM ventas v
      JOIN productos p ON v.product_id = p.product_id
      JOIN tiendas t ON v.store_id = t.store_id
      GROUP BY t.codigo_postal, p.item_desc
      ORDER BY t.codigo_postal, SUM(v.pos_qty) DESC
    `);
    
    await client.end();
    
    // Agrupar TOP 5 por CP
    const productosPorCP = {};
    productosResult.rows.forEach(row => {
      if (!productosPorCP[row.codigo_postal]) {
        productosPorCP[row.codigo_postal] = [];
      }
      if (productosPorCP[row.codigo_postal].length < 5) {
        productosPorCP[row.codigo_postal].push({
          ranking: productosPorCP[row.codigo_postal].length + 1,
          item_desc: row.item_desc,
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
    
    res.status(200).json({ status: "ok", data: data });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ status: "error", message: error.message });
  }
}