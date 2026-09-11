import { IncomingForm } from 'formidable';
import * as XLSX from 'xlsx';
import { Client } from 'pg';
import fs from 'fs';

export const config = {
  api: { bodyParser: false },
};

function detectarSemana(filename, workbook) {
  const matchNombre = filename.match(/[Ss]emana[_\s](\d+)/);
  if (matchNombre) {
    const semana = parseInt(matchNombre[1]);
    const matchAno = filename.match(/(\d{4})/);
    const año = matchAno ? parseInt(matchAno[1]) : new Date().getFullYear();
    return { semana, año };
  }
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  for (let i = 0; i < Math.min(5, raw.length); i++) {
    const row = raw[i].join(' ');
    const match = row.match(/[Ss]emana\s*(\d+)/);
    if (match) {
      const semana = parseInt(match[1]);
      const matchAno = row.match(/(\d{4})/);
      const año = matchAno ? parseInt(matchAno[1]) : new Date().getFullYear();
      return { semana, año };
    }
  }
  return null;
}

function encontrarEncabezados(workbook) {
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  for (let i = 0; i < Math.min(30, raw.length); i++) {
    const row = raw[i].map(v => String(v).trim());
    if (row.includes('Store Nbr') && row.includes('POS Qty') && row.includes('POS Sales')) {
      return i;
    }
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Método no permitido' });
  }

  const form = new IncomingForm({ uploadDir: '/tmp', keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ status: 'error', message: 'Error al leer el archivo' });
    }

    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!uploadedFile) {
      return res.status(400).json({ status: 'error', message: 'No se recibió ningún archivo' });
    }

    const filepath = uploadedFile.filepath;
    const filename = uploadedFile.originalFilename || '';

    try {
      const workbook = XLSX.readFile(filepath);

      const semanaInfo = detectarSemana(filename, workbook);
      if (!semanaInfo) {
        return res.status(400).json({ status: 'error', message: 'No se pudo detectar la semana. El nombre debe incluir "Semana_XX".' });
      }
      const { semana, año } = semanaInfo;

      const headerRow = encontrarEncabezados(workbook);
      if (headerRow === null) {
        return res.status(400).json({ status: 'error', message: 'No se encontraron columnas Store Nbr, POS Qty, POS Sales.' });
      }

      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { range: headerRow, defval: null });
      const ventasRows = rows.filter(r => r['Store Nbr'] && r['POS Qty'] > 0 && r['Item Nbr']);

      if (ventasRows.length === 0) {
        return res.status(400).json({ status: 'error', message: 'No se encontraron ventas con POS Qty > 0.' });
      }

      const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      await client.connect();

      // Verificar si semana ya existe
      const existing = await client.query(
        'SELECT COUNT(*) as total FROM ventas WHERE semana = $1 AND año = $2',
        [semana, año]
      );
      if (parseInt(existing.rows[0].total) > 0) {
        await client.end();
        return res.status(400).json({
          status: 'error',
          message: `La semana ${semana}/${año} ya está cargada con ${existing.rows[0].total} registros. No se insertó nada.`
        });
      }

      // Cargar tiendas y productos existentes
      const tiendasResult = await client.query('SELECT store_id, store_nbr FROM tiendas WHERE activo = true');
      const tiendasMap = {};
      tiendasResult.rows.forEach(t => { tiendasMap[t.store_nbr] = t.store_id; });

      const productosResult = await client.query('SELECT product_id, item_nbr FROM productos');
      const productosMap = {};
      productosResult.rows.forEach(p => { productosMap[p.item_nbr] = p.product_id; });

      const fecha = `${año}-01-01`;
      let ventasInsertadas = 0;
      let productosNuevos = 0;

      for (const row of ventasRows) {
        const storeNbr = parseInt(row['Store Nbr']);
        const itemNbr = parseInt(row['Item Nbr']);
        const posQty = parseFloat(row['POS Qty']) || 0;
        const posSales = parseFloat(row['POS Sales']) || 0;

        const storeId = tiendasMap[storeNbr];
        if (!storeId) continue;

        let productId = productosMap[itemNbr];
        if (!productId) {
          const itemDesc = String(row['Item Desc 1'] || row['Item Desc'] || 'SIN DESCRIPCION').substring(0, 100);
          const deptDesc = String(row['Dept Desc'] || 'GENERAL').substring(0, 100);
          const finelineDesc = String(row['Fineline Desc'] || '').substring(0, 100);
          const unitCost = parseFloat(row['Unit Cost']) || 0;
          const unitRetail = parseFloat(row['Unit Retail']) || 0;

          const newProd = await client.query(
            `INSERT INTO productos (item_nbr, item_desc, dept_desc, fineline_desc, unit_cost, unit_retail)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (item_nbr) DO NOTHING
             RETURNING product_id`,
            [itemNbr, itemDesc, deptDesc, finelineDesc, unitCost, unitRetail]
          );

          if (newProd.rows.length > 0) {
            productId = newProd.rows[0].product_id;
            productosNuevos++;
          } else {
            const found = await client.query('SELECT product_id FROM productos WHERE item_nbr = $1', [itemNbr]);
            if (found.rows.length > 0) productId = found.rows[0].product_id;
          }
          if (productId) productosMap[itemNbr] = productId;
        }

        if (!productId) continue;

        await client.query(
          `INSERT INTO ventas (store_id, product_id, fecha, semana, año, pos_qty, pos_sales)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [storeId, productId, fecha, semana, año, posQty, posSales]
        );
        ventasInsertadas++;
      }

      await client.end();
      try { fs.unlinkSync(filepath); } catch (e) {}

      return res.status(200).json({
        status: 'ok',
        semana,
        año,
        tiendas_encontradas: Object.keys(tiendasMap).length,
        ventas_insertadas: ventasInsertadas,
        productos_nuevos: productosNuevos,
        mensaje: `Semana ${semana}/${año} cargada exitosamente`
      });

    } catch (error) {
      console.error('Upload error:', error);
      try { fs.unlinkSync(filepath); } catch (e) {}
      return res.status(500).json({ status: 'error', message: error.message });
    }
  });
}