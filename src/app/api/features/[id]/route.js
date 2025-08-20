import { NextResponse } from 'next/server';
import FeatureService from '../../../../services/featureService.js';

// Instance du service
const featureService = new FeatureService();

/**
 * GET /api/features/[id] - Récupérer une fonctionnalité par ID
 */
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const feature = await featureService.getFeatureById(id);

    if (!feature) {
      return NextResponse.json(
        { success: false, error: 'Fonctionnalité non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      feature: feature
    });

  } catch (error) {
    console.error('Erreur API GET /api/features/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/features/[id] - Actions sur une fonctionnalité (vote, sync)
 */
export async function POST(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { action, voterPubkey } = body;

    // Route pour synchroniser une feature spécifique
    if (action === 'sync') {
      const success = await featureService.syncFeature(id);
      
      if (success) {
        return NextResponse.json({
          success: true,
          message: `Fonctionnalité ${id} synchronisée`
        });
      } else {
        return NextResponse.json(
          { success: false, error: 'Erreur lors de la synchronisation' },
          { status: 500 }
        );
      }
    }

    // Route pour voter (action par défaut)
    if (!voterPubkey) {
      return NextResponse.json(
        { success: false, error: 'voterPubkey est requis' },
        { status: 400 }
      );
    }

    const result = await featureService.voteForFeature(id, voterPubkey);
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }

  } catch (error) {
    console.error('Erreur API POST /api/features/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/features/[id] - Mettre à jour une fonctionnalité par ID
 */
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const updatedData = await request.json();
    
    // Mettre à jour la feature dans le cache local
    const success = await featureService.updateFeature(id, updatedData);
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: `Feature ${id} updated successfully`
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Feature not found or could not be updated' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error API PUT /api/features/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/features/[id] - Supprimer une fonctionnalité par ID
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    // Supprimer la feature du cache local
    const success = await featureService.deleteFeature(id);
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: `Feature ${id} deleted successfully`
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Feature not found or could not be deleted' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error API DELETE /api/features/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
