export default async function handler(req, res) {
  try {
    const { Client } = require('pg');
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    const estadosResult = await client.query(`
      SELECT DISTINCT estado
      FROM ventas_particulares
      WHERE estado IS NOT NULL
      ORDER BY estado ASC
    `);

    const cpsResult = await client.query(`
      SELECT DISTINCT estado, codigo_postal
      FROM ventas_particulares
      WHERE estado IS NOT NULL
      ORDER BY estado ASC, codigo_postal ASC
    `);

    await client.end();

    res.status(200).json({
      status: 'ok',
      estados: estadosResult.rows,
      cps_por_estado: cpsResult.rows
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
}