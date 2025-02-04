"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [nlPrompt, setNlPrompt] = useState<string>("");
  const [generatedSQL, setGeneratedSQL] = useState<string>("");
  const [results, setResults] = useState<{ columns: string[]; rows: any[] }>({
    columns: [],
    rows: [],
  });
  const [error, setError] = useState<string>("");
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await fetch("http://localhost:8000/tables");
      const data = await response.json();
      setTables(data.tables);
    } catch (err) {
      console.error("Error fetching tables:", err);
      setError("Error fetching tables.");
    }
  };

  const generateQuery = async () => {
    if (!selectedTable || !nlPrompt) {
      setError("Please select a table and enter a prompt.");
      return;
    }
    setError("");
    setGeneratedSQL(""); // Clear previous SQL

    try {
      const payload = { table: selectedTable, nl_request: nlPrompt };
      console.log('Sending request with payload:', payload);
      
      const response = await fetch("http://localhost:8000/generate_query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      console.log('Response:', response);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.detail || 'Failed to generate SQL';
        } catch {
          errorMessage = errorText || response.statusText;
        }
        throw new Error(errorMessage);
      }
      console.log('Response:', response);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (!data.sql_query) {
        throw new Error('No SQL query was generated');
      }

      // Clean up the SQL query by removing any backticks or code block markers
      const cleanSQL = data.sql_query
        .replace(/```sql/g, '')
        .replace(/```/g, '')
        .trim();

      setGeneratedSQL(cleanSQL);
    } catch (err) {
      console.error("Error generating SQL query:", err);
      setError(err instanceof Error ? err.message : "Error generating SQL query.");
    }
  };

  const executeQuery = async () => {
    if (!generatedSQL) {
      setError("No SQL query to execute.");
      return;
    }
    setError("");

    try {
      const response = await fetch("http://localhost:8000/execute_query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql_query: generatedSQL }),
      });

      console.log('Execute response status:', response.status);
      console.log('Execute response headers:', Object.fromEntries(response.headers.entries()));
      const responseText = await response.text();
      console.log('Full execute response text:', responseText);

      if (!response.ok) {
        let errorDetail;
        try {
          const errorData = JSON.parse(responseText);
          errorDetail = errorData?.detail;
        } catch (parseError) {
          console.error('Error parsing execute error response:', parseError);
          errorDetail = responseText;
        }
        throw new Error(`Query execution failed: ${errorDetail || response.statusText}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing execute success response:', parseError);
        throw new Error('Invalid response format from server');
      }

      console.log('Parsed execute response data:', data);
      setResults({ columns: data.columns, rows: data.rows });
    } catch (err) {
      console.error("Error executing query:", err);
      setError(err instanceof Error ? err.message : "Error executing query.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <header className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white p-4 text-center text-3xl font-bold">
        LLM-Assisted SQL Query Generator
      </header>

      <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow mt-6">
        {error && (
          <div className="mb-4 p-3 bg-red-200 text-red-800 rounded">{error}</div>
        )}

        {/* Table Selector */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search table..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setTimeout(() => setIsInputFocused(false), 200)}
            className="w-full border rounded px-3 py-2 text-black placeholder-gray-500"
          />
          {(tables.length > 0 && (isInputFocused || searchQuery)) && (
            <ul className="mt-2 border rounded bg-white shadow max-h-40 overflow-y-auto">
              {tables
                .filter((table) =>
                  table.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((table) => (
                  <li
                    key={table}
                    className="px-3 py-2 hover:bg-indigo-600 hover:text-white cursor-pointer text-black"
                    onClick={() => {
                      setSelectedTable(table);
                      setSearchQuery(table);
                      setIsInputFocused(false);
                    }}
                  >
                    {table}
                  </li>
                ))}
            </ul>
          )}
        </div>

        {/* Prompt Input */}
        <textarea
          rows={3}
          placeholder="Describe your query..."
          value={nlPrompt}
          onChange={(e) => setNlPrompt(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-4 text-black placeholder-gray-500"
        />

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            onClick={generateQuery}
          >
            Generate SQL
          </button>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            onClick={executeQuery}
          >
            Execute Query
          </button>
        </div>

        {/* Generated SQL */}
        {generatedSQL && (
          <div className="mt-6 bg-gray-100 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2 text-black">Generated SQL</h2>
            <textarea
              rows={4}
              value={generatedSQL}
              readOnly
              className="w-full border rounded px-3 py-2 bg-white text-black"
            />
          </div>
        )}

        {/* Query Results */}
        {results.columns.length > 0 && (
          <div className="mt-6 bg-gray-100 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2 text-black">Results</h2>
            <table className="w-full text-sm border-collapse border border-gray-300 text-black">
              <thead>
                <tr className="bg-gray-200">
                  {results.columns.map((col) => (
                    <th key={col} className="border px-4 py-2 text-black">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.rows.map((row: any[], idx: number) => (
                  <tr key={idx} className="border hover:bg-gray-50">
                    {row.map((cell: any, i: number) => (
                      <td key={i} className="border px-4 py-2 text-black">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
            

