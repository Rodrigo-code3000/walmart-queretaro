export default async function handler(req, res) {
  try {
    const { Client } = require('pg');
    
    // DATABASE_URL codificada correctamente
    const connectionString = process.env.DATABASE_URL;
    
   const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
    
    await client.connect();
    
    const result = await client.query(`
      SELECT 
        codigo_postal,
        municipio,
        SUM(pos_qty)::int as total_unidades,
        SUM(pos_sales)::float as total_ventas,
        COUNT(*) as registros
      FROM ventas v
      JOIN tiendas t ON v.store_id = t.id
      GROUP BY codigo_postal, municipio
      ORDER BY total_ventas DESC
    `);
    
    await client.end();
    
    res.status(200).json({
      status: "ok",
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('DB Error:', error);
    res.status(500).json({ 
      status: "error", 
      message: error.message 
    });
  }
}