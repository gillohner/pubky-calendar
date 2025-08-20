'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import Header from '../../../../components/Header';
import LoginModal from '../../../../components/LoginModal';

export default function EditFeaturePage() {
  const router = useRouter();
  const params = useParams();
  const { user, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [feature, setFeature] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'general',
    status: 'idea',
    priority: 'medium'
  });

  // Redirection si non connecté
  useEffect(() => {
    if (!user?.pubkey) {
      router.push('/');
      return;
    }
    loadFeature();
  }, [user, params.id]);

  const loadFeature = async () => {
    if (!user?.pubkey || !params.id) return;

    setLoading(true);
    setError(null);

    try {
      // Récupérer la feature depuis le cache local (même logique que la page admin)
      const response = await fetch(`/api/features/${params.id}`);
      const result = await response.json();
      
      if (result.success) {
        const featureData = result.feature;
        
        // Vérifier que l'utilisateur est bien le propriétaire
        if (featureData.author_pubkey !== user.pubkey) {
          setError('You are not authorized to edit this feature');
          return;
        }
        
        setFeature(featureData);
        setFormData({
          title: featureData.title || '',
          description: featureData.description || '',
          category: featureData.category || 'general',
          status: featureData.status || 'idea',
          priority: featureData.priority || 'medium'
        });
      } else {
        setError('Feature not found');
      }
    } catch (err) {
      console.error('Error loading feature:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Title and description are required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updatedFeature = {
        ...feature,
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        status: formData.status,
        priority: formData.priority,
        updated_at: new Date().toISOString()
      };

      // Sauvegarder sur le homeserver Pubky (utiliser PubkyService)
      const { PubkyService } = await import('../../../../services/pubkyService');
      const pubkyResult = await PubkyService.saveFeatureToPubky(user.pubkey, updatedFeature);
      
      if (!pubkyResult.success) {
        console.warn('Failed to save to homeserver:', pubkyResult.error);
        // Continue quand même pour mettre à jour le cache local
      }

      // Mettre à jour le cache local
      try {
        const localResponse = await fetch(`/api/features/${params.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedFeature)
        });
        
        if (!localResponse.ok) {
          console.warn('Failed to update local cache, but homeserver updated successfully');
        }
      } catch (localError) {
        console.warn('Error updating local cache:', localError);
      }

      alert('✅ Feature updated successfully!');
      router.push('/admin');
      
    } catch (err) {
      console.error('Error saving feature:', err);
      setError('Failed to save feature: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this feature? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      // Supprimer du homeserver Pubky (utiliser PubkyService)
      const { PubkyService } = await import('../../../../services/pubkyService');
      const pubkyResult = await PubkyService.deleteFeatureFromPubky(user.pubkey, params.id);
      
      if (!pubkyResult.success) {
        console.warn('Failed to delete from homeserver:', pubkyResult.error);
        // Continue quand même pour supprimer du cache local
      }

      // Supprimer du cache local
      try {
        const localResponse = await fetch(`/api/features/${params.id}`, {
          method: 'DELETE'
        });
        
        if (!localResponse.ok) {
          console.warn('Failed to delete from local cache');
        }
      } catch (localError) {
        console.warn('Error deleting from local cache:', localError);
      }

      alert('✅ Feature deleted successfully!');
      router.push('/admin');
      
    } catch (err) {
      console.error('Error deleting feature:', err);
      setError('Failed to delete feature: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  if (!user?.pubkey) {
    return null; // Redirection en cours
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Header Global */}
      <Header 
        user={user} 
        onShowLoginModal={() => setShowLoginModal(true)} 
        onLogout={logout}
      />
      
      {/* Modal de connexion */}
      {showLoginModal && (
        <LoginModal 
          onClose={() => setShowLoginModal(false)}
        />
      )}
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-900 via-blue-900 to-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Edit Feature
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-8">
              Modify your feature stored on your Pubky homeserver
            </p>
            
            {/* Navigation */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => router.push('/admin')}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                ← Back to My Features
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-300">Loading feature...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
              <p className="text-red-600 dark:text-red-400 mb-4">❌ {error}</p>
              <button
                onClick={() => router.push('/admin')}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
              >
                Back to My Features
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Feature Details
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  ID: {params.id} • Created: {feature?.created_at ? new Date(feature.created_at).toLocaleDateString('en-US') : 'Unknown'}
                </p>
              </div>

              <form className="space-y-6">
                {/* Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter feature title..."
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Describe your feature..."
                    required
                  />
                </div>

                {/* Category, Status, Priority */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Category
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="general">General</option>
                      <option value="authentication">Authentication</option>
                      <option value="storage">Storage</option>
                      <option value="api">API</option>
                      <option value="ui-ux">UI/UX</option>
                      <option value="performance">Performance</option>
                      <option value="security">Security</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Status
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="idea">Idea</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Priority
                    </label>
                    <select
                      id="priority"
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-6 border-t border-slate-200 dark:border-slate-600">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => router.push('/admin')}
                      className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      {deleting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Deleting...
                        </>
                      ) : (
                        <>
                          🗑️ Delete
                        </>
                      )}
                    </button>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        💾 Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
