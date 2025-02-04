# LLM-Assisted SQL Query Generator for Amazon Redshift

This project is a web application that leverages large language models (LLMs) to generate optimized SQL queries for Amazon Redshift based on natural language prompts.

## Features

- **Dynamic Schema Retrieval:**  
  Retrieves table DDLs from Redshift on demand and caches them for improved performance.

- **LLM-Based Query Generation:**  
  Uses either OpenAI’s API or a self-hosted LLM (e.g., Ollama) to generate SQL queries based on user-provided natural language.

- **Query Execution & CSV Export:**  
  Executes the generated SQL against Amazon Redshift, displays results in a scrollable table, and allows CSV downloads.

- **Interactive UI:**  
  A responsive frontend built with Tailwind CSS featuring a searchable table selector, prompt input area, results display, and a query history sidebar.

## Setup & Installation

### Backend

1. **Install Dependencies:**  
   Navigate to the `backend` directory and install the required packages:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Configure Environment Variables:**  
   Create a `.env` file in the `backend` directory with your credentials and settings:
   ```dotenv
   # Amazon Redshift credentials
   REDSHIFT_HOST=your_redshift_host
   REDSHIFT_PORT=5439
   REDSHIFT_DB=your_database_name
   REDSHIFT_USER=your_username
   REDSHIFT_PASSWORD=your_password

   # LLM configuration
   OPENAI_API_KEY=your_openai_api_key
   LLM_PROVIDER=openai       # or 'ollama' if using a self-hosted model
   LLM_MODEL=gpt-3.5-turbo   # or your chosen model name
   ```

3. **Run the Backend Server:**  
   Start the FastAPI server using Uvicorn:
   ```bash
   uvicorn app:app --reload
   ```
   The API will be available at `http://localhost:8000`.

4. Start a ollama server:
   ```bash
   ollama pull qwen2.5-coder:1.5b #(or your chosen model)
   ollama run qwen2.5-coder:1.5b
   ```

### Frontend

1. **Open the Frontend:**  
   Simply open the `frontend/index.html` file in your preferred web browser.  
   The UI is configured to communicate with the backend API at `http://localhost:8000`.

2. **Usage:**
   - **Table Selection:** Use the searchable dropdown to select a table.
   - **Natural Language Input:** Enter your query request (e.g., "Show total sales per category for the last year").
   - **Generate SQL:** Click the **Generate SQL** button to have the LLM produce the query.
   - **Execute Query:** Click **Execute Query** to run the SQL against Redshift and view the results.
   - **Export CSV:** Use the **Export CSV** button to download the results.
   - **Query History:** Review and reload previous queries from the sidebar.

## Future Enhancements

- **Error Handling and Debugging:**  
  Improve the iterative debugging loop with LLM suggestions for refining queries.

- **Multi-User Support:**  
  Add user authentication and store per-user query history.

- **Advanced UI/UX:**  
  Enhance the interface with additional filtering options, detailed result analytics, and more.

- **Cloud Deployment:**  
  Transition to a cloud-hosted environment (e.g., Vercel, AWS) with improved credential management and scaling.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

