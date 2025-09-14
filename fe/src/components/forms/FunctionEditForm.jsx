import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import FormInput from './FormInput';
import Button from '../buttons/Button';
import { FUNCTION_TYPES, SOURCE_TYPES, EVENT_TYPES, STATUS_TYPES, functionAPI } from '../../services/api';

const FunctionEditForm = ({ functionData }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    reset,
    setValue
  } = useForm({
    defaultValues: {
      name: functionData?.name || '',
      type: functionData?.type || '',
      source: functionData?.source || '',
      location_url: functionData?.location_url || '',
      event_type: functionData?.event_type || '',
      status: functionData?.status || '',
      redis_host: functionData?.redis_host || '',
      redis_queue_name: functionData?.redis_queue_name || ''
    }
  });

  const functionType = watch('type');
  const source = watch('source');
  const eventType = watch('event_type');

  // Auto-set source to DOCKER if functionType is IMAGE, and disable editing it
  useEffect(() => {
    if (functionType === 'IMAGE') {
      setValue('source', 'DOCKER', { shouldValidate: true, shouldDirty: true });
    }
  }, [functionType, setValue]);

  // Upload file helper
  const handleFileUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await functionAPI.uploadFile(formData);
    return response.data?.file_url; // Adjust depending on backend response
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setSubmitError('');

    try {
      // Validate file is selected if STORAGE source
      if (functionType !== 'IMAGE' && source === 'STORAGE') {
        if (!selectedFile) {
          setSubmitError('File upload is required when source is STORAGE.');
          setLoading(false);
          return;
        }
        // Upload file and replace location_url with uploaded URL
        const uploadedUrl = await handleFileUpload(selectedFile);
        data.location_url = uploadedUrl;
      }

      // Use Docker or GitHub URL if applicable
      if (functionType === 'IMAGE') {
        data.location_url = data.docker_image_url || '';
      } else if (source === 'GITHUB') {
        data.location_url = data.github_url || '';
      }

      // Submit updated data
      await functionAPI.create(data); // Change to your update API if needed

      alert(`Function "${data.name}" updated successfully!`);
      navigate('/');
    } catch (error) {
      console.error('Failed to update function:', error);
      setSubmitError(
        error.response?.data?.detail || 'Failed to update function. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    reset({
      name: functionData?.name || '',
      type: functionData?.type || '',
      source: functionData?.source || '',
      location_url: functionData?.location_url || '',
      event_type: functionData?.event_type || '',
      status: functionData?.status || '',
      redis_host: functionData?.redis_host || '',
      redis_queue_name: functionData?.redis_queue_name || ''
    });
    setSubmitError('');
    setSelectedFile(null);
  };

  return (
    <div className="function-edit-form-container">
      <form onSubmit={handleSubmit(onSubmit)} className="function-form" noValidate>
        {submitError && (
          <div className="error-message" role="alert">
            <strong>Error:</strong> {submitError}
          </div>
        )}

        <fieldset>
          <legend>Edit Function Details</legend>

          <FormInput
            label="Function Name"
            name="name"
            register={register}
            errors={errors}
            required
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
              disabled={functionType === 'IMAGE'}
            />
          </div>

          {/* Show all inputs but conditionally validate */}

          {/* Docker Image URL */}
          <FormInput
            label="Docker Image URL"
            name="docker_image_url"
            register={register}
            errors={errors}
            helpText="Enter your Docker image URL (e.g., 'user/repo:tag')"
            validation={{
              validate: value => {
                if (functionType === 'IMAGE' && source === 'DOCKER') {
                  if (!value) return "Docker image URL is required";
                  const pattern = /^[\w\-\.]+(\/[\w\-\.]+)*(:[\w\-\.]+)?$/;
                  if (!pattern.test(value)) return "Invalid Docker image format";
                }
                return true;
              }
            }}
          />

          {/* GitHub Repository URL */}
          <FormInput
            label="GitHub Repository URL (.git)"
            name="github_url"
            type="url"
            register={register}
            errors={errors}
            helpText="Enter your GitHub repository URL ending with .git"
            validation={{
              validate: value => {
                if (functionType !== 'IMAGE' && source === 'GITHUB') {
                  if (!value) return "GitHub repository URL is required";
                  try {
                    const url = new URL(value);
                    if (!value.endsWith('.git')) return "GitHub URL must end with .git";
                    if (!url.hostname.includes('github.com')) return "Must be a GitHub URL";
                  } catch {
                    return "Invalid GitHub URL";
                  }
                }
                return true;
              }
            }}
          />

          {/* File Upload */}
          <div className="form-row">
            <label htmlFor="file-upload" style={{ fontWeight: 'bold' }}>
              Upload File
            </label>
            <input
              type="file"
              id="file-upload"
              onChange={(e) => {
                const file = e.target.files[0];
                setSelectedFile(file);
                if (file) alert(`File selected: ${file.name}`);
              }}
              accept="*/*"
            />
            <small>Upload your function package (.zip, .tar, etc.)</small>
            {/* Show error if STORAGE source and no file */}
            {functionType !== 'IMAGE' && source === 'STORAGE' && !selectedFile && (
              <span className="error-message">File upload is required for STORAGE source</span>
            )}
          </div>

          <div className="form-row">
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

            <FormInput
              label="Status"
              name="status"
              type="select"
              register={register}
              errors={errors}
              required
              options={STATUS_TYPES}
              helpText="Current deployment status"
              validation={{ required: 'Status is required' }}
            />
          </div>
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
                helpText="Redis server connection URL"
              />

              <FormInput
                label="Redis Queue Name"
                name="redis_queue_name"
                register={register}
                errors={errors}
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
            disabled={loading || !isDirty}
          >
            Update Function
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
            onClick={resetForm}
            disabled={!isDirty}
          >
            Reset Changes
          </Button>
        </div>

        {isDirty && (
          <div className="form-status">
            <small>You have unsaved changes</small>
          </div>
        )}
      </form>
    </div>
  );
};

export default FunctionEditForm;
