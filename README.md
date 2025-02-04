# LLM-Assisted SQL Query Generator for Amazon Redshift

This project is a web application that leverages large language models (LLMs) to generate optimized SQL queries for Amazon Redshift based on natural language prompts.

## Features

- **Dynamic Schema Retrieval:**  
  Retrieves table DDLs from Redshift on demand and caches them for improved performance.

- **LLM-Based Query Generation:**  
  Uses either OpenAI's API or a self-hosted LLM (e.g., Ollama) to generate SQL queries based on user-provided natural language.
  - Supports streaming responses for real-time query generation
  - Optimized for Redshift-specific SQL syntax
  - Smart handling of date/time functions and comparisons

- **Query Execution & CSV Export:**  
  Executes the generated SQL against Amazon Redshift, displays results in a scrollable table, and allows CSV downloads.

- **Modern React Frontend:**  
  A responsive frontend built with Next.js and Tailwind CSS featuring:
  - Real-time table search and selection
  - Interactive query input with immediate feedback
  - Clean, modern UI with proper error handling
  - Query history with one-click reuse
  - Mobile-responsive design

## Setup & Installation

### Backend

1. **Install Dependencies:**  
   Navigate to the `backend` directory and install the required packages:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
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
   LLM_PROVIDER=ollama       # or 'openai' if using OpenAI
   LLM_MODEL=qwen2.5-coder:1.5b   # or your chosen model name

   # SSH tunneling settings (if needed)
   USE_SSH_TUNNEL=false
   SSH_HOST=your_bastion_host
   SSH_PORT=22
   SSH_USER=your_ssh_username
   SSH_PRIVATE_KEY=/path/to/your/private/key
   ```

3. **Start Ollama (if using local LLM):**
   ```bash
   # Install Ollama first if you haven't: https://ollama.ai/
   ollama pull qwen2.5-coder:1.5b  # Pull the model
   ollama serve  # Start the Ollama server
   ```

4. **Run the Backend Server:**  
   Start the FastAPI server using Uvicorn:
   ```bash
   uvicorn app:app --reload
   ```
   The API will be available at `http://localhost:8000`.

### Frontend

1. **Install Dependencies:**
   ```bash
   cd frontend/llm-sql-generator
   npm install
   ```

2. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:3000`.

## Current Capabilities

- **Natural Language Understanding:**
  - Generates SQL queries from plain English descriptions
  - Handles complex table relationships and joins
  - Supports aggregations, grouping, and filtering

- **Redshift Optimization:**
  - Uses Redshift-specific date/time functions
  - Defaults to created_at for time-based queries
  - Proper handling of Redshift data types and syntax

- **Real-time Interaction:**
  - Immediate feedback during query generation
  - Live table search and filtering
  - Interactive error handling and validation

## Roadmap

- **Query Enhancement:**
  - [ ] Add query optimization suggestions
  - [ ] Support for more complex joins and subqueries
  - [ ] Query performance metrics and execution plans

- **User Experience:**
  - [ ] Save and categorize favorite queries
  - [ ] Custom query templates
  - [ ] Query result visualizations
  - [ ] Dark mode support

- **Security & Deployment:**
  - [ ] User authentication and role-based access
  - [ ] Query execution limits and safeguards
  - [ ] Docker containerization
  - [ ] Cloud deployment templates

- **Advanced Features:**
  - [ ] Query explanation in natural language
  - [ ] Schema relationship visualization
  - [ ] Batch query execution
  - [ ] Scheduled query runs

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

