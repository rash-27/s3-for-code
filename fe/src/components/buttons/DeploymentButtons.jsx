import React, { useState } from 'react';
import Button from './Button';
import { functionAPI } from '../../services/api';

const DeploymentButtons = ({ functionData, onUpdate }) => {
  const [loading, setLoading] = useState({ start: false, stop: false });
  
  const handleDeploy = async (action) => {
    const isStart = action === 'start';
    setLoading(prev => ({ ...prev, [action]: true }));
    
    try {
      if (isStart) {
        await functionAPI.startDeploy(functionData.id);
      } else {
        await functionAPI.delete(functionData.id);
      }
      
      // Refresh function data
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error(`Failed to ${action} deployment:`, error);
      alert(`Failed to ${action} deployment. Please try again.`);
    } finally {
      setLoading(prev => ({ ...prev, [action]: false }));
    }
  };

  const isPending = functionData.status === 'PENDING';

  return (
    <>
      {!isPending && <p>Deployment Url: <a style={{textDecoration: 'underline'}} href={`http://localhost:31112/function/func-${functionData.id}`}>http://localhost:31112/function/func-{functionData.id}</a></p>}
    <div className="deployment-buttons">
      {isPending ? (
        <Button
          variant="primary"
          onClick={() => handleDeploy('start')}
          loading={loading.start}
          ariaLabel={`Start deployment for ${functionData.name}`}
        >
          Start Deploy
        </Button>
      ) : (
        <Button
          variant="secondary"
          onClick={() => handleDeploy('stop')}
          loading={loading.stop}
          ariaLabel={`Stop deployment for ${functionData.name}`}
        >
          Stop Deploy
        </Button>
      )}
    </div>
    </>
  );
};

export default DeploymentButtons;
