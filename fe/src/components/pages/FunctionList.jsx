import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { functionAPI } from '../../services/api';
import FunctionCard from './FunctionCard'; // Import the new card component

const FunctionList = () => {
  const [functions, setFunctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadFunctions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await functionAPI.getAll();
      setFunctions(response.data);
      setError('');
    } catch (err) {
      console.error('Failed to load functions:', err);
      setError('Failed to load functions. Please check the connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFunctions();
  }, [loadFunctions]);

  const handleDelete = async (functionData) => {
    // For OpenFaaS, "delete" means "undeploy".
    if (!window.confirm(`Are you sure you want to undeploy and delete "${functionData.name}"?`)) {
      return;
    }

    try {
      // In our API, `delete` maps to the undeploy endpoint.
      await functionAPI.delete(functionData.id); 
      alert(`Function "${functionData.name}" undeployed successfully.`);
      // After undeploying, the status will change. Let's refresh the list.
      loadFunctions();
    } catch (error) {
      console.error('Failed to delete function:', error);
      alert(`Failed to delete function: ${error.response?.data?.detail || 'Please try again.'}`);
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading functions...</div>;
  }

  return (
    <div className="function-list-container">
      <header className="page-header">
        <h1>Function Service</h1>
        <Link to="/create" className="btn btn-primary">
          + Create New Function
        </Link>
      </header>

      <main>
        <h2>Your Functions</h2>
        
        {error && <div className="error-message" role="alert">{error}</div>}

        {functions.length === 0 && !loading ? (
          <div className="empty-state">
            <p>No functions found.</p>
            <Link to="/create" className="btn btn-primary">
              Create Your First Function
            </Link>
          </div>
        ) : (
          <div className="function-grid">
            {functions.map((fn) => (
              <FunctionCard 
                key={fn.id} 
                fn={fn} 
                onDelete={handleDelete} 
                onUpdate={loadFunctions}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default FunctionList;