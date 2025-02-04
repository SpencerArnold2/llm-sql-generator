# backend/utils.py
from database import cursor
import logging

# Simple in-memory cache for table DDLs
schema_cache = {}


def get_table_schema(table_name, schema="public"):
    full_name = f"{schema}.{table_name}"
    if full_name in schema_cache:
        return schema_cache[full_name]
    try:
        # Retrieve the DDL for the given table. (Adjust the query as needed for your Redshift setup.)
        query = f"SHOW TABLE {full_name};"
        cursor.execute(query)
        result = cursor.fetchone()
        if result:
            ddl_text = result[0]
            schema_cache[full_name] = ddl_text
            return ddl_text
        else:
            raise ValueError(f"Table {full_name} not found.")
    except Exception as e:
        logging.error(f"Error fetching schema for {full_name}: {str(e)}")
        raise e


def build_prompt(nl_request, table_schema_ddl):
    prompt = (
        "You are an expert SQL generator for Amazon Redshift. You must follow these rules exactly:\n"
        "1. Generate ONLY the SQL query without any explanations or comments\n"
        "2. Do not include any markdown formatting, backticks, or code block markers\n"
        "3. The query must be valid Amazon Redshift SQL\n"
        "4. Do not include any natural language text or explanations\n"
        "5. Do not include any 'Here's the SQL query' or similar prefixes\n"
        "6. Start directly with SELECT, WITH, INSERT, UPDATE, DELETE, or CREATE\n"
        "7. Use Redshift-specific date functions:\n"
        "   - Use DATEADD(day/month/year, n, date) instead of date + INTERVAL\n"
        "   - Use GETDATE() instead of NOW()\n"
        "   - Use DATEDIFF(day/month/year, date1, date2) for date differences\n"
        "8. For time-based comparisons:\n"
        "   - Always use the created_at column when comparing dates/times\n"
        "   - Only use other date columns if specifically requested\n"
        "   - Example: WHERE created_at >= DATEADD(year, -1, GETDATE())\n\n"
        f"Table schema:\n{table_schema_ddl}\n\n"
        f"User request: {nl_request}\n\n"
        "SQL query (start directly with the SQL command):"
    )
    return prompt


def safe_run_query(sql_query):
    try:
        cursor.execute(sql_query)
        rows = cursor.fetchall()
        columns = [desc[0] for desc in cursor.description]
        return {"columns": columns, "rows": rows, "error": None}
    except Exception as e:
        logging.error(f"Error executing query: {str(e)}")
        return {"columns": [], "rows": [], "error": str(e)}
