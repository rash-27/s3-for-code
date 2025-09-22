import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function types and enums
export const FUNCTION_TYPES = ['FUNCTION', 'IMAGE'];
export const SOURCE_TYPES = ['GITHUB', 'STORAGE'];  // <-- Added 'DOCKER'
export const EVENT_TYPES = ['HTTP', 'QUEUE_EVENT'];
export const STATUS_TYPES = ['PENDING', 'DEPLOYED'];

// API endpoints
export const functionAPI = {
  getAll: () => API.get('/functions/'),
  getById: (id) => API.get(`/functions/${id}`),
  // create: (data) => API.post('/upload_function/', data),
  // delete: (id) => API.delete(`/functions/${id}`),
  startDeploy: (id) => API.post(`/deploy_function/${id}`),
  stopDeploy: (id) => API.post(`/undeploy_function/${id}`),
  getLogs: (id) => API.get(`/functions/${id}/logs`),
  // uploadFile: (file) => {
  //   const formData = new FormData();
  //   formData.append('file', file);
  //   return API.post('/upload_function/', formData, {
  //     headers: {
  //       'Content-Type': 'multipart/form-data',
  //     },
  //   });
  create: (formData) => {
    return API.post('/upload_function/', formData, {
      headers: {
        // Let the browser set the Content-Type header with the correct boundary
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  // The backend uses 'undeploy_function' for deletion
  delete: (id) => API.post(`/undeploy_function/${id}`, {function_id : id}, 
{
        headers: {
        // Let the browser set the Content-Type header with the correct boundary
        'Content-Type': 'multipart/form-data',
      },
}
  ), 
  
  // Corrected getLogs endpoint
  getLogs: (id) => API.get(`/logs/${id}`),
};

export default API;

