"use client";

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Save, 
  Tag,
  Folder,
  Search,
  Filter
} from 'lucide-react';
import emailService from '../services/emailService';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  category: string;
  variables: string[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  templateCount: number;
}

export default function EmailTemplateManager() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Form state for new/edit template
  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    content: '',
    category: 'general',
    variables: [] as string[]
  });

  useEffect(() => {
    loadTemplates();
    loadCategories();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      // Mock data - in real app, this would come from your database
      const mockTemplates: EmailTemplate[] = [
        {
          id: '1',
          name: 'Lead Follow-up',
          subject: 'Thank you for your interest',
          content: 'Hi {{recipientName}},\n\nThank you for your interest in our properties. We have some great options that match your criteria.\n\nBest regards,\n{{senderName}}',
          category: 'lead-followup',
          variables: ['recipientName', 'senderName'],
          isDefault: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Property Showing Invitation',
          subject: 'Property showing invitation',
          content: 'Hi {{recipientName}},\n\nYou\'re invited to view {{propertyAddress}} on {{showingDate}} at {{showingTime}}.\n\nBest regards,\n{{senderName}}',
          category: 'property-showing',
          variables: ['recipientName', 'propertyAddress', 'showingDate', 'showingTime', 'senderName'],
          isDefault: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Market Update',
          subject: 'Market update for {{location}}',
          content: 'Hi {{recipientName}},\n\nHere\'s your market update for {{location}}. {{marketUpdate}}.\n\nBest regards,\n{{senderName}}',
          category: 'market-update',
          variables: ['recipientName', 'location', 'marketUpdate', 'senderName'],
          isDefault: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const mockCategories: TemplateCategory[] = [
        {
          id: 'lead-followup',
          name: 'Lead Follow-up',
          description: 'Templates for following up with leads',
          color: 'blue',
          templateCount: 1
        },
        {
          id: 'property-showing',
          name: 'Property Showing',
          description: 'Templates for property viewing invitations',
          color: 'green',
          templateCount: 1
        },
        {
          id: 'market-update',
          name: 'Market Update',
          description: 'Templates for market updates and insights',
          color: 'purple',
          templateCount: 1
        },
        {
          id: 'general',
          name: 'General',
          description: 'General purpose templates',
          color: 'gray',
          templateCount: 0
        },
        {
          id: 'custom',
          name: 'Custom',
          description: 'Custom templates created by users',
          color: 'orange',
          templateCount: 0
        }
      ];
      setCategories(mockCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleCreateTemplate = async () => {
    try {
      setLoading(true);
      
      const newTemplate: EmailTemplate = {
        id: Date.now().toString(),
        name: templateForm.name,
        subject: templateForm.subject,
        content: templateForm.content,
        category: templateForm.category,
        variables: templateForm.variables,
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setTemplates(prev => [...prev, newTemplate]);
      setShowTemplateForm(false);
      setTemplateForm({
        name: '',
        subject: '',
        content: '',
        category: 'general',
        variables: []
      });
      
      alert('✅ Template created successfully!');
    } catch (error) {
      console.error('Error creating template:', error);
      alert('❌ Error creating template');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setTemplateForm({
      name: template.name,
      subject: template.subject,
      content: template.content,
      category: template.category,
      variables: template.variables
    });
    setShowTemplateForm(true);
  };

  const handleUpdateTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      setLoading(true);
      
      const updatedTemplate: EmailTemplate = {
        ...selectedTemplate,
        name: templateForm.name,
        subject: templateForm.subject,
        content: templateForm.content,
        category: templateForm.category,
        variables: templateForm.variables,
        updatedAt: new Date().toISOString()
      };

      setTemplates(prev => prev.map(t => t.id === selectedTemplate.id ? updatedTemplate : t));
      setShowTemplateForm(false);
      setSelectedTemplate(null);
      setTemplateForm({
        name: '',
        subject: '',
        content: '',
        category: 'general',
        variables: []
      });
      
      alert('✅ Template updated successfully!');
    } catch (error) {
      console.error('Error updating template:', error);
      alert('❌ Error updating template');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      setTemplates(prev => prev.filter(t => t.id !== templateId));
    }
  };

  const extractVariables = (content: string): string[] => {
    const variableRegex = /\{\{(\w+)\}\}/g;
    const variables: string[] = [];
    let match;
    
    while ((match = variableRegex.exec(content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    
    return variables;
  };

  const handleContentChange = (content: string) => {
    setTemplateForm(prev => ({
      ...prev,
      content,
      variables: extractVariables(content)
    }));
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return 'bg-gray-100 text-gray-800';
    
    switch (category.color) {
      case 'blue':
        return 'bg-blue-100 text-blue-800';
      case 'green':
        return 'bg-green-100 text-green-800';
      case 'purple':
        return 'bg-purple-100 text-purple-800';
      case 'orange':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.subject.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-gray-900 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FileText className="h-6 w-6 text-blue-400 mr-3" />
          <h3 className="text-lg font-semibold text-white">Email Template Manager</h3>
        </div>
        <button
          onClick={() => setShowTemplateForm(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Categories</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name} ({category.templateCount})
            </option>
          ))}
        </select>
      </div>

      {/* Template Categories */}
      <div className="mb-6">
        <h4 className="text-white font-medium mb-3">Categories</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {categories.map(category => (
            <div
              key={category.id}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedCategory === category.id
                  ? 'border-blue-500 bg-blue-900 bg-opacity-20'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white text-sm">{category.name}</p>
                  <p className="text-gray-400 text-xs">{category.templateCount} templates</p>
                </div>
                <Folder className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Templates List */}
      <div className="space-y-4">
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-300">No templates found</p>
            <p className="text-sm text-gray-400 mt-2">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filter criteria' 
                : 'Create a template to get started'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <div key={template.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-white mb-1">{template.name}</h4>
                    <p className="text-sm text-gray-400 mb-2">{template.subject}</p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs ${getCategoryColor(template.category)}`}>
                      {categories.find(c => c.id === template.category)?.name || template.category}
                    </span>
                  </div>
                  {template.isDefault && (
                    <span className="inline-block px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      Default
                    </span>
                  )}
                </div>

                <div className="mb-3">
                  <p className="text-xs text-gray-400 mb-1">Variables:</p>
                  <div className="flex flex-wrap gap-1">
                    {template.variables.map((variable, index) => (
                      <span key={index} className="inline-block px-2 py-1 rounded text-xs bg-gray-700 text-gray-300">
                        {variable}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditTemplate(template)}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </button>
                  
                  <button className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors flex items-center">
                    <Eye className="h-3 w-3 mr-1" />
                    Preview
                  </button>
                  
                  {!template.isDefault && (
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Template Form Modal */}
      {showTemplateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center">
                <FileText className="h-6 w-6 text-blue-400 mr-3" />
                <h2 className="text-xl font-bold text-white">
                  {selectedTemplate ? 'Edit Template' : 'Create New Template'}
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowTemplateForm(false);
                  setSelectedTemplate(null);
                  setTemplateForm({
                    name: '',
                    subject: '',
                    content: '',
                    category: 'general',
                    variables: []
                  });
                }}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Template Name</label>
                  <input
                    type="text"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter template name..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                  <select
                    value={templateForm.category}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Subject Line</label>
                <input
                  type="text"
                  value={templateForm.subject}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email subject..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Content</label>
                <textarea
                  value={templateForm.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email content... Use {{variableName}} for dynamic content"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Use {'{{variableName}}'} syntax for dynamic content. Variables will be automatically detected.
                </p>
              </div>

              {templateForm.variables.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Detected Variables</label>
                  <div className="flex flex-wrap gap-2">
                    {templateForm.variables.map((variable, index) => (
                      <span key={index} className="inline-block px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                        {variable}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-700">
              <button
                onClick={() => {
                  setShowTemplateForm(false);
                  setSelectedTemplate(null);
                  setTemplateForm({
                    name: '',
                    subject: '',
                    content: '',
                    category: 'general',
                    variables: []
                  });
                }}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={selectedTemplate ? handleUpdateTemplate : handleCreateTemplate}
                disabled={loading || !templateForm.name.trim() || !templateForm.subject.trim() || !templateForm.content.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : (selectedTemplate ? 'Update Template' : 'Create Template')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 