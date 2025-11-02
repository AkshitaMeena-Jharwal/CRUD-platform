import React, { useState, useEffect } from 'react';
import { ModelDefinition } from '../types';

interface DataManagerProps {
  model: ModelDefinition;
}

export const DataManager: React.FC<DataManagerProps> = ({ model }) => {
  const [records, setRecords] = useState<any[]>([]);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, [model.name]);

  const fetchRecords = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`/api/${model.name.toLowerCase()}`, {
        headers: { 
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });
      if (response.ok) {
        const data = await response.json();
        setRecords(data);
      } else {
        console.error('Error fetching records');
      }
    } catch (error) {
      console.error('Error fetching records:', error);
    }
  };

  const handleSubmit = async (data: any) => {
    const token = localStorage.getItem('token');
    const url = `/api/${model.name.toLowerCase()}`;
    
    try {
      if (editingRecord) {
        await fetch(`${url}/${editingRecord.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          },
          body: JSON.stringify(data)
        });
      } else {
        await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          },
          body: JSON.stringify(data)
        });
      }
      
      setShowForm(false);
      setEditingRecord(null);
      fetchRecords();
    } catch (error) {
      alert('Error saving record');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    
    const token = localStorage.getItem('token');
    try {
      await fetch(`/api/${model.name.toLowerCase()}/${id}`, {
        method: 'DELETE',
        headers: { 
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });
      fetchRecords();
    } catch (error) {
      alert('Error deleting record');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Manage {model.name}</h2>
        <button 
          onClick={() => setShowForm(true)}
          style={{
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            padding: '10px 15px',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Add New
        </button>
      </div>

      {showForm && (
        <RecordForm
          model={model}
          record={editingRecord}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingRecord(null);
          }}
        />
      )}

      {records.length === 0 ? (
        <p>No records found.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                {model.fields.map(field =>