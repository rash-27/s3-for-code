import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Button from '../buttons/Button';
import { functionAPI } from '../../services/api';

const FunctionLogs = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [functionData, setFunctionData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const loadFunctionData = async () => {
    try {
      const response = await functionAPI.getById(id);
      setFunctionData(response.data);
    } catch (err) {
      console.error('Failed to load function:', err);
      setError('Function not found');
    }
  };

  const loadLogs = async () => {
    try {
      // Mock logs since we don't have real logs endpoint
      const mockLogs = [
        `2025-09-13 18:15:00 - Function ${functionData?.name || id} - Initialized`,
        `2025-09-13 18:15:05 - Processing ${functionData?.event_type || 'HTTP'} events`,
        `2025-09-13 18:15:10 - Status: ${functionData?.status || 'PENDING'}`,
        `2025-09-13 18:15:15 - Source: ${functionData?.location_url || 'N/A'}`,
        `2025-09-13 18:15:20 - Ready for requests`,
        `2025-09-13 18:15:25 - Memory usage: 45MB`,
        `2025-09-13 18:15:30 - Active connections: 0`
      ];
      setLogs(mockLogs);
      setError('');
    } catch (err) {
      console.error('Failed to load logs:', err);
      setError('Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadFunctionData();
    }
  }, [id]);

  useEffect(() => {
    if (functionData) {
      loadLogs();
    }
  }, [functionData]);

  // Auto-refresh logs every 5 seconds if enabled
  useEffect(() => {
    let interval;
    if (autoRefresh && functionData) {
      interval = setInterval(() => {
        loadLogs();
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, functionData]);

  const handleDeploy = async (action) => {
    try {
      if (action === 'start') {
        await functionAPI.startDeploy(id);
      } else {
        await functionAPI.stopDeploy(id);
      }
      loadFunctionData(); // Refresh function data
    } catch (error) {
      console.error(`Failed to ${action} deployment:`, error);
      alert(`Failed to ${action} deployment`);
    }
  };

  const downloadLogs = () => {
    const logText = logs.join('\n');
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${functionData?.name || 'function'}_logs.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearLogs = () => {
    setLogs(['Logs cleared from view']);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading logs...</div>
      </div>
    );
  }

  if (error && !functionData) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <Button onClick={() => navigate('/')}>Back to Functions</Button>
      </div>
    );
  }

  return (
    <div className="function-logs-page">
      <header className="page-header">
        <h1>Function Logs</h1>
        <nav className="logs-nav">
          <Link to="/" className="btn btn-outline">
            ← Back to Functions
          </Link>
          <Button onClick={() => loadLogs()}>
            ↻ Refresh
          </Button>
        </nav>
      </header>

      <main>
        {functionData && (
          <div className="function-info">
            <h2>{functionData.name}</h2>
            <p>
              <strong>Status:</strong>{' '}
              <span className={`status status-${functionData.status.toLowerCase()}`}>
                {functionData.status}
              </span>
            </p>
            <p><strong>Type:</strong> {functionData.type}</p>
            <p><strong>Event:</strong> {functionData.event_type}</p>
          </div>
        )}

        <div className="logs-container">
          <div className="logs-header">
            <h3>Recent Activity</h3>
            <div className="logs-controls">
              <label className="auto-refresh-toggle">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                />
                Auto-refresh
              </label>
              <Button size="small" onClick={clearLogs}>
                Clear View
              </Button>
              <Button size="small" onClick={downloadLogs}>
                Download
              </Button>
            </div>
          </div>
          
          <div className="logs" role="log" aria-live={autoRefresh ? 'polite' : 'off'}>
            {logs.map((log, index) => (
              <div key={index} className="log-entry">
                {log}
              </div>
            ))}
          </div>
        </div>

        {functionData && (
          <div className="logs-actions">
            {functionData.status === 'PENDING' ? (
              <Button
                variant="primary"
                onClick={() => handleDeploy('start')}
              >
                Start Deploy
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={() => handleDeploy('stop')}
              >
                Stop Deploy
              </Button>
            )}
            <Link to={`/edit/${id}`} className="btn btn-outline">
              Edit Function
            </Link>
          </div>
        )}
      </main>
    </div>
  );
};

export default FunctionLogs;
