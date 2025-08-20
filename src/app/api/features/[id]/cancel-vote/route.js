import { NextResponse } from 'next/server';
import FeatureService from '../../../../../services/featureService.js';

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const { voterPubkey } = await request.json();

    if (!voterPubkey) {
      return NextResponse.json(
        { success: false, error: 'Voter pubkey is required' },
        { status: 400 }
      );
    }

    const featureService = new FeatureService();
    const result = await featureService.cancelVote(id, voterPubkey);

    if (result.success) {
      return NextResponse.json({
        success: true,
        votes: result.votes,
        message: 'Vote cancelled successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error cancelling vote:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
