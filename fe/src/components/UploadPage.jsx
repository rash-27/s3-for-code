import React, { useState } from 'react';

export default function UploadPage() {
  const [functionName, setFunctionName] = useState('');
  const [uploadType, setUploadType] = useState('file');
  const [eventType, setEventType] = useState('https');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const validFileTypes = uploadType === 'file' 
      ? ['application/javascript', 'text/plain']
      : ['application/x-tar', 'application/octet-stream'];

    if (!validFileTypes.includes(selectedFile.type)) {
      setError('Invalid file type for selected upload type');
      setFile(null);
    } else {
      setError('');
      setFile(selectedFile);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!functionName || !file) {
      setError('Please fill all fields and upload a valid file');
      return;
    }

    const formData = new FormData();
    formData.append('functionName', functionName);
    formData.append('uploadType', uploadType);
    formData.append('eventType', eventType);
    formData.append('file', file);

    console.log('Submitting:', { functionName, uploadType, eventType, file });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white space-y-6 p-4">
      <h1 className="text-3xl font-bold">Upload Function</h1>

      <form className="flex flex-col space-y-4 w-full max-w-md" onSubmit={handleSubmit}>
        <label>
          Function Name:
          <input
            type="text"
            className="w-full p-2 text-black rounded bg-white"
            value={functionName}
            onChange={(e) => setFunctionName(e.target.value)}
            required
          />
        </label>

        <label>
          Upload Type:
          <select
            className="w-full p-2 text-black rounded bg-white"
            value={uploadType}
            onChange={(e) => setUploadType(e.target.value)}
          >
            <option value="file">Direct File</option>
            <option value="image">Docker Image</option>
          </select>
        </label>

        <label>
          Event Type:
          <select
            className="w-full p-2 text-black rounded bg-white"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
          >
            <option value="https">HTTPS</option>
            <option value="event-driven">Event Driven</option>
          </select>
        </label>

        <label>
          Upload File:
          <input
            type="file"
            className="w-full p-2 text-black rounded bg-white"
            onChange={handleFileChange}
            required
          />
        </label>

        {error && <p className="text-red-500">{error}</p>}

        <button
          type="submit"
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Submit
        </button>
      </form>
    </div>
  );
}
