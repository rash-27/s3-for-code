import React from 'react';
import { Link } from 'react-router-dom';
import FunctionForm from '../forms/FunctionForm';

const CreateFunction = () => {
  return (
    <div className="create-function-page">
      <header className="page-header">
        <h1>Create New Function</h1>
        <nav>
          <Link to="/" className="btn btn-outline">
            ← Back to Functions
          </Link>
        </nav>
      </header>

      <main>
        <FunctionForm />
      </main>
    </div>
  );
};

export default CreateFunction;
