// 404 not found page

import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', gap: '20px' }}>
      <h1 style={{ fontSize: '72px', margin: 0 }}>404</h1>
      <h2>page not found</h2>
      <p style={{ color: 'var(--text-light)' }}>the page you're looking for doesn't exist</p>
      <Link to="/" className="btn btn-primary">go to home</Link>
    </div>
  );
};

export default NotFound;
