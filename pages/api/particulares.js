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

    await client.end();
    res.status(200).json({ status: 'ok', data: result.rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
}