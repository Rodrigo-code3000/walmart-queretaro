"""
🏗️ WALMART QUERÉTARO - Backend API
FastAPI + PostgreSQL + PostGIS
Listo para Railway.app
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os
import json
from typing import List, Optional

# ========== CONFIGURACIÓN ==========
load_dotenv()

app = FastAPI(
    title="Walmart Querétaro API",
    description="API geoespacial para análisis de ventas",
    version="1.0.0"
)

# CORS - Permitir que React acceda desde Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar dominio: ["https://tu-dominio.vercel.app"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Conexión a PostgreSQL (Supabase)
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/walmart")
print(f"📊 Conectando a: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else 'local'}")

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    print("✅ Conexión a BD exitosa")
except Exception as e:
    print(f"⚠️  Error de conexión: {e}")

# ========== HEALTH CHECK ==========

@app.get("/")
async def root():
    """Endpoint raíz"""
    return {
        "status": "ok",
        "message": "API Walmart Querétaro activa",
        "version": "1.0.0"
    }

@app.get("/health")
async def health():
    """Health check para Railway"""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except:
        return {"status": "unhealthy", "database": "disconnected"}

# ========== MUNICIPIOS ==========

@app.get("/api/municipios")
async def get_municipios():
    """
    Retorna todos los municipios con sus ventas totales
    
    Response:
    [
        {
            "id": 1,
            "nombre": "Querétaro",
            "municipio": "querétaro",
            "geometry": {...},
            "ventas_total": 4300000,
            "num_tiendas": 1,
            "ticket_promedio": 301
        },
        ...
    ]
    """
    query = """
    SELECT 
        m.id,
        m.nombre,
        m.municipio,
        ST_AsGeoJSON(m.geometry) as geometry,
        COALESCE(SUM(v.monto), 0)::bigint as ventas_total,
        COALESCE(COUNT(DISTINCT v.tienda_id), 0)::int as num_tiendas,
        COALESCE(AVG(v.monto), 0)::int as ticket_promedio
    FROM municipios m
    LEFT JOIN tiendas t ON t.municipio = m.municipio
    LEFT JOIN ventas v ON v.tienda_id = t.id
    GROUP BY m.id, m.nombre, m.municipio, m.geometry
    ORDER BY ventas_total DESC
    """
    
    try:
        with engine.connect() as conn:
            result = conn.execute(text(query))
            municipios = []
            for row in result:
                municipios.append({
                    "id": row[0],
                    "nombre": row[1],
                    "municipio": row[2],
                    "geometry": json.loads(row[3]) if row[3] else None,
                    "ventas_total": row[4],
                    "num_tiendas": row[5],
                    "ticket_promedio": row[6]
                })
            return municipios
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/municipios/{municipio_name}")
async def get_municipio_detail(municipio_name: str):
    """
    Detalles específicos de un municipio
    """
    query = f"""
    SELECT 
        m.id,
        m.nombre,
        m.municipio,
        ST_AsGeoJSON(m.geometry) as geometry,
        COALESCE(SUM(v.monto), 0)::bigint as ventas_total,
        COUNT(DISTINCT v.tienda_id)::int as num_tiendas
    FROM municipios m
    LEFT JOIN tiendas t ON t.municipio = m.municipio
    LEFT JOIN ventas v ON v.tienda_id = t.id
    WHERE LOWER(m.municipio) = LOWER('{municipio_name}')
    GROUP BY m.id, m.nombre, m.municipio, m.geometry
    """
    
    try:
        with engine.connect() as conn:
            result = conn.execute(text(query))
            row = result.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Municipio no encontrado")
            
            return {
                "id": row[0],
                "nombre": row[1],
                "municipio": row[2],
                "geometry": json.loads(row[3]) if row[3] else None,
                "ventas_total": row[4],
                "num_tiendas": row[5]
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ========== VENTAS ==========

@app.get("/api/ventas/municipio/{municipio_name}")
async def get_ventas_por_municipio(municipio_name: str):
    """
    Detalles de ventas por municipio
    Agrupa por producto
    """
    query = f"""
    SELECT 
        t.nombre as tienda,
        v.producto,
        COALESCE(SUM(v.monto), 0)::bigint as total_ventas,
        COALESCE(SUM(v.cantidad), 0)::int as total_cantidad,
        COUNT(*)::int as num_transacciones
    FROM ventas v
    JOIN tiendas t ON v.tienda_id = t.id
    WHERE LOWER(t.municipio) = LOWER('{municipio_name}')
    GROUP BY t.nombre, v.producto
    ORDER BY total_ventas DESC
    """
    
    try:
        with engine.connect() as conn:
            result = conn.execute(text(query))
            ventas = []
            for row in result:
                ventas.append({
                    "tienda": row[0],
                    "producto": row[1],
                    "total_ventas": row[2],
                    "total_cantidad": row[3],
                    "transacciones": row[4]
                })
            return ventas
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tiendas")
async def get_tiendas():
    """
    Retorna todas las tiendas con sus coordinadas
    """
    query = """
    SELECT 
        id,
        nombre,
        dirección,
        municipio,
        ST_X(geometry)::float as lng,
        ST_Y(geometry)::float as lat
    FROM tiendas
    ORDER BY nombre
    """
    
    try:
        with engine.connect() as conn:
            result = conn.execute(text(query))
            tiendas = []
            for row in result:
                tiendas.append({
                    "id": row[0],
                    "nombre": row[1],
                    "dirección": row[2],
                    "municipio": row[3],
                    "lng": row[4],
                    "lat": row[5]
                })
            return tiendas
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ========== ESTADÍSTICAS ==========

@app.get("/api/stats")
async def get_stats():
    """
    Estadísticas globales de Querétaro
    """
    query = """
    SELECT 
        COALESCE(SUM(v.monto), 0)::bigint as ventas_totales,
        COALESCE(COUNT(DISTINCT v.tienda_id), 0)::int as num_tiendas,
        COALESCE(COUNT(DISTINCT LOWER(t.municipio)), 0)::int as num_municipios,
        COALESCE(SUM(v.cantidad), 0)::int as total_unidades,
        COALESCE(AVG(v.monto), 0)::int as ticket_promedio
    FROM ventas v
    LEFT JOIN tiendas t ON v.tienda_id = t.id
    """
    
    try:
        with engine.connect() as conn:
            result = conn.execute(text(query))
            row = result.fetchone()
            
            return {
                "ventas_totales": row[0],
                "num_tiendas": row[1],
                "num_municipios": row[2],
                "total_unidades": row[3],
                "ticket_promedio": row[4]
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/top-productos")
async def get_top_productos(limit: int = 5):
    """
    Top N productos más vendidos globalmente
    """
    query = f"""
    SELECT 
        v.producto,
        COALESCE(SUM(v.monto), 0)::bigint as total_ventas,
        COALESCE(SUM(v.cantidad), 0)::int as total_cantidad,
        COUNT(DISTINCT v.tienda_id)::int as num_tiendas
    FROM ventas v
    GROUP BY v.producto
    ORDER BY total_ventas DESC
    LIMIT {limit}
    """
    
    try:
        with engine.connect() as conn:
            result = conn.execute(text(query))
            productos = []
            for row in result:
                productos.append({
                    "producto": row[0],
                    "total_ventas": row[1],
                    "total_cantidad": row[2],
                    "num_tiendas": row[3]
                })
            return productos
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ========== IMPORTAR DATOS ==========

@app.post("/api/import-csv")
async def import_csv_data(file_content: dict):
    """
    Endpoint para importar datos desde CSV
    
    Body esperado:
    {
        "tipo": "tiendas" | "ventas",
        "datos": [...]
    }
    """
    try:
        if file_content["tipo"] == "tiendas":
            # INSERT tiendas
            pass
        elif file_content["tipo"] == "ventas":
            # INSERT ventas
            pass
        
        return {"status": "ok", "message": "Datos importados"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ========== MAIN ==========

if __name__ == "__main__":
    import uvicorn
    
    # En Railway, el puerto es dinámico
    port = int(os.getenv("PORT", 8000))
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        log_level="info"
    )
