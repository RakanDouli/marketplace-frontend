'use client';

import React from 'react';
import { useAdminAuthStore } from '../../../stores/adminAuthStore';

export default function AdminDashboard() {
  const { user } = useAdminAuthStore();

  return (
    <div>
      <div style={{marginBottom: '30px'}}>
        <h1 style={{margin: '0 0 5px 0', fontSize: '28px', color: '#333'}}>Dashboard</h1>
        <p style={{margin: 0, color: '#666', fontSize: '16px'}}>
          Welcome back, {user?.name || 'Admin'}! Here's what's happening with your marketplace.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <h3 style={{margin: '0 0 10px 0', color: '#495057'}}>Users</h3>
          <p style={{margin: '0', fontSize: '24px', fontWeight: 'bold', color: '#007bff'}}>1,234</p>
          <small style={{color: '#6c757d'}}>+12% from last month</small>
        </div>

        <div style={{
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <h3 style={{margin: '0 0 10px 0', color: '#495057'}}>Listings</h3>
          <p style={{margin: '0', fontSize: '24px', fontWeight: 'bold', color: '#28a745'}}>567</p>
          <small style={{color: '#6c757d'}}>+8% from last month</small>
        </div>

        <div style={{
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <h3 style={{margin: '0 0 10px 0', color: '#495057'}}>Revenue</h3>
          <p style={{margin: '0', fontSize: '24px', fontWeight: 'bold', color: '#ffc107'}}>$12.5K</p>
          <small style={{color: '#6c757d'}}>+15% from last month</small>
        </div>
      </div>

      <div style={{
        padding: '20px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        border: '1px solid #dee2e6'
      }}>
        <h2 style={{margin: '0 0 15px 0'}}>User Information</h2>
        <div style={{fontSize: '14px', color: '#6c757d'}}>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Role:</strong> {user?.role}</p>
          <p><strong>Permissions:</strong></p>
          <ul style={{marginLeft: '20px'}}>
            {user?.permissions.map((permission, index) => (
              <li key={index}>{permission}</li>
            ))}
          </ul>
        </div>
      </div>

      <div style={{
        marginTop: '30px',
        padding: '15px',
        backgroundColor: '#d4edda',
        border: '1px solid #c3e6cb',
        borderRadius: '4px',
        color: '#155724'
      }}>
        <strong>🎉 Success!</strong> Admin login is working! You can now access the admin dashboard.
      </div>
    </div>
  );
}