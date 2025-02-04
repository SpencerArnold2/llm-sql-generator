# backend/app.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import csv
import io
import logging

from utils import get_table_schema, build_prompt, safe_run_query
from llm_client import LLMClient

app = FastAPI(title="LLM-Assisted SQL Query Generator for Amazon Redshift")
# Add CORS middleware to allow requests from the React frontend.
origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
llm_client = LLMClient()


# --- Request Models ---
class GenerateQueryRequest(BaseModel):
    table: str
    nl_request: str


class ExecuteQueryRequest(BaseModel):
    sql_query: str


class ExportCSVRequest(BaseModel):
    sql_query: str


# --- Endpoints ---


@app.get("/")
def read_root():
    return {"message": "LLM-Assisted SQL Query Generator API"}


@app.get("/tables")
def get_tables():
    # Fetch distinct table names from the public schema.
    try:
        query = (
            "SELECT DISTINCT tablename FROM pg_table_def WHERE schemaname = 'public';"
        )
        from database import cursor

        cursor.execute(query)
        rows = cursor.fetchall()
        tables = [row[0] for row in rows]
        return {"tables": tables}
    except Exception as e:
        logging.error(f"Error fetching tables: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching tables.")


@app.get("/table_schema")
def table_schema(table: str, schema: str = "public"):
    try:
        ddl = get_table_schema(table, schema)
        return {"table": table, "schema": ddl}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate_query")
async def generate_query(request: GenerateQueryRequest):
    try:
        logging.info(f"Generating query for table: {request.table}, request: {request.nl_request}")
        
        try:
            ddl = get_table_schema(request.table)
            logging.info(f"Retrieved schema for table {request.table}")
        except Exception as schema_err:
            logging.error(f"Error getting schema: {str(schema_err)}")
            raise HTTPException(status_code=400, detail=f"Error getting table schema: {str(schema_err)}")
        
        prompt = build_prompt(request.nl_request, ddl)
        logging.info("Built prompt for LLM")
        
        try:
            sql_query = llm_client.generate_sql(prompt)
            if not sql_query:
                raise ValueError("No valid SQL query was generated")
            logging.info(f"Generated SQL query: {sql_query}")
            return {"sql_query": sql_query}
        except Exception as llm_err:
            logging.error(f"Error from LLM: {str(llm_err)}")
            raise HTTPException(status_code=500, detail=f"Error generating SQL: {str(llm_err)}")
            
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Unexpected error in generate_query: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.post("/execute_query")
def execute_query(request: ExecuteQueryRequest):
    result = safe_run_query(request.sql_query)
    if result["error"]:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@app.post("/export_csv")
def export_csv(request: ExportCSVRequest):
    result = safe_run_query(request.sql_query)
    if result["error"]:
        raise HTTPException(status_code=400, detail=result["error"])

    # Create CSV data in-memory
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(result["columns"])
    writer.writerows(result["rows"])
    output.seek(0)

    headers = {"Content-Disposition": 'attachment; filename="results.csv"'}
    return StreamingResponse(output, media_type="text/csv", headers=headers)


# Run the server with: uvicorn app:app --reload
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
