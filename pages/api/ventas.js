export default async function handler(req, res) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    const response = await fetch(
      `${supabaseUrl}/rest/v1/vw_ventas_por_cp`,
      {
        headers: {
          apikey: supabaseKey,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Supabase error: ${response.status}`);
    }

    const data = await response.json();

    res.status(200).json({
      status: "ok",
      data: data,
      count: data.length
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      status: "error", 
      message: error.message 
    });
  }
}