import React, { useState, useEffect } from 'react';
import { functionAPI } from '../../services/api';

const FunctionStatus = ({ functionId }) => {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await functionAPI.getLogs(functionId);
        if (response.data.error) {
            setError(response.data.error);
            setStatus(null);
        } else {
            setStatus(response.data);
            setError('');
        }
      } catch (err) {
        setError('Failed to fetch status.');
        setStatus(null);
      }
    };

    fetchStatus(); // Fetch immediately on mount
    const intervalId = setInterval(fetchStatus, 5000); // Poll every 5 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [functionId]);

  if (error) {
    return <span style={{ color: 'orange' }}>Status: N/A</span>;
  }

  if (!status) {
    return <span>Loading status...</span>;
  }

  return (
    <div>
      <span>Status: <strong>{status.status}</strong></span>
      <span style={{ marginLeft: '1rem' }}>
        Replicas: <strong>{status.availableReplicas} / {status.replicas}</strong>
      </span>
    </div>
  );
};

export default FunctionStatus;