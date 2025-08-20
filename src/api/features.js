import FeatureService from '../services/featureService.js';

const featureService = new FeatureService();

/**
 * API Routes pour la gestion des fonctionnalités
 */

/**
 * POST /api/features - Créer une nouvelle fonctionnalité
 */
export async function createFeature(req, res) {
  try {
    const { userPubkey, title, description, category, status, priority } = req.body;

    // Validation des données
    if (!userPubkey || !title || !description) {
      return res.status(400).json({
        success: false,
        error: 'userPubkey, title et description sont requis'
      });
    }

    const result = await featureService.createFeature(userPubkey, {
      title,
      description,
      category,
      status,
      priority
    });

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(500).json(result);
    }

  } catch (error) {
    console.error('Erreur API createFeature:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
}

/**
 * GET /api/features - Récupérer toutes les fonctionnalités
 */
export async function getAllFeatures(req, res) {
  try {
    const features = await featureService.getAllFeatures();
    
    // Formater pour l'affichage public
    const publicFeatures = features.map(feature => ({
      id: feature.id,
      title: feature.cached_content.title,
      description: feature.cached_content.description,
      category: feature.cached_content.category,
      status: feature.cached_content.status,
      priority: feature.cached_content.priority,
      votes: feature.votes,
      created_at: feature.cached_content.created_at,
      updated_at: feature.cached_content.updated_at,
      author_pubkey: feature.author_pubkey,
      last_sync: feature.last_sync
    }));

    res.json({
      success: true,
      features: publicFeatures,
      total: publicFeatures.length
    });

  } catch (error) {
    console.error('Erreur API getAllFeatures:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
}

/**
 * GET /api/features/:id - Récupérer une fonctionnalité par ID
 */
export async function getFeatureById(req, res) {
  try {
    const { id } = req.params;
    const feature = await featureService.getFeatureById(id);

    if (!feature) {
      return res.status(404).json({
        success: false,
        error: 'Fonctionnalité non trouvée'
      });
    }

    // Formater pour l'affichage public
    const publicFeature = {
      id: feature.id,
      title: feature.cached_content.title,
      description: feature.cached_content.description,
      category: feature.cached_content.category,
      status: feature.cached_content.status,
      priority: feature.cached_content.priority,
      votes: feature.votes,
      created_at: feature.cached_content.created_at,
      updated_at: feature.cached_content.updated_at,
      author_pubkey: feature.author_pubkey,
      last_sync: feature.last_sync
    };

    res.json({
      success: true,
      feature: publicFeature
    });

  } catch (error) {
    console.error('Erreur API getFeatureById:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
}

/**
 * POST /api/features/:id/vote - Voter pour une fonctionnalité
 */
export async function voteForFeature(req, res) {
  try {
    const { id } = req.params;
    const { voterPubkey } = req.body;

    if (!voterPubkey) {
      return res.status(400).json({
        success: false,
        error: 'voterPubkey est requis'
      });
    }

    const result = await featureService.voteForFeature(id, voterPubkey);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Erreur API voteForFeature:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
}

/**
 * POST /api/features/sync - Synchroniser toutes les fonctionnalités
 */
export async function syncAllFeatures(req, res) {
  try {
    const syncCount = await featureService.syncAllFeatures();

    res.json({
      success: true,
      message: `${syncCount} fonctionnalités synchronisées`,
      syncCount
    });

  } catch (error) {
    console.error('Erreur API syncAllFeatures:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
}

/**
 * POST /api/features/:id/sync - Synchroniser une fonctionnalité spécifique
 */
export async function syncFeature(req, res) {
  try {
    const { id } = req.params;
    const success = await featureService.syncFeature(id);

    if (success) {
      res.json({
        success: true,
        message: `Fonctionnalité ${id} synchronisée`
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la synchronisation'
      });
    }

  } catch (error) {
    console.error('Erreur API syncFeature:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
}

/**
 * GET /api/features/stats - Récupérer les statistiques
 */
export async function getStats(req, res) {
  try {
    const stats = await featureService.getStats();

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Erreur API getStats:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
}
