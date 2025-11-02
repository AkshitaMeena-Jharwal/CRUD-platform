import React, { useState, useEffect } from 'react'
import './ModelBuilder.css'

const fieldTypes = ['string', 'number', 'boolean', 'date', 'text']
const roles = ['Admin', 'Manager', 'Viewer']
const permissions = ['create', 'read', 'update', 'delete', 'all']

const ModelBuilder = ({ token }) => {
  const [model, setModel] = useState({
    name: '',
    fields: [],
    rbac: {
      Admin: ['all'],
      Manager: ['create', 'read', 'update'],
      Viewer: ['read']
    }
  })

  const [models, setModels] = useState([])
  const [selectedModel, setSelectedModel] = useState(null)
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchModels()
  }, [])

  const fetchModels = async () => {
    try {
      const response = await fetch('/api/models', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setModels(data)
      }
    } catch (error) {
      console.error('Error fetching models:', error)
    }
  }

  const addField = () => {
    setModel(prev => ({
      ...prev,
      fields: [
        ...prev.fields,
        { name: '', type: 'string', required: false, unique: false }
      ]
    }))
  }

  const updateField = (index, updates) => {
    setModel(prev => ({
      ...prev,
      fields: prev.fields.map((field, i) => 
        i === index ? { ...field, ...updates } : field
      )
    }))
  }

  const removeField = (index) => {
    setModel(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }))
  }

  const updatePermission = (role, permission, checked) => {
    setModel(prev => ({
      ...prev,
      rbac: {
        ...prev.rbac,
        [role]: checked 
          ? [...(prev.rbac[role] || []), permission]
          : (prev.rbac[role] || []).filter(p => p !== permission)
      }
    }))
  }

  const publishModel = async () => {
    if (!model.name || model.fields.length === 0) {
      alert('Please provide a model name and at least one field')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(model)
      })

      if (response.ok) {
        alert('Model published successfully!')
        setModel({
          name: '',
          fields: [],
          rbac: {
            Admin: ['all'],
            Manager: ['create', 'read', 'update'],
            Viewer: ['read']
          }
        })
        fetchModels()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      alert('Error publishing model')
    } finally {
      setLoading(false)
    }
  }

  const fetchRecords = async (modelName) => {
    try {
      const response = await fetch(`/api/${modelName}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setRecords(data)
      }
    } catch (error) {
      console.error('Error fetching records:', error)
      setRecords([])
    }
  }

  const handleModelSelect = (model) => {
    setSelectedModel(model)
    fetchRecords(model.name)
  }

  const createRecord = async (modelName, data) => {
    try {
      const response = await fetch(`/api/${modelName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })
      if (response.ok) {
        const newRecord = await response.json()
        setRecords(prev => [...prev, newRecord])
        return true
      }
    } catch (error) {
      console.error('Error creating record:', error)
    }
    return false
  }

  return (
    <div className="model-builder">
      <div className="builder-section">
        <h2>Create New Model</h2>
        
        <div className="form-group">
          <label>Model Name:</label>
          <input
            type="text"
            value={model.name}
            onChange={e => setModel(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Product, Employee"
          />
        </div>

        <div className="form-group">
          <label>Owner Field (optional):</label>
          <input
            type="text"
            value={model.ownerField || ''}
            onChange={e => setModel(prev => ({ ...prev, ownerField: e.target.value }))}
            placeholder="e.g., ownerId"
          />
        </div>

        <h3>Fields</h3>
        {model.fields.map((field, index) => (
          <div key={index} className="field-editor">
            <input
              type="text"
              placeholder="Field name"
              value={field.name}
              onChange={e => updateField(index, { name: e.target.value })}
            />
            
            <select
              value={field.type}
              onChange={e => updateField(index, { type: e.target.value })}
            >
              {fieldTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={field.required}
                onChange={e => updateField(index, { required: e.target.checked })}
              />
              Required
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={field.unique || false}
                onChange={e => updateField(index, { unique: e.target.checked })}
              />
              Unique
            </label>

            <button 
              type="button" 
              onClick={() => removeField(index)}
              className="remove-btn"
            >
              Remove
            </button>
          </div>
        ))}
        
        <button type="button" onClick={addField} className="add-field-btn">
          Add Field
        </button>

        <h3>RBAC Permissions</h3>
        <div className="rbac-editor">
          {roles.map(role => (
            <div key={role} className="role-permissions">
              <h4>{role}</h4>
              {permissions.map(permission => (
                <label key={permission} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={model.rbac[role]?.includes(permission) || false}
                    onChange={e => updatePermission(role, permission, e.target.checked)}
                  />
                  {permission}
                </label>
              ))}
            </div>
          ))}
        </div>

        <button 
          type="button" 
          onClick={publishModel}
          disabled={loading || !model.name || model.fields.length === 0}
          className="publish-btn"
        >
          {loading ? 'Publishing...' : 'Publish Model'}
        </button>
      </div>

      <div className="models-section">
        <h2>Published Models</h2>
        <div className="models-list">
          {models.map(model => (
            <div 
              key={model.name} 
              className={`model-item ${selectedModel?.name === model.name ? 'selected' : ''}`}
              onClick={() => handleModelSelect(model)}
            >
              <div className="model-header">
                <strong>{model.name}</strong>
                <span>{model.fields.length} fields</span>
              </div>
              <div className="model-fields">
                {model.fields.slice(0, 3).map(field => (
                  <span key={field.name} className="field-tag">
                    {field.name} ({field.type})
                  </span>
                ))}
                {model.fields.length > 3 && (
                  <span className="field-tag">+{model.fields.length - 3} more</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {selectedModel && (
          <div className="records-section">
            <h3>Manage {selectedModel.name} Records</h3>
            <RecordManager 
              model={selectedModel} 
              records={records}
              onCreateRecord={(data) => createRecord(selectedModel.name, data)}
              onRefresh={() => fetchRecords(selectedModel.name)}
            />
          </div>
        )}
      </div>
    </div>
  )
}

const RecordManager = ({ model, records, onCreateRecord, onRefresh }) => {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({})

  const handleSubmit = async (e) => {
    e.preventDefault()
    const success = await onCreateRecord(formData)
    if (success) {
      setShowForm(false)
      setFormData({})
      onRefresh()
    }
  }

  const handleChange = (fieldName, value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }))
  }

  return (
    <div className="record-manager">
      <div className="record-header">
        <button onClick={() => setShowForm(!showForm)} className="add-record-btn">
          Add New Record
        </button>
        <button onClick={onRefresh} className="refresh-btn">
          Refresh
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="record-form">
          <h4>Add New Record</h4>
          {model.fields.map(field => (
            <div key={field.name} className="form-group">
              <label>
                {field.name} {field.required && '*'}
              </label>
              {field.type === 'boolean' ? (
                <input
                  type="checkbox"
                  checked={!!formData[field.name]}
                  onChange={e => handleChange(field.name, e.target.checked)}
                  required={field.required}
                />
              ) : field.type === 'text' ? (
                <textarea
                  value={formData[field.name] || ''}
                  onChange={e => handleChange(field.name, e.target.value)}
                  required={field.required}
                />
              ) : (
                <input
                  type={field.type === 'number' ? 'number' : 'text'}
                  value={formData[field.name] || ''}
                  onChange={e => handleChange(field.name, e.target.value)}
                  required={field.required}
                />
              )}
            </div>
          ))}
          <button type="submit">Create Record</button>
          <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
        </form>
      )}

      <div className="records-list">
        <h4>Records ({records.length})</h4>
        {records.length === 0 ? (
          <p className="no-records">No records found.</p>
        ) : (
          <div className="records-table">
            <table>
              <thead>
                <tr>
                  {model.fields.map(field => (
                    <th key={field.name}>{field.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((record, index) => (
                  <tr key={index}>
                    {model.fields.map(field => (
                      <td key={field.name}>
                        {String(record[field.name] || '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default ModelBuilder