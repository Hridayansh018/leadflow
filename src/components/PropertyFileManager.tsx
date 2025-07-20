"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
// TODO: Replace all databaseService usage with real property file data fetching from Supabase or propertyFileService.
import { showSuccess, showError, showConfirmation } from '../utils/toastUtils';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";

interface PropertyFileManagerProps {
  selectedPropertyFileId: string;
  onPropertyFileChange: (propertyFileId: string) => void;
}

export default function PropertyFileManager({ selectedPropertyFileId, onPropertyFileChange }: PropertyFileManagerProps) {
  const [propertyFiles, setPropertyFiles] = useState<any[]>([]); // Changed type to any[] as PropertyFile is removed
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    content: string;
    properties: Array<{
      id: string;
      name: string;
      address: string;
      price: string;
      bedrooms: number;
      bathrooms: number;
      type: 'residential' | 'commercial' | 'land';
      status: 'available' | 'sold' | 'pending' | 'off-market';
    }>;
  }>({
    name: '',
    description: '',
    content: '',
    properties: [
      {
        id: '',
        name: '',
        address: '',
        price: '',
        bedrooms: 0,
        bathrooms: 0,
        type: 'residential' as const,
        status: 'available' as const
      }
    ]
  });

  const loadPropertyFiles = useCallback(async () => {
    try {
      // TODO: Fetch property files from Supabase
      setPropertyFiles([]); // Placeholder
      
      // Set default selection if none selected
      if (!selectedPropertyFileId && propertyFiles.length > 0 && propertyFiles[0].id) {
        onPropertyFileChange(propertyFiles[0].id);
      }
    } catch (error) {
      console.error('Error loading property files:', error);
    }
  }, [selectedPropertyFileId, onPropertyFileChange, propertyFiles]);

  useEffect(() => {
    loadPropertyFiles();
  }, [loadPropertyFiles]);

  const handleCreate = () => {
    setIsCreating(true);
    setFormData({
      name: '',
      description: '',
      content: '',
      properties: [
        {
          id: Date.now().toString(),
          name: '',
          address: '',
          price: '',
          bedrooms: 0,
          bathrooms: 0,
          type: 'residential' as const,
          status: 'available' as const
        }
      ]
    });
  };

  const handleEdit = (pf: any) => { // Changed type to any
    if (pf.id) {
      setIsEditing(pf.id);
      setFormData({
        name: pf.name,
        description: pf.description,
        content: pf.content,
        properties: pf.properties
      });
    }
  };

  const handleSave = async () => {
    try {
      if (isCreating) {
        // TODO: Create property file in Supabase
        showSuccess('Property file created successfully (placeholder)');
        setIsCreating(false);
      } else if (isEditing) {
        // TODO: Update property file in Supabase
        showSuccess('Property file updated successfully (placeholder)');
        setIsEditing(null);
      }
      
      setFormData({
        name: '',
        description: '',
        content: '',
        properties: []
      });
      await loadPropertyFiles();
    } catch (error) {
      console.error('Error saving property file:', error);
      showError('Error saving property file');
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setIsEditing(null);
    setFormData({
      name: '',
      description: '',
      content: '',
      properties: []
    });
  };

  const handleDelete = async (id: string) => {
    showConfirmation(
      'Are you sure you want to delete this property file?',
      async () => {
      try {
        // TODO: Delete property file in Supabase
        showSuccess('Property file deleted successfully (placeholder)');
        await loadPropertyFiles();
        
        // If deleted item was selected, select first available
        if (selectedPropertyFileId === id) {
          const remaining = propertyFiles.filter(pf => pf.id !== id);
          if (remaining.length > 0 && remaining[0].id) {
            onPropertyFileChange(remaining[0].id);
          } else {
            onPropertyFileChange('');
          }
        }
          showSuccess('Property file deleted successfully');
      } catch (error) {
        console.error('Error deleting property file:', error);
          showError('Error deleting property file');
        }
      }
    );
  };

  const addProperty = () => {
    setFormData({
      ...formData,
      properties: [
        ...formData.properties,
        {
          id: Date.now().toString(),
          name: '',
          address: '',
          price: '',
          bedrooms: 0,
          bathrooms: 0,
          type: 'residential' as const,
          status: 'available' as const
        }
      ]
    });
  };

  const updateProperty = (index: number, field: string, value: string | number) => {
    const updatedProperties = [...formData.properties];
    updatedProperties[index] = {
      ...updatedProperties[index],
      [field]: value
    };
    setFormData({
      ...formData,
      properties: updatedProperties
    });
  };

  const removeProperty = (index: number) => {
    const updatedProperties = formData.properties.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      properties: updatedProperties
    });
  };

  const selectedPropertyFile = propertyFiles.find(pf => pf.id === selectedPropertyFileId);

  return (
    <Card>
      <CardHeader className="flex items-center justify-between mb-4">
        <CardTitle className="text-lg font-semibold text-gray-900">Property Files</CardTitle>
        <Button
          onClick={handleCreate}
          variant="secondary"
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          Add Property File
        </Button>
      </CardHeader>
      <CardContent>
        {/* Property File Dropdown */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Property File
          </label>
          <select
            value={selectedPropertyFileId}
            onChange={(e) => onPropertyFileChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a property file</option>
            {propertyFiles.map((pf) => (
              <option key={pf.id} value={pf.id}>
                {pf.name}
              </option>
            ))}
          </select>
        </div>

        {/* Selected Property File Details */}
        {selectedPropertyFile && (
          <div className="mb-4 p-4 bg-gray-50 rounded-md">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">{selectedPropertyFile.name}</h4>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleEdit(selectedPropertyFile)}
                  variant="ghost"
                  className="p-1 text-blue-600 hover:text-blue-800"
                >
                  <Edit size={16} />
                </Button>
                <Button
                  onClick={() => selectedPropertyFile.id && handleDelete(selectedPropertyFile.id)}
                  variant="ghost"
                  className="p-1 text-red-600 hover:text-red-800"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-2">{selectedPropertyFile.description}</p>
            <div className="text-xs text-gray-500">
              Properties: {selectedPropertyFile.properties.length} | Content: {selectedPropertyFile.content.length} characters
            </div>
          </div>
        )}

        {/* Create/Edit Form */}
        {(isCreating || isEditing) && (
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-3">
              {isCreating ? 'Create New Property File' : 'Edit Property File'}
            </h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter property file name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter description"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter property file content"
                />
              </div>

              {/* Properties Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Properties
                  </label>
                  <Button
                    onClick={addProperty}
                    variant="outline"
                    className="flex items-center gap-1 px-2 py-1 text-sm"
                  >
                    <Plus size={14} />
                    Add Property
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {formData.properties.map((property, index) => (
                    <div key={property.id} className="p-3 border border-gray-200 rounded-md">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-sm">Property {index + 1}</h5>
                        <Button
                          onClick={() => removeProperty(index)}
                          variant="ghost"
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-600">Name</label>
                          <Input
                            type="text"
                            value={property.name}
                            onChange={(e) => updateProperty(index, 'name', e.target.value)}
                            placeholder="Property name"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-600">Address</label>
                          <Input
                            type="text"
                            value={property.address}
                            onChange={(e) => updateProperty(index, 'address', e.target.value)}
                            placeholder="Property address"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-600">Price</label>
                          <Input
                            type="text"
                            value={property.price}
                            onChange={(e) => updateProperty(index, 'price', e.target.value)}
                            placeholder="$500,000"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-600">Type</label>
                          <select
                            value={property.type}
                            onChange={(e) => updateProperty(index, 'type', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          >
                            <option value="residential">Residential</option>
                            <option value="commercial">Commercial</option>
                            <option value="land">Land</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-600">Bedrooms</label>
                          <Input
                            type="number"
                            value={property.bedrooms}
                            onChange={(e) => updateProperty(index, 'bedrooms', parseInt(e.target.value) || 0)}
                            min="0"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-600">Bathrooms</label>
                          <Input
                            type="number"
                            value={property.bathrooms}
                            onChange={(e) => updateProperty(index, 'bathrooms', parseInt(e.target.value) || 0)}
                            min="0"
                          />
                        </div>
                        
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-600">Status</label>
                          <select
                            value={property.status}
                            onChange={(e) => updateProperty(index, 'status', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          >
                            <option value="available">Available</option>
                            <option value="sold">Sold</option>
                            <option value="pending">Pending</option>
                            <option value="off-market">Off Market</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={!formData.name.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={16} />
                  Save
                </Button>
                <Button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  <X size={16} />
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 