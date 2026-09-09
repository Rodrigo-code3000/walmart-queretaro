from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
import logging

# Configuración
load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(title="Walmart Querétaro", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# BD
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL no está configurada")

engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(bind=engine)

# Root
@app.get("/")
def read_root():
    return {
        "status": "ok",
        "message": "API Walmart Querétaro activa",
        "version": "1.0.0"
    }

# Ventas por código postal
@app.get("/venta/por-cp")
def ventas_por_cp():
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT 
                    codigo_postal,
                    SUM(pos_qty)::int as total_unidades,
                    SUM(pos_sales)::numeric as total_ventas,
                    COUNT(*) as num_registros
                FROM ventas v
                JOIN tiendas t ON v.store_id = t.id
                GROUP BY codigo_postal
                ORDER BY total_ventas DESC
            """))
            data = [dict(row._mapping) for row in result]
            return {
                "status": "ok",
                "data": data,
                "count": len(data)
            }
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return {"status": "error", "message": str(e)}

# Dashboard summary
@app.get("/dashboard/summary")
def dashboard_summary():
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT 
                    COUNT(DISTINCT store_id) as num_tiendas,
                    COUNT(*) as num_registros,
                    SUM(pos_qty)::int as total_unidades,
                    SUM(pos_sales)::numeric as total_ventas,
                    ROUND(SUM(pos_sales) / NULLIF(SUM(pos_qty), 0), 2)::numeric as ticket_promedio,
                    COUNT(DISTINCT fecha) as dias_datos
                FROM ventas
            """))
            row = result.fetchone()
            data = dict(row._mapping) if row else {}
            return {
                "status": "ok",
                "data": data
            }
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return {"status": "error", "message": str(e)}

# Tiendas
@app.get("/tiendas")
def get_tiendas():
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT id, store_nbr, store_name, formato, municipio, codigo_postal
                FROM tiendas
                ORDER BY store_name
            """))
            data = [dict(row._mapping) for row in result]
            return {
                "status": "ok",
                "data": data,
                "count": len(data)
            }
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return {"status": "error", "message": str(e)}

# Productos
@app.get("/productos")
def get_productos():
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT id, item_nbr, item_desc, dept_desc, unit_cost, unit_retail
                FROM productos
                ORDER BY item_desc
                LIMIT 50
            """))
            data = [dict(row._mapping) for row in result]
            return {
                "status": "ok",
                "data": data,
                "count": len(data)
            }
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return {"status": "error", "message": str(e)}

# Top productos
@app.get("/top-productos")
def top_productos():
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT 
                    p.item_desc,
                    SUM(v.pos_qty)::int as total_cantidad,
                    SUM(v.pos_sales)::numeric as total_ventas
                FROM ventas v
                JOIN productos p ON v.product_id = p.id
                GROUP BY p.item_desc
                ORDER BY total_ventas DESC
                LIMIT 20
            """))
            data = [dict(row._mapping) for row in result]
            return {
                "status": "ok",
                "data": data,
                "count": len(data)
            }
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return {"status": "error", "message": str(e)}

# Ventas por tienda
@app.get("/tienda/{tienda_id}")
def ventas_por_tienda(tienda_id: int):
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT 
                    t.store_name,
                    t.codigo_postal,
                    SUM(v.pos_qty)::int as total_unidades,
                    SUM(v.pos_sales)::numeric as total_ventas,
                    COUNT(*) as num_registros
                FROM ventas v
                JOIN tiendas t ON v.store_id = t.id
                WHERE v.store_id = :tienda_id
                GROUP BY t.store_name, t.codigo_postal
            """), {"tienda_id": tienda_id})
            row = result.fetchone()
            data = dict(row._mapping) if row else {}
            return {
                "status": "ok",
                "data": data
            }
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)