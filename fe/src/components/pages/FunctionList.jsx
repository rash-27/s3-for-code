import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '../buttons/Button';
import DeploymentButtons from '../buttons/DeploymentButtons';
import { functionAPI } from '../../services/api';

const FunctionList = () => {
  const [functions, setFunctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadFunctions = async () => {
    try {
      setLoading(true);
      const response = await functionAPI.getAll();
      setFunctions(response.data);
      setError('');
    } catch (err) {
      console.error('Failed to load functions:', err);
      if (err.response) {
        console.error('API responded with error:', err.response.data);
      } else if (err.request) {
        console.error('No response received:', err.request);
      } else {
        console.error('Error setting up request:', err.message);
      }
      setError('Failed to load functions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFunctions();
  }, []);

  const handleDelete = async (functionData) => {
    if (!window.confirm(`Delete "${functionData.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      await functionAPI.delete(functionData.id);
      alert(`Function "${functionData.name}" deleted successfully.`);
      loadFunctions(); // Refresh list
    } catch (error) {
      console.error('Failed to delete function:', error);
      alert('Failed to delete function. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading functions...</div>
      </div>
    );
  }

  return (
    <div className="function-list-container">
      <header className="page-header">
        <h1>Function Service</h1>
        <nav>
          <Link to="/create" className="btn btn-primary">
            <span aria-hidden="true">+</span> Create New Function
          </Link>
        </nav>
      </header>

      <main>
        <h2>Your Functions</h2>
        
        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        {functions.length === 0 ? (
          <div className="empty-state">
            <p>No functions found.</p>
            <Link to="/create" className="btn btn-primary">
              Create Your First Function
            </Link>
          </div>
        ) : (
          <div className="function-grid">
            {functions.map((fn) => (
              <div key={fn.id} className="function-card">
                <div className="function-header">
                  <h3>{fn.name}</h3>
                  <span 
                    className={`status status-${fn.status.toLowerCase()}`}
                    aria-label={`Status: ${fn.status}`}
                  >
                    {fn.status}
                  </span>
                </div>
                
                <div className="function-details">
                  <p><strong>Type:</strong> {fn.type}</p>
                  <p><strong>Source:</strong> {fn.source}</p>
                  <p><strong>Event:</strong> {fn.event_type}</p>
                  <p><strong>URL:</strong> 
                    <a 
                      href={fn.location_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="url-link"
                    >
                      {fn.location_url.length > 50 
                        ? `${fn.location_url.substring(0, 50)}...` 
                        : fn.location_url
                      }
                    </a>
                  </p>
                </div>
                
                <div className="function-actions">
                  <div className="action-group primary">
                    <DeploymentButtons 
                      functionData={fn} 
                      onUpdate={loadFunctions} 
                    />
                    
                    <Link 
                      to={`/logs/${fn.id}`} 
                      className="btn btn-outline"
                      aria-label={`View logs for ${fn.name}`}
                    >
                      View Logs
                    </Link>
                  </div>
                  
                  <div className="action-group secondary">
                    <Link 
                      to={`/edit/${fn.id}`} 
                      className="btn btn-small"
                      aria-label={`Edit ${fn.name}`}
                    >
                      Edit
                    </Link>
                    
                    <Button
                      variant="small"
                      onClick={() => handleDelete(fn)}
                      ariaLabel={`Delete ${fn.name}`}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default FunctionList;
