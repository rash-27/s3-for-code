import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from './Button';
import DeploymentButtons from './DeploymentButtons';
import { functionAPI } from '../../services/api';

const ActionButtons = ({ functionData, onUpdate, onDelete }) => {
  const [loading, setLoading] = useState({ delete: false });

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Delete "${functionData.name}"? This cannot be undone.`
    );
    
    if (!confirmed) return;

    setLoading(prev => ({ ...prev, delete: true }));

    try {
      await functionAPI.delete(functionData.id);
      alert(`Function "${functionData.name}" deleted successfully.`);
      if (onDelete) {
        onDelete(functionData);
      }
    } catch (error) {
      console.error('Failed to delete function:', error);
      alert('Failed to delete function. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, delete: false }));
    }
  };

  return (
    <div className="function-actions">
      {/* Primary actions */}
      <div className="action-group primary">
        <DeploymentButtons 
          functionData={functionData} 
          onUpdate={onUpdate}
        />
        
        <Link 
          to={`/logs/${functionData.id}`} 
          className="btn btn-outline"
          aria-label={`View logs for ${functionData.name}`}
        >
          View Logs
        </Link>
      </div>
      
      {/* Secondary actions */}
      <div className="action-group secondary">
        <Link 
          to={`/edit/${functionData.id}`} 
          className="btn btn-small"
          aria-label={`Edit ${functionData.name}`}
        >
          Edit
        </Link>
        
        <Button
          variant="small"
          onClick={handleDelete}
          loading={loading.delete}
          disabled={loading.delete}
          ariaLabel={`Delete ${functionData.name}`}
        >
          Delete
        </Button>
      </div>

      {/* Quick info actions */}
      <div className="action-group info">
        <Button
          size="small"
          variant="outline"
          onClick={() => {
            navigator.clipboard.writeText(functionData.id);
            alert('Function ID copied to clipboard');
          }}
        >
          Copy ID
        </Button>
        
        {functionData.location_url && (
          <a
            href={functionData.location_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-small btn-outline"
            aria-label={`Open source for ${functionData.name}`}
          >
            View Source
          </a>
        )}
      </div>
    </div>
  );
};

export default ActionButtons;
