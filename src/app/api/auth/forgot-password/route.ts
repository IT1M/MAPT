import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/prisma';
import { randomBytes } from 'crypto';
import { sendPasswordResetEmail } from '@/utils/email';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    // But only send email if user exists
    if (user) {
      // Delete any existing tokens for this user
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });

      // Generate secure random token
      const token = randomBytes(32).toString('hex');

      // Create token with 60-minute expiration
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 60 minutes

      await prisma.passwordResetToken.create({
        data: {
          id: randomBytes(16).toString('hex'),
          token,
          userId: user.id,
          expiresAt,
          used: false,
        },
      });

      // Send password reset email
      try {
        await sendPasswordResetEmail(user.email, user.name, token);
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        // Don't fail the request if email fails
        // The token is still created and can be used
      }
    }

    // Always return success response
    return NextResponse.json({
      success: true,
      message:
        'If an account exists with that email, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}
