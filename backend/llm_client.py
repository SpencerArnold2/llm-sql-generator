# backend/llm_client.py
import requests
import openai
from config import LLM_PROVIDER, LLM_MODEL, OPENAI_API_KEY
import logging
import json


class LLMClient:
    def __init__(
        self, provider=LLM_PROVIDER, model_name=LLM_MODEL, api_key=OPENAI_API_KEY
    ):
        self.provider = provider
        if self.provider == "openai":
            openai.api_key = api_key
            self.model_name = model_name
        elif self.provider == "ollama":
            self.model_name = model_name
        else:
            raise ValueError("Unsupported LLM provider")

    def _clean_sql_response(self, response):
        """Clean the response to ensure it only contains SQL."""
        # Remove any markdown code block syntax
        response = response.replace("```sql", "").replace("```", "")
        
        # Split on newlines and process each line
        lines = response.split('\n')
        sql_lines = []
        sql_starters = ("SELECT", "WITH", "INSERT", "UPDATE", "DELETE", "CREATE")
        
        # Find the first line that starts with a SQL keyword
        start_idx = -1
        for i, line in enumerate(lines):
            clean_line = line.strip().upper()
            if any(clean_line.startswith(starter) for starter in sql_starters):
                start_idx = i
                break
        
        if start_idx == -1:
            return ""
            
        # Collect lines until we hit a line that looks like a comment or natural language
        for line in lines[start_idx:]:
            line = line.strip()
            if not line:
                continue
                
            # Stop if we hit what looks like a natural language explanation or markdown
            if line.startswith(('Here', 'This', 'Note', '>', '#', '--')):
                break
                
            # Stop if we hit another SQL statement
            if any(line.upper().startswith(starter) for starter in sql_starters) and sql_lines:
                break
                
            sql_lines.append(line)
        
        sql = ' '.join(sql_lines).strip()
        
        # Ensure the SQL ends with a semicolon
        if sql and not sql.endswith(';'):
            sql += ';'
            
        return sql

    def generate_sql(self, prompt):
        if self.provider == "openai":
            response = openai.ChatCompletion.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.0,  # deterministic output
            )
            sql_query = response["choices"][0]["message"]["content"]
            return self._clean_sql_response(sql_query.strip())
        elif self.provider == "ollama":
            url = "http://localhost:11434/api/generate"
            payload = {
                "model": self.model_name,
                "prompt": prompt,
                "stream": True,  # Always use streaming for more reliable responses
                "options": {
                    "temperature": 0.1,
                    "top_p": 0.1,
                }
            }
            try:
                logging.info(f"Sending request to Ollama API with model: {self.model_name}")
                response = requests.post(url, json=payload, timeout=30, stream=True)
                
                if response.status_code == 404:
                    raise ValueError(f"Model {self.model_name} not found. Please make sure it's installed.")
                    
                response.raise_for_status()
                
                # Accumulate the full response
                full_response = ""
                for line in response.iter_lines():
                    if line:
                        try:
                            chunk = json.loads(line.decode())
                            if 'error' in chunk:
                                raise ValueError(f"Ollama API error: {chunk['error']}")
                            if 'response' in chunk:
                                full_response += chunk['response']
                        except json.JSONDecodeError:
                            continue
                
                # Clean and return the accumulated response
                sql_query = self._clean_sql_response(full_response.strip())
                logging.info(f"Generated SQL query: {sql_query}")
                return sql_query
                
            except requests.exceptions.ConnectionError:
                logging.error("Failed to connect to Ollama API. Is the Ollama server running?")
                raise ValueError("Could not connect to Ollama. Please ensure the Ollama server is running.")
            except requests.exceptions.Timeout:
                logging.error("Ollama API request timed out")
                raise ValueError("Request to Ollama timed out. Please try again.")
            except requests.exceptions.RequestException as e:
                logging.error(f"Ollama API request failed: {str(e)}")
                raise ValueError(f"Failed to communicate with Ollama: {str(e)}")
            except Exception as e:
                logging.error(f"Unexpected error while generating SQL: {str(e)}")
                raise

    def generate_sql_stream(self, prompt):
        """Stream responses from the LLM"""
        if self.provider == "openai":
            raise NotImplementedError("Streaming not implemented for OpenAI")
        elif self.provider == "ollama":
            url = "http://localhost:11434/api/generate"
            payload = {
                "model": self.model_name,
                "prompt": prompt,
                "options": {
                    "temperature": 0.1,  # Lower temperature for more deterministic output
                    "top_p": 0.1,       # More focused sampling
                },
                "stream": True
            }
            
            accumulated_text = ""
            with requests.post(url, json=payload, stream=True) as response:
                response.raise_for_status()
                for line in response.iter_lines():
                    if line:
                        data = line.decode('utf-8')
                        if data.strip():  # Skip empty lines
                            try:
                                json_response = requests.compat.json.loads(data)
                                if 'response' in json_response:
                                    token = json_response['response']
                                    accumulated_text += token
                                    
                                    # Only yield if we have meaningful content
                                    if token.strip() and (
                                        token.endswith(';') or 
                                        token.endswith('\n') or 
                                        token.endswith(' ') or
                                        token.endswith(',')
                                    ):
                                        # Clean the accumulated text as we go
                                        clean_sql = self._clean_sql_response(accumulated_text)
                                        if clean_sql:
                                            yield token
                                            
                                if json_response.get('done', False):
                                    # Final cleanup of the complete response
                                    final_text = self._clean_sql_response(accumulated_text)
                                    if final_text != accumulated_text:
                                        yield "\n" + final_text
                            except requests.compat.json.JSONDecodeError:
                                continue
