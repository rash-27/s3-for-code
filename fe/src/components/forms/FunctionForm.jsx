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

  const eventType = watch('event_type');

  const onSubmit = async (data) => {
    setLoading(true);
    setSubmitError('');

    try {
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
          <div className="error-message" role="alert">
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
            />
          </div>

          <FormInput
            label="Location URL"
            name="location_url"
            type="url"
            register={register}
            errors={errors}
            required
            placeholder="https://github.com/username/repo"
            helpText="GitHub repository URL or storage location"
          />

          <FormInput
            label="Event Type"
            name="event_type"
            type="select"
            register={register}
            errors={errors}
            required
            options={EVENT_TYPES}
            helpText="How this function will be triggered"
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
            onClick={() => reset()}
          >
            Clear Form
          </Button>
        </div>
      </form>
    </div>
  );
};

export default FunctionForm;
