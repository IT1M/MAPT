import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/services/auth';
import { prisma } from '@/services/prisma';
import { createAuditLog } from '@/utils/audit';
import sharp from 'sharp';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'avatars');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * POST /api/users/avatar
 * Upload and process user avatar
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
        },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'No file provided' },
        },
        { status: 400 }
      );
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid file type. Only JPEG, PNG, and WebP are allowed',
          },
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'File size exceeds 5MB limit',
          },
        },
        { status: 400 }
      );
    }

    // Ensure upload directory exists
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Get current user to check for existing avatar
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { preferences: true },
    });

    const currentPreferences = (currentUser?.preferences as any) || {};
    const oldAvatarPath = currentPreferences.avatar;

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${session.user.id}-${timestamp}.jpg`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Process image with sharp: resize to 200x200 and convert to JPEG
    const processedImage = await sharp(buffer)
      .resize(200, 200, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 90 })
      .toBuffer();

    // Save processed image
    await writeFile(filepath, processedImage);

    // Update user preferences with new avatar URL
    const avatarUrl = `/uploads/avatars/${filename}`;
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        preferences: {
          ...currentPreferences,
          avatar: avatarUrl,
        },
      },
    });

    // Delete old avatar file if it exists
    if (oldAvatarPath && oldAvatarPath.startsWith('/uploads/avatars/')) {
      const oldFilePath = path.join(process.cwd(), 'public', oldAvatarPath);
      try {
        if (existsSync(oldFilePath)) {
          await unlink(oldFilePath);
        }
      } catch (error) {
        console.error('Error deleting old avatar:', error);
        // Don't fail the request if old file deletion fails
      }
    }

    // Create audit log
    await createAuditLog({
      userId: session.user.id,
      action: 'UPDATE',
      entity: 'User',
      entityId: session.user.id,
      changes: {
        oldValue: { avatar: oldAvatarPath },
        newValue: { avatar: avatarUrl },
      },
      metadata: {
        ipAddress:
          request.headers.get('x-forwarded-for') ||
          request.headers.get('x-real-ip') ||
          undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      data: { avatarUrl },
      message: 'Avatar uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to upload avatar',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/avatar
 * Remove user avatar
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
        },
        { status: 401 }
      );
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { preferences: true },
    });

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'User not found' },
        },
        { status: 404 }
      );
    }

    const currentPreferences = (currentUser.preferences as any) || {};
    const avatarPath = currentPreferences.avatar;

    if (!avatarPath) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'No avatar to remove' },
        },
        { status: 404 }
      );
    }

    // Update user preferences to remove avatar
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        preferences: {
          ...currentPreferences,
          avatar: null,
        },
      },
    });

    // Delete avatar file if it exists
    if (avatarPath.startsWith('/uploads/avatars/')) {
      const filePath = path.join(process.cwd(), 'public', avatarPath);
      try {
        if (existsSync(filePath)) {
          await unlink(filePath);
        }
      } catch (error) {
        console.error('Error deleting avatar file:', error);
        // Don't fail the request if file deletion fails
      }
    }

    // Create audit log
    await createAuditLog({
      userId: session.user.id,
      action: 'UPDATE',
      entity: 'User',
      entityId: session.user.id,
      changes: {
        oldValue: { avatar: avatarPath },
        newValue: { avatar: null },
      },
      metadata: {
        ipAddress:
          request.headers.get('x-forwarded-for') ||
          request.headers.get('x-real-ip') ||
          undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Avatar removed successfully',
    });
  } catch (error) {
    console.error('Error removing avatar:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to remove avatar',
        },
      },
      { status: 500 }
    );
  }
}
