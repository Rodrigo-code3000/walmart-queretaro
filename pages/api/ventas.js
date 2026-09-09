export default async function handler(req, res) {
  try {
    const { Client } = require('pg');
    
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    await client.connect();
    
    const result = await client.query(`
      SELECT 
        t.codigo_postal,
        t.municipio,
        SUM(v.pos_qty)::int as total_unidades,
        SUM(v.pos_sales)::float as total_ventas,
        COUNT(*)::int as registros,
        (
          SELECT p.item_desc
          FROM ventas v2
          JOIN productos p ON v2.product_id = p.product_id
          JOIN tiendas t2 ON v2.store_id = t2.store_id
          WHERE t2.codigo_postal = t.codigo_postal
          GROUP BY p.item_desc
          ORDER BY SUM(v2.pos_qty) DESC
          LIMIT 1
        ) as producto_top
      FROM ventas v
      JOIN tiendas t ON v.store_id = t.store_id
      GROUP BY t.codigo_postal, t.municipio
      ORDER BY total_ventas DESC
    `);
    
    await client.end();
    res.status(200).json({ status: "ok", data: result.rows, count: result.rows.length });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
}