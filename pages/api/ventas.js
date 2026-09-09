export default async function handler(req, res) {
  try {
    const { Client } = require('pg');
    
    // Configuración corregida con SSL obligatorio para Supabase
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false 
      }
    });
    
    await client.connect();
    
const result = await client.query(`
  SELECT 
    codigo_postal,
    municipio,
    SUM(pos_qty)::int as total_unidades,
    SUM(pos_sales)::float as total_ventas,
    COUNT(*) as registros,
    (SELECT p.item_desc 
     FROM ventas v2 
     JOIN productos p ON v2.product_id = p.id 
     WHERE v2.store_id = v.store_id 
     GROUP BY p.item_desc 
     ORDER BY SUM(v2.pos_qty) DESC 
     LIMIT 1) as producto_top
  FROM ventas v
  JOIN tiendas t ON v.store_id = t.store_id
  GROUP BY codigo_postal, municipio, v.store_id
  ORDER BY total_ventas DESC
`);
    
    await client.end();
    res.status(200).json({ status: "ok", data: result.rows, count: result.rows.length });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
}