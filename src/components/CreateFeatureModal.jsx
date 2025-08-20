'use client';

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PubkyService } from '../services/pubkyService';

const categories = [
  'authentication',
  'social',
  'storage',
  'networking',
  'ui-ux',
  'performance',
  'security',
  'developer-tools'
];

const statuses = [
  'idea',
  'discussion',
  'planned',
  'in-progress',
  'completed'
];

const priorities = [
  'low',
  'medium',
  'high',
  'critical'
];

export default function CreateFeatureModal({ isOpen, onClose, onFeatureCreated }) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'general',
    status: 'idea',
    priority: 'medium'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user?.pubkey) {
      alert('Vous devez être connecté pour créer une fonctionnalité');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Créer la feature dans le cache local (backend)
      const response = await fetch('/api/features', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userPubkey: user.pubkey,
          ...formData
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erreur création feature locale');
      }

      // 2. Sauvegarder sur le homeserver Pubky (côté frontend)
      const pubkyResult = await PubkyService.saveFeatureToPubky(user.pubkey, result.feature);
      
      if (!pubkyResult.success) {
        console.warn('⚠️ Sauvegarde Pubky échouée:', pubkyResult.error);
        // On continue même si Pubky échoue (mode dégradé)
      }

      // 3. Succès - réinitialiser le formulaire
      setFormData({
        title: '',
        description: '',
        category: 'general',
        status: 'idea',
        priority: 'medium'
      });

      // Fermer la modal
      onClose();

      const message = pubkyResult.success 
        ? '✅ Fonctionnalité créée et sauvegardée sur votre homeserver Pubky !'
        : '✅ Fonctionnalité créée (sauvegarde Pubky en mode dégradé)';
      alert(message);

      // Notifier le parent avec un petit délai pour s'assurer que tout est sauvegardé
      setTimeout(() => {
        if (onFeatureCreated) {
          onFeatureCreated(result.feature);
        }
      }, 100);

    } catch (error) {
      console.error('Erreur création feature:', error);
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              ✨ Create a New Feature
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 text-2xl hover:bg-slate-100 dark:hover:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              disabled={isSubmitting}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Feature Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                maxLength={100}
                placeholder="Ex: Pubky Ring Authentication with QR Code"
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                disabled={isSubmitting}
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Detailed Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                maxLength={1000}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-vertical transition-colors"
                placeholder="Describe this feature in detail, its usefulness, and how it would improve the Pubky ecosystem..."
                disabled={isSubmitting}
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.description.length}/1000 caractères
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                  disabled={isSubmitting}
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                  disabled={isSubmitting}
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Priority
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                  disabled={isSubmitting}
                >
                  {priorities.map(priority => (
                    <option key={priority} value={priority}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Storage Information */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center">
                🏠 Storage Information
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                This feature will be saved on your Pubky homeserver 
                (<code className="bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 px-2 py-1 rounded font-mono text-xs">
                  /pub/roadky-app/features/
                </code>) 
                and indexed locally for public display.
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                👤 Author: <code className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-2 py-1 rounded font-mono text-xs">
                  {user?.pubkey ? `${user.pubkey.slice(0, 8)}...${user.pubkey.slice(-8)}` : 'Not connected'}
                </code>
              </p>
            </div>

            {/* Boutons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-medium"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl"
                disabled={isSubmitting || !formData.title.trim() || !formData.description.trim()}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </span>
                ) : (
                  'Create Feature'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
