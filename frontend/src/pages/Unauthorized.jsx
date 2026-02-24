// unauthorized page

import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', gap: '20px' }}>
      <h1 style={{ fontSize: '72px', margin: 0 }}>403</h1>
      <h2>unauthorized access</h2>
      <p style={{ color: 'var(--text-light)' }}>you don't have permission to access this page</p>
      <Link to="/" className="btn btn-primary">go to home</Link>
    </div>
  );
};

export default Unauthorized;
