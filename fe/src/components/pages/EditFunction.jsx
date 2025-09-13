import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import FunctionEditForm from '../forms/FunctionEditForm';
import { functionAPI } from '../../services/api';

const EditFunction = () => {
  const { id } = useParams();
  const [functionData, setFunctionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadFunction = async () => {
      try {
        setLoading(true);
        const response = await functionAPI.getById(id);
        setFunctionData(response.data);
        setError('');
      } catch (err) {
        console.error('Failed to load function:', err);
        setError('Function not found');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadFunction();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading function...</div>
      </div>
    );
  }

  if (error || !functionData) {
    return (
      <div className="error-container">
        <div className="error-message">
          {error || 'Function not found'}
        </div>
        <Link to="/" className="btn btn-outline">
          Back to Functions
        </Link>
      </div>
    );
  }

  return (
    <div className="edit-function-page">
      <header className="page-header">
        <h1>Edit Function</h1>
        <nav>
          <Link to="/" className="btn btn-outline">
            ← Back to Functions
          </Link>
          <Link to={`/logs/${id}`} className="btn btn-outline">
            View Logs
          </Link>
        </nav>
      </header>

      <main>
        <FunctionEditForm functionData={functionData} />
      </main>
    </div>
  );
};

export default EditFunction;
