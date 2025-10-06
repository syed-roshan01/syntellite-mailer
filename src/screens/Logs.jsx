import React, { useEffect, useState } from "react";
import Section from "../components/Section";

function ScreenLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Session expired. Please log in again.");
      setLoading(false);
      return;
    }

    fetch("http://localhost:4000/api/logs", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401) {
            throw new Error("Unauthorized. Please log in again.");
          }
          throw new Error("Failed to load logs. Try again later.");
        }
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setLogs(data);
        } else {
          setLogs([]);
        }
        setError("");
      })
      .catch((err) => {
        console.error("Failed to fetch logs:", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="grid gap-6">
      <Section title="Delivery Logs">
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-2">Time</th>
                <th className="p-2">Action</th>
                <th className="p-2">List</th>
                <th className="p-2">Count</th>
                <th className="p-2">Status</th>
                <th className="p-2">Details</th>
              </tr>
            </thead>
            <tbody>
              {!loading && !error &&
                logs.map((log) => (
                  <tr key={log.id} className="border-t">
                    <td className="p-2 text-xs text-gray-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-2">{log.action}</td>
                    <td className="p-2">{log.list_name || "-"}</td>
                    <td className="p-2">{log.candidate_count}</td>
                    <td className="p-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          log.status === "success"
                            ? "bg-green-100 text-green-700"
                            : log.status === "partial"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="p-2">
                      <pre className="text-xs text-gray-600">{log.details_json}</pre>
                    </td>
                  </tr>
                ))}

              {loading && (
                <tr>
                  <td colSpan="6" className="p-4 text-center text-gray-400">
                    Loading logs...
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td colSpan="6" className="p-4 text-center text-red-500">
                    {error}
                  </td>
                </tr>
              )}

              {!loading && !error && logs.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-4 text-center text-gray-400">
                    No logs yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

export default ScreenLogs;
