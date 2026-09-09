export default async function handler(req, res) {
  try {
    const { Client } = require('pg');
    
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    await client.connect();
    
    // Obtener estados
    const estadosResult = await client.query(`
      SELECT DISTINCT estado
      FROM tiendas
      WHERE activo = true
      ORDER BY estado ASC
    `);
    
    // Obtener CPs por estado
    const cpsResult = await client.query(`
      SELECT DISTINCT estado, codigo_postal
      FROM tiendas
      WHERE activo = true
      ORDER BY estado ASC, codigo_postal ASC
    `);
    
    await client.end();
    
    res.status(200).json({
      status: "ok",
      estados: estadosResult.rows,
      cps_por_estado: cpsResult.rows
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
}