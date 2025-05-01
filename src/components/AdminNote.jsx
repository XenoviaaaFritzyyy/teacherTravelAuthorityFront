import React from 'react';
import './AdminNote.css';

const AdminNote = ({ message }) => {
  return (
    <div className="admin-note-wrapper">
      <div className="admin-note-content">
        <p>{message}</p>
      </div>
    </div>
  );
};

export default AdminNote;
