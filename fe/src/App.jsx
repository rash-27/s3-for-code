import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import FunctionList from './components/pages/FunctionList';
import CreateFunction from './components/pages/CreateFunction';
import EditFunction from './components/pages/EditFunction';
import FunctionLogs from './components/pages/FunctionLogs';
import './index.css';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<FunctionList />} />
        <Route path="/create" element={<CreateFunction />} />
        <Route path="/edit/:id" element={<EditFunction />} />
        <Route path="/logs/:id" element={<FunctionLogs />} />
      </Routes>
    </Layout>
  );
}

export default App;
