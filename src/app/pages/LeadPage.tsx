"use client";

import React, { useState, useEffect } from 'react';
import { Search, Edit, Trash2, Phone, Mail, Calendar } from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import leadService, { Lead } from '../../services/leadService';
import { showSuccess, showError } from '../../utils/toastUtils';
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";

interface LeadPageProps {
  onNavigate: (route: string) => void;
}

export default function LeadPage({ onNavigate }: LeadPageProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Lead>>({});

  useEffect(() => {
    loadLeads();
  }, [statusFilter]);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const response = await leadService.getLeads({
        status: statusFilter || undefined
      });
      setLeads(response.leads);
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead);
    setEditForm(lead);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedLead?.id) return;
    
    try {
      await leadService.updateLead(selectedLead.id, editForm);
      setIsEditing(false);
      setSelectedLead(null);
      setEditForm({});
      await loadLeads();
    } catch (error) {
      console.error('Error updating lead:', error);
        showError('Error updating lead');
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    
    try {
      await leadService.deleteLead(id);
      await loadLeads();
    } catch (error) {
      console.error('Error deleting lead:', error);
        showError('Error deleting lead');
    }
  };

  const filteredLeads = leads.filter(lead =>
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone.includes(searchTerm)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'qualified': return 'bg-purple-100 text-purple-800';
      case 'converted': return 'bg-green-100 text-green-800';
      case 'lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Header onNavigate={onNavigate} currentRoute="leads" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-8 bg-[var(--card)] text-[var(--card-foreground)]">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Lead Management</CardTitle>
            <p className="text-[var(--muted-foreground)]">Manage and track your real estate leads</p>
          </CardHeader>
          <CardContent>
            {/* Search and Filters */}
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  type="text"
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 bg-[var(--input)] border border-[var(--border)] rounded-md text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                >
                  <option value="">All Statuses</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="converted">Converted</option>
                  <option value="lost">Lost</option>
                </select>
                <Button onClick={loadLeads} variant="outline">Refresh</Button>
              </div>
            </div>
            {/* Leads Table */}
            <Card className="bg-[var(--muted)] rounded-lg border-[var(--border)] overflow-hidden">
              <CardHeader className="px-6 py-4 border-b border-[var(--border)]">
                <CardTitle className="text-xl font-semibold">
                  Leads ({filteredLeads.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
                    <span className="ml-2 text-[var(--muted-foreground)]">Loading leads...</span>
                  </div>
                ) : filteredLeads.length === 0 ? (
                  <div className="text-center py-8 text-[var(--muted-foreground)]">
                    <p>No leads found</p>
                    <p className="text-sm mt-2">Add leads manually to get started</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-[var(--muted-foreground)]">
                      <thead className="text-xs uppercase bg-[var(--muted)]">
                        <tr>
                          <th className="px-6 py-3">Name</th>
                          <th className="px-6 py-3">Contact</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3">Notes</th>
                          <th className="px-6 py-3">Created</th>
                          <th className="px-6 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLeads.map((lead) => (
                          <tr key={lead.id} className="bg-[var(--muted)] border-b border-[var(--border)] hover:bg-[var(--input)]">
                            <td className="px-6 py-4 font-medium text-[var(--foreground)]">
                              {lead.name}
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <div className="flex items-center text-[var(--muted-foreground)]">
                                  <Mail className="h-4 w-4 mr-2" />
                                  {lead.email}
                                </div>
                                <div className="flex items-center text-[var(--muted-foreground)]">
                                  <Phone className="h-4 w-4 mr-2" />
                                  {lead.phone}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(lead.status)}`}>
                                {lead.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-[var(--muted-foreground)]">
                              {lead.notes || '-'}
                            </td>
                            <td className="px-6 py-4 text-[var(--muted-foreground)]">
                              {lead.created_at ? formatDate(lead.created_at) : '-'}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex space-x-2">
                                <Button onClick={() => handleEditLead(lead)} variant="outline" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button onClick={() => handleDeleteLead(lead.id!)} variant="destructive" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
            {/* Edit Modal */}
            <Dialog open={isEditing && !!selectedLead} onOpenChange={() => { setIsEditing(false); setSelectedLead(null); setEditForm({}); }}>
              <DialogContent className="max-w-md bg-[var(--card)] text-[var(--card-foreground)]">
                <DialogHeader>
                  <DialogTitle>Edit Lead</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <Input
                      type="text"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <Input
                      type="email"
                      value={editForm.email || ''}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <Input
                      type="tel"
                      value={editForm.phone || ''}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      value={editForm.status || ''}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                      className="w-full px-3 py-2 bg-[var(--input)] border border-[var(--border)] rounded-md text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                      <option value="converted">Converted</option>
                      <option value="lost">Lost</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Notes</label>
                    <textarea
                      value={editForm.notes || ''}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--input)] border border-[var(--border)] rounded-md text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter className="flex justify-end space-x-3 mt-6">
                  <Button variant="outline" onClick={() => { setIsEditing(false); setSelectedLead(null); setEditForm({}); }}>Cancel</Button>
                  <Button onClick={handleSaveEdit}>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}