import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import FormInput from './FormInput';
import Button from '../buttons/Button';
import { functionAPI, FUNCTION_TYPES, SOURCE_TYPES, EVENT_TYPES } from '../../services/api';

const FunctionForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm({
    defaultValues: {
      name: '',
      type: '',
      source: '',
      location_url: '', // This will hold the URL for GitHub/Docker
      event_type: '',
      redis_host: '',
      redis_queue_name: ''
    }
  });

  const functionType = watch('type');
  const source = watch('source');
  const eventType = watch('event_type');

  // ** CORRECTED onSubmit LOGIC **
  const onSubmit = async (data) => {
    setLoading(true);
    setSubmitError('');

    const formData = new FormData();

    // Append all standard form fields
    formData.append('name', data.name);
    formData.append('type', data.type);
    formData.append('source', data.source);
    formData.append('event_type', data.event_type);

    // Conditionally append source-specific data
    if (data.type === 'IMAGE') {
      formData.append('image_name', data.location_url);
    } else if (data.source === 'GITHUB') {
      formData.append('github_url', data.location_url);
    } else if (data.source === 'STORAGE') {
      if (!selectedFile) {
        setSubmitError('File upload is required for STORAGE source.');
        setLoading(false);
        return;
      }
      formData.append('file', selectedFile);
    }
    
    // Append optional queue fields if they exist
    if (data.redis_host) formData.append('redis_host', data.redis_host);
    if (data.redis_queue_name) formData.append('redis_queue_name', data.redis_queue_name);

    try {
      // Send the single FormData object to the corrected API method
      await functionAPI.create(formData);
      alert(`Function "${data.name}" created successfully!`);
      navigate('/');
    } catch (error) {
      console.error('Failed to create function:', error);
      setSubmitError(
        error.response?.data?.detail || 
        'Failed to create function. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    reset();
    setSelectedFile(null);
    setSubmitError('');
  };

  return (
    <div className="function-form-container">
      <form onSubmit={handleSubmit(onSubmit)} className="function-form" noValidate>
        {submitError && (
          <div className="error-message" role="alert">
            <strong>Error:</strong> {submitError}
          </div>
        )}

        <fieldset>
          <legend>Create New Function</legend>
          
          <FormInput
            label="Function Name"
            name="name"
            register={register}
            errors={errors}
            required
            placeholder="my-awesome-function"
          />

          <div className="form-row">
            <FormInput
              label="Function Type"
              name="type"
              type="select"
              register={register}
              errors={errors}
              required
              options={FUNCTION_TYPES}
            />
            <FormInput
              label="Source Type"
              name="source"
              type="select"
              register={register}
              errors={errors}
              required
              options={SOURCE_TYPES}
              disabled={functionType === 'IMAGE'}
            />
          </div>

          {/* Conditional Input Section */}
          {functionType === 'IMAGE' && (
            <FormInput
              label="Docker Image Name"
              name="location_url"
              register={register}
              errors={errors}
              required
              placeholder="username/my-image:latest"
            />
          )}

          {functionType !== 'IMAGE' && source === 'GITHUB' && (
            <FormInput
              label="GitHub Repository URL"
              name="location_url"
              type="url"
              register={register}
              errors={errors}
              required
              placeholder="https://github.com/user/repo.git"
            />
          )}

          {functionType !== 'IMAGE' && source === 'STORAGE' && (
            <div className="form-group">
              <label htmlFor="file-upload" className="required">
                Upload Function File
              </label>
              <input
                type="file"
                id="file-upload"
                onChange={e => setSelectedFile(e.target.files[0])}
                required
              />
              <small className="form-help">Upload your function code (.zip, .go, etc.)</small>
            </div>
          )}

          <FormInput
            label="Event Type"
            name="event_type"
            type="select"
            register={register}
            errors={errors}
            required
            options={EVENT_TYPES}
          />
        </fieldset>

        {eventType === 'QUEUE_EVENT' && (
          <fieldset>
            <legend>Queue Configuration (Optional)</legend>
            <div className="form-row">
              <FormInput
                label="Redis Host"
                name="redis_host"
                register={register}
                errors={errors}
                placeholder="redis://localhost:6379"
              />
              <FormInput
                label="Redis Queue Name"
                name="redis_queue_name"
                register={register}
                errors={errors}
                placeholder="my-processing-queue"
              />
            </div>
          </fieldset>
        )}

        <div className="form-actions">
          <Button type="submit" variant="primary" loading={loading} disabled={loading}>
            Create Function
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/')}>
            Cancel
          </Button>
          <Button type="button" variant="outline" onClick={handleReset}>
            Clear Form
          </Button>
        </div>
      </form>
    </div>
  );
};

export default FunctionForm;