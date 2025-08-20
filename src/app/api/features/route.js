import { NextResponse } from 'next/server';
import FeatureService from '../../../services/featureService.js';

// Instance du service
const featureService = new FeatureService();

/**
 * GET /api/features - Récupérer toutes les fonctionnalités
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  // Route pour les statistiques
  if (action === 'stats') {
    try {
      const stats = await featureService.getStats();
      return NextResponse.json(stats);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Erreur interne du serveur' },
        { status: 500 }
      );
    }
  }

  // Route par défaut : récupérer toutes les features
  try {
    const features = await featureService.getAllFeatures();
    return NextResponse.json({
      success: true,
      features: features
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/features - Créer une nouvelle fonctionnalité ou synchroniser
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { action } = body;

    // Route pour synchroniser toutes les features
    if (action === 'sync') {
      // Pour l'instant, retourner un message indiquant que la sync n'est pas encore implémentée
      return NextResponse.json({
        success: false,
        error: 'Synchronisation pas encore implémentée'
      }, { status: 501 });
    }

    // Route par défaut : créer une nouvelle feature
    const result = await featureService.createFeature(body.userPubkey, {
      title: body.title,
      description: body.description,
      category: body.category,
      status: body.status,
      priority: body.priority
    });
    
    if (result.success) {
      return NextResponse.json(result, { status: 201 });
    } else {
      return NextResponse.json(result, { status: 400 });
    }

  } catch (error) {
    console.error('Erreur API POST /api/features:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
