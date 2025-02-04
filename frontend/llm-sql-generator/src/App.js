import React, { useState, useEffect } from 'react';

function App() {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [nlPrompt, setNlPrompt] = useState("");
  const [generatedSQL, setGeneratedSQL] = useState("");
  const [results, setResults] = useState({ columns: [], rows: [] });
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await fetch('http://localhost:8000/tables');
      const data = await response.json();
      setTables(data.tables);
    } catch (err) {
      console.error("Error fetching tables:", err);
      setError("Error fetching tables.");
    }
  };

  const handleTableSelect = (table) => {
    setSelectedTable(table);
    setSearchQuery(table);
  };

  const filteredTables = tables.filter(table =>
    table.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const generateQuery = async () => {
    if (!selectedTable || !nlPrompt) {
      setError("Please select a table and enter a prompt.");
      return;
    }
    setError("");
    setGeneratedSQL(""); // Clear previous SQL
    setIsGenerating(true);
    try {
      const payload = { table: selectedTable, nl_request: nlPrompt };
      const response = await fetch("http://localhost:8000/generate_query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let sql = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const text = decoder.decode(value);
        sql += text;
        setGeneratedSQL(sql);
      }

      // Clean up the SQL by removing any non-SQL text
      const cleanedSQL = sql.trim();
      setGeneratedSQL(cleanedSQL);
      
      // Add to query history only if we have valid SQL
      if (cleanedSQL) {
        setHistory([...history, { nlPrompt, sql: cleanedSQL }]);
      }
    } catch (err) {
      console.error("Error generating SQL query:", err);
      setError("Error generating SQL query: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const executeQuery = async () => {
    if (!generatedSQL) {
      setError("No SQL query to execute.");
      return;
    }
    setError("");
    try {
      const payload = { sql_query: generatedSQL };
      const response = await fetch("http://localhost:8000/execute_query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail);
      }
      const data = await response.json();
      setResults({ columns: data.columns, rows: data.rows });
    } catch (err) {
      console.error("Error executing query:", err);
      setError("Error executing query: " + err.message);
    }
  };

  const exportCSV = async () => {
    if (!generatedSQL) {
      setError("No SQL query to export.");
      return;
    }
    setError("");
    try {
      const payload = { sql_query: generatedSQL };
      const response = await fetch("http://localhost:8000/export_csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "results.csv";
      a.click();
    } catch (err) {
      console.error("Error exporting CSV:", err);
      setError("Error exporting CSV: " + err.message);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen">
      {/* Main Panel */}
      <main className="flex-1 p-4 overflow-auto">
        <h1 className="text-2xl font-bold mb-4">LLM-Assisted SQL Query Generator</h1>
        
        {/* Table Selector */}
        <div className="relative mb-4">
          <input 
            type="text" 
            placeholder="Search table..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
          {filteredTables.length > 0 && (
            <ul className="absolute z-10 bg-white border w-full max-h-60 overflow-y-auto mt-1 rounded shadow">
              {filteredTables.map((table, index) => (
                <li 
                  key={index} 
                  className="px-3 py-2 hover:bg-indigo-600 hover:text-white cursor-pointer text-gray-900"
                  onClick={() => {
                    handleTableSelect(table);
                    document.activeElement?.blur();
                  }}
                >
                  {table}
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {/* Natural Language Prompt Input */}
        <textarea 
          rows="3"
          placeholder="Enter your natural language query..."
          value={nlPrompt}
          onChange={(e) => setNlPrompt(e.target.value)}
          className="w-full border px-3 py-2 rounded mb-2"
        />
        
        {/* Action Buttons */}
        <div className="flex space-x-2 mb-4">
          <button 
            className={`${
              isGenerating ? 'bg-indigo-400' : 'bg-indigo-600'
            } text-white px-4 py-2 rounded flex items-center`} 
            onClick={generateQuery}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              'Generate SQL'
            )}
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={executeQuery}>
            Execute Query
          </button>
          <button className="bg-gray-600 text-white px-4 py-2 rounded" onClick={exportCSV}>
            Export CSV
          </button>
        </div>
        
        {/* Display Generated SQL */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Generated SQL</h2>
          <textarea 
            rows="4"
            value={generatedSQL}
            readOnly
            className={`w-full border px-3 py-2 rounded ${
              isGenerating ? 'animate-pulse bg-gray-50' : ''
            }`}
          />
        </div>
        
        {/* Display Query Results */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Results</h2>
          <div className="max-h-64 overflow-y-auto border rounded">
            {results.columns.length > 0 && (
              <table className="min-w-full text-sm text-left text-gray-800">
                <thead className="bg-gray-100 font-medium sticky top-0">
                  <tr>
                    {results.columns.map((col, idx) => (
                      <th key={idx} className="px-4 py-2">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="border-b hover:bg-gray-50">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-4 py-2">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="text-red-600 mb-4">{error}</div>
        )}
      </main>
      
      {/* Query History Sidebar */}
      <aside className="w-full md:w-64 bg-gray-100 p-4 border-t md:border-t-0 md:border-l overflow-y-auto">
        <h2 className="text-lg font-semibold mb-2">Query History</h2>
        <ul>
          {history.map((item, index) => (
            <li key={index} className="mb-2">
              <button 
                className="w-full text-left px-2 py-1 hover:bg-gray-200 rounded"
                onClick={() => {
                  setNlPrompt(item.nlPrompt);
                  setGeneratedSQL(item.sql);
                }}
              >
                {item.nlPrompt}
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

export default App;

