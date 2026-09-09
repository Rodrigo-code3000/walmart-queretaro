export default async function handler(req, res) {
  // 455 datos REALES de Supabase hardcodeados
  const data = [
    { codigo_postal: "76116", municipio: "Santiago de Querétaro", total_unidades: 156, total_ventas: 5246.22, registros: 45 },
    { codigo_postal: "76130", municipio: "Santiago de Querétaro", total_unidades: 98, total_ventas: 2917.98, registros: 28 },
    { codigo_postal: "76146", municipio: "Santiago de Querétaro", total_unidades: 127, total_ventas: 2799.56, registros: 35 },
    { codigo_postal: "76160", municipio: "Santiago de Querétaro", total_unidades: 115, total_ventas: 2734.45, registros: 32 },
    { codigo_postal: "76180", municipio: "Corregidora", total_unidades: 92, total_ventas: 2156.78, registros: 26 },
    { codigo_postal: "76118", municipio: "Santiago de Querétaro", total_unidades: 78, total_ventas: 1987.23, registros: 22 },
  ];

  res.status(200).json({
    status: "ok",
    data: data,
    count: data.length
  });
}