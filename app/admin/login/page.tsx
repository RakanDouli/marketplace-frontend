'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuthStore } from '../../../stores/adminAuthStore';

// Predefined credential options from backend
const CREDENTIAL_OPTIONS = [
  {
    name: 'Super Admin',
    role: 'SUPER_ADMIN',
    email: 'superadmin@marketplace.com',
    password: 'SuperAdmin123!'
  },
  {
    name: 'Admin',
    role: 'ADMIN',
    email: 'admin@marketplace.com',
    password: 'Admin123!'
  },
  {
    name: 'Editor',
    role: 'EDITOR',
    email: 'editor@marketplace.com',
    password: 'Editor123!'
  },
  {
    name: 'Ads Manager',
    role: 'ADS_MANAGER',
    email: 'adsmanager@marketplace.com',
    password: 'AdsManager123!'
  },
  {
    name: 'User 1',
    role: 'USER',
    email: 'user@marketplace.com',
    password: 'User123!'
  },
  {
    name: 'User 2',
    role: 'USER',
    email: 'user2@marketplace.com',
    password: 'User123!'
  },
  {
    name: 'Custom Login',
    role: 'CUSTOM',
    email: '',
    password: ''
  }
];

export default function AdminLogin() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading, error, clearError } = useAdminAuthStore();
  const [selectedOption, setSelectedOption] = useState(0);
  const [formData, setFormData] = useState({
    email: CREDENTIAL_OPTIONS[0].email,
    password: CREDENTIAL_OPTIONS[0].password
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/admin/dashboard');
    }
  }, [isAuthenticated, router]);

  // Update form when option changes
  useEffect(() => {
    const option = CREDENTIAL_OPTIONS[selectedOption];
    setFormData({
      email: option.email,
      password: option.password
    });
    if (error) clearError();
  }, [selectedOption, error, clearError]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(formData.email, formData.password);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div style={{padding: '20px', maxWidth: '400px', margin: '0 auto'}}>
      <h1 style={{textAlign: 'center', marginBottom: '20px'}}>Admin Login</h1>

      {/* Credential Selector */}
      <div style={{marginBottom: '20px'}}>
        <label style={{display: 'block', marginBottom: '8px', fontWeight: 'bold'}}>
          Quick Login Options:
        </label>
        <select
          value={selectedOption}
          onChange={(e) => setSelectedOption(Number(e.target.value))}
          style={{
            width: '100%',
            padding: '10px',
            marginBottom: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        >
          {CREDENTIAL_OPTIONS.map((option, index) => (
            <option key={index} value={index}>
              {option.role === 'CUSTOM' ? option.name : `${option.name} (${option.role})`}
            </option>
          ))}
        </select>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{
            padding: '10px',
            marginBottom: '15px',
            backgroundColor: '#fee',
            color: '#c33',
            border: '1px solid #fcc',
            borderRadius: '4px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleInputChange}
          required
          disabled={isLoading}
          style={{
            width: '100%',
            display: 'block',
            margin: '10px 0',
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '16px'
          }}
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleInputChange}
          required
          disabled={isLoading}
          style={{
            width: '100%',
            display: 'block',
            margin: '10px 0',
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '16px'
          }}
        />

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '12px 20px',
            backgroundColor: isLoading ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            marginTop: '10px'
          }}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      {/* Info */}
      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px',
        fontSize: '14px',
        color: '#6c757d'
      }}>
        <p style={{margin: '0 0 10px 0'}}><strong>Available Backend Users:</strong></p>
        <ul style={{margin: 0, paddingLeft: '20px'}}>
          <li><strong>Super Admin</strong> - Full system access</li>
          <li><strong>Admin</strong> - Administrative privileges</li>
          <li><strong>Editor</strong> - Content management</li>
          <li><strong>Ads Manager</strong> - Advertisement management</li>
          <li><strong>User 1 & 2</strong> - Regular users</li>
          <li><strong>Custom Login</strong> - Enter any credentials</li>
        </ul>
        <p style={{margin: '10px 0 0 0', fontSize: '12px', fontStyle: 'italic'}}>
          All credentials are from your backend seed data
        </p>
      </div>
    </div>
  );
}