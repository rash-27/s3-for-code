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
  const [fileError, setFileError] = useState('');

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
      location_url: '',
      event_type: '',
      redis_host: '',
      redis_queue_name: ''
    }
  });

  const functionType = watch('type');
  const source = watch('source');
  const eventType = watch('event_type');

  const onSubmit = async (data) => {
    setLoading(true);
    setSubmitError('');

    try {
      // If source is STORAGE and functionType is not IMAGE, require file upload
      if (functionType !== 'IMAGE' && source === 'STORAGE') {
        if (!selectedFile) {
          setSubmitError('File upload is required when source is STORAGE.');
          setLoading(false);
          return;
        }

        // Upload the file
        const formData = new FormData();
        formData.append('file', selectedFile);

        const response = await functionAPI.uploadFile(formData);
        const uploadedUrl = response.data?.file_url; // Adjust based on your backend response

        if (!uploadedUrl) {
          throw new Error('File upload failed');
        }

        data.location_url = uploadedUrl; // Use uploaded file URL as location_url
      }

      // Clean up optional fields
      const cleanData = {
        ...data,
        redis_host: data.redis_host || null,
        redis_queue_name: data.redis_queue_name || null
      };

      await functionAPI.create(cleanData);
      alert(`Function "${data.name}" created successfully!`);
      navigate('/');
    } catch (error) {
      console.error('Failed to create function:', error);
      setSubmitError(
        error.response?.data?.detail || 
        error.message ||
        'Failed to create function. Please check your input and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="function-form-container">
      <form onSubmit={handleSubmit(onSubmit)} className="function-form" noValidate>
        {submitError && (
          <div className="error-message" role="alert" style={{ color: 'red' }}>
            <strong>Error:</strong> {submitError}
          </div>
        )}

        <fieldset>
          <legend>Function Details</legend>
          
          <FormInput
            label="Function Name"
            name="name"
            register={register}
            errors={errors}
            required
            placeholder="my-awesome-function"
            helpText="Choose a descriptive name for your function"
            validation={{ required: 'Function Name is required' }}
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
              helpText="Type of function to deploy"
              validation={{ required: 'Function Type is required' }}
            />

            <FormInput
              label="Source Type"
              name="source"
              type="select"
              register={register}
              errors={errors}
              required
              options={SOURCE_TYPES}
              helpText="Where your function code is stored"
              validation={{ required: 'Source Type is required' }}
            />
          </div>

          {/* Show Location URL input only if source is not STORAGE (file upload) */}
          {(source !== 'STORAGE') && (
            <FormInput
              label="Location URL"
              name="location_url"
              type="url"
              register={register}
              errors={errors}
              required
              placeholder="https://github.com/username/repo or Docker image URL"
              helpText="GitHub repository URL, Docker image URL, or storage location"
              validation={{
                required: 'Location URL is required',
                pattern: {
                  value: /^https?:\/\/.+/,
                  message: 'Enter a valid URL'
                }
              }}
            />
          )}

          {/* File Upload for STORAGE source */}
          {functionType !== 'IMAGE' && source === 'STORAGE' && (
            <div className="form-row">
              <label htmlFor="file-upload" style={{ fontWeight: 'bold' }}>
                Upload File
              </label>
              <input
                type="file"
                id="file-upload"
                onChange={e => {
                  const file = e.target.files[0];
                  if (!file) {
                    setSelectedFile(null);
                    setFileError('');
                    return;
                  }

                  // Define valid MIME types (adjust as needed)
                  const validFileTypes = [
                    'application/javascript',
                    'text/plain',
                    'application/x-tar',
                    'application/octet-stream',
                    'application/zip',
                    'application/gzip'
                  ];

                  if (!validFileTypes.includes(file.type)) {
                    setFileError('Invalid file type for STORAGE source');
                    setSelectedFile(null);
                  } else {
                    setFileError('');
                    setSelectedFile(file);
                  }
                }}
                accept=".js,.txt,.zip,.tar,.gz"
              />
              {fileError && <p style={{ color: 'red' }}>{fileError}</p>}
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
            helpText="How this function will be triggered"
            validation={{ required: 'Event Type is required' }}
          />
        </fieldset>

        {eventType === 'QUEUE_EVENT' && (
          <fieldset>
            <legend>Queue Configuration</legend>
            
            <div className="form-row">
              <FormInput
                label="Redis Host"
                name="redis_host"
                register={register}
                errors={errors}
                placeholder="redis://localhost:6379"
                helpText="Redis server connection URL"
              />

              <FormInput
                label="Redis Queue Name"
                name="redis_queue_name"
                register={register}
                errors={errors}
                placeholder="my-queue"
                helpText="Queue name for processing events"
              />
            </div>
          </fieldset>
        )}

        <div className="form-actions">
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={loading}
          >
            Create Function
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/')}
          >
            Cancel
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              reset();
              setSelectedFile(null);
              setFileError('');
              setSubmitError('');
            }}
          >
            Clear Form
          </Button>
        </div>
      </form>
    </div>
  );
};

export default FunctionForm;
