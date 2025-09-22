import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import FormInput from './FormInput';
import Button from '../buttons/Button';
import { functionAPI, FUNCTION_TYPES, SOURCE_TYPES, EVENT_TYPES, STATUS_TYPES } from '../../services/api';

const FunctionEditForm = ({ functionData }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    reset,
    setValue
  } = useForm({
    // Use the functionData prop to set the form's default values
    defaultValues: {
      name: functionData?.name || '',
      type: functionData?.type || '',
      source: functionData?.source || '',
      event_type: functionData?.event_type || '',
      status: functionData?.status || '',
      redis_host: functionData?.redis_host || '',
      redis_queue_name: functionData?.redis_queue_name || ''
    }
  });

  const functionType = watch('type');
  const eventType = watch('event_type');

  // Automatically adjust source type if function type changes
  useEffect(() => {
    if (functionType === 'IMAGE') {
      setValue('source', 'STORAGE', { shouldDirty: true }); // Or DOCKER if you add it to SOURCE_TYPES
    }
  }, [functionType, setValue]);

  // ** CORRECTED onSubmit LOGIC **
  const onSubmit = async (data) => {
    setLoading(true);
    setSubmitError('');

    // Prepare the payload with only the fields that can be edited.
    // This form should only update metadata. File updates are handled by the
    // "Update & Redeploy" button on the main list.
    const updatePayload = {
      name: data.name,
      type: data.type,
      source: data.source,
      event_type: data.event_type,
      status: data.status, // Note: letting users change status might be risky
      redis_host: data.redis_host,
      redis_queue_name: data.redis_queue_name,
    };

    try {
      // Call the correct 'update' API endpoint with the function's ID
      await functionAPI.update(functionData.id, updatePayload);
      alert(`Function "${data.name}" updated successfully!`);
      navigate('/'); // Go back to the list page
    } catch (error) {
      console.error('Failed to update function:', error);
      setSubmitError(
        error.response?.data?.detail || 'Failed to update function. Please try again.'
      );
    } finally {
      setLoading(false);
    }
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
          <legend>Edit Function: {functionData?.name}</legend>

          <FormInput
            label="Function Name"
            name="name"
            register={register}
            errors={errors}
            required
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
          
          <div className="form-row">
            <FormInput
              label="Event Type"
              name="event_type"
              type="select"
              register={register}
              errors={errors}
              required
              options={EVENT_TYPES}
            />
            <FormInput
              label="Status"
              name="status"
              type="select"
              register={register}
              errors={errors}
              required
              options={STATUS_TYPES}
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
              />
              <FormInput
                label="Redis Queue Name"
                name="redis_queue_name"
                register={register}
                errors={errors}
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
            Save Changes
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/')}>
            Cancel
          </Button>
          <Button type="button" variant="outline" onClick={() => reset()} disabled={!isDirty}>
            Reset
          </Button>
        </div>
      </form>
    </div>
  );
};

export default FunctionEditForm;