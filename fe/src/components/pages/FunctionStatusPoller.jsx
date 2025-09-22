import React, { useState, useEffect } from 'react';
import { functionAPI } from '../../services/api';

const FunctionStatusPoller = ({ functionData }) => {
  const [liveStatus, setLiveStatus] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Polling is only necessary if the function is not in a final state
    if (functionData.status !== 'DEPLOYED' && functionData.status !== 'PENDING') {
      return; // Or handle other statuses like 'UPDATE_FAILED'
    }

    const fetchStatus = async () => {
      try {
        const response = await functionAPI.getLogs(functionData.id);
        if (response.data.error) {
          setError(response.data.error);
          setLiveStatus(null);
        } else {
          setLiveStatus(response.data);
          setError('');
        }
      } catch (err) {
        // This can happen if the deployment is not found (404), which is normal
        setError('Deployment not found or not ready.');
        setLiveStatus(null);
      }
    };

    // Don't poll for functions that are not deployed
    if (functionData.status === 'DEPLOYED') {
      fetchStatus(); // Fetch immediately
      const intervalId = setInterval(fetchStatus, 5000); // Poll every 5 seconds
      return () => clearInterval(intervalId); // Cleanup
    }
  }, [functionData.id, functionData.status]);

  // Display the database status by default
  const displayStatus = liveStatus ? liveStatus.status : functionData.status;
  const replicas = liveStatus ? `${liveStatus.availableReplicas} / ${liveStatus.replicas}` : 'N/A';

  return (
    <>
      <span 
        className={`status status-${displayStatus.toLowerCase()}`}
        aria-label={`Status: ${displayStatus}`}
      >
        {displayStatus}
      </span>
      {functionData.status === 'DEPLOYED' && (
        <p className="replicas-info"><strong>Replicas:</strong> {replicas}</p>
      )}
    </>
  );
};

export default FunctionStatusPoller;