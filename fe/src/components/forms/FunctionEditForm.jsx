import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import FormInput from './FormInput';
import Button from '../buttons/Button';
import { FUNCTION_TYPES, SOURCE_TYPES, EVENT_TYPES, STATUS_TYPES } from '../../services/api';

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
    reset
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

  const source = watch('source');
  const eventType = watch('event_type');
  const type = watch('type');
  const locationUrl = watch('location_url');

  const onSubmit = async (data) => {
    setLoading(true);
    setSubmitError('');

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      alert(`Function "${data.name}" updated successfully!`);
      navigate('/');
    } catch (error) {
      console.error('Failed to update function:', error);
      setSubmitError(
        error.response?.data?.detail ||
        'Failed to update function. Please try again.'
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
            />
          </div>

          {/* Show GitHub repo URL input only if source is GITHUB */}
          {source === 'GITHUB' && (
            <FormInput
              label="GitHub Repository URL (.git)"
              name="location_url"
              type="url"
              register={register}
              errors={errors}
              required
              helpText="Enter your GitHub repository URL ending with .git"
              validation={{
                required: "Location URL is required",
                validate: value => {
                  try {
                    const url = new URL(value);
                    if (!value.endsWith('.git')) {
                      return "GitHub repo URL must end with .git";
                    }
                    if (!url.hostname.includes('github.com')) {
                      return "GitHub repo URL must be a GitHub domain";
                    }
                  } catch {
                    return "Enter a valid GitHub URL";
                  }
                  return true;
                }
              }}
            />
          )}

          {/* Show Docker image URL input only if function type is IMAGE */}
          {type === 'IMAGE' && (
            <FormInput
              label="Docker Image URL"
              name="docker_image_url"
              type="text"
              register={register}
              errors={errors}
              required
              helpText="Enter your Docker image URL"
              validation={{
                required: "Docker Image URL is required",
                validate: value => {
                  const dockerImagePattern = /^[\w\-\.]+(\/[\w\-\.]+)*(:[\w\-\.]+)?$/;
                  if (!dockerImagePattern.test(value)) {
                    return "Invalid Docker image URL format";
                  }
                  return true;
                }
              }}
            />
          )}

          {/* Show file upload only if source is STORAGE */}
          {source === 'STORAGE' && (
            <div className="form-row">
              <label htmlFor="file-upload" style={{ fontWeight: 'bold' }}>
                Upload Function Package
              </label>
              <input
                type="file"
                id="file-upload"
                onChange={(e) => {
                  const file = e.target.files[0];
                  setSelectedFile(file);
                  if (file) {
                    alert(`File selected: ${file.name}`);
                    // TODO: Add file upload handling logic here
                  }
                }}
                accept="*/*"
              />
              <small>Upload your function package here</small>
            </div>
          )}

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
