export default async function handler(req, res) {
  try {
    const { Client } = require('pg');
    
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    await client.connect();
    
    // Traer CP con resumen
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
    
    // Traer TOP 5 productos por CP
    const productosResult = await client.query(`
      SELECT 
        t.codigo_postal,
        p.item_desc,
        SUM(v.pos_qty)::int as cantidad,
        SUM(v.pos_sales)::float as ventas,
        ROW_NUMBER() OVER (PARTITION BY t.codigo_postal ORDER BY SUM(v.pos_qty) DESC) as ranking
      FROM ventas v
      JOIN productos p ON v.product_id = p.product_id
      JOIN tiendas t ON v.store_id = t.store_id
      GROUP BY t.codigo_postal, p.item_desc
      HAVING ROW_NUMBER() OVER (PARTITION BY t.codigo_postal ORDER BY SUM(v.pos_qty) DESC) <= 5
    `);
    
    await client.end();
    
    // Agrupar productos por CP
    const productosPorCP = {};
    productosResult.rows.forEach(row => {
      if (!productosPorCP[row.codigo_postal]) {
        productosPorCP[row.codigo_postal] = [];
      }
      productosPorCP[row.codigo_postal].push({
        ranking: row.ranking,
        item_desc: row.item_desc,
        cantidad: row.cantidad,
        ventas: row.ventas
      });
    });
    
    // Combinar
    const data = resumenResult.rows.map(row => ({
      ...row,
      top_productos: productosPorCP[row.codigo_postal] || []
    }));
    
    res.status(200).json({ status: "ok", data: data });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
}