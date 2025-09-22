import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../buttons/Button';
import DeploymentButtons from '../buttons/DeploymentButtons';
import FunctionStatusPoller from './FunctionStatusPoller';

const FunctionCard = ({ fn, onDelete, onUpdate }) => {
  // Helper to render the location URL safely
  const renderLocationUrl = (source, url) => {
    if (source === 'STORAGE' && !url.startsWith('http')) {
      return <span>Internal Storage</span>;
    }
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="url-link">
        {url.length > 40 ? `${url.substring(0, 40)}...` : url}
      </a>
    );
  };

  return (
    <div className="function-card">
      <div className="function-header">
        <h3>{fn.name}</h3>
        <FunctionStatusPoller functionData={fn} />
      </div>
      
      <div className="function-details">
        <p><strong>Type:</strong> {fn.type}</p>
        <p><strong>Source:</strong> {fn.source}</p>
        <p><strong>Event:</strong> {fn.event_type}</p>
        <p><strong>Location:</strong> {renderLocationUrl(fn.source, fn.location_url)}</p>
      </div>
      
      <div className="function-actions">
        <div className="action-group primary">
          <DeploymentButtons functionData={fn} onUpdate={onUpdate} />
        </div>
      </div>
    </div>
  );
};

export default FunctionCard;