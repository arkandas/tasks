import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getTranslations } from 'next-intl/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseId } from '@/lib/validate';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const t = await getTranslations('errors');

  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: t('unauthorized') },
        { status: 401 }
      );
    }

    const id = parseId((await params).id);
    if (!id) {
      return NextResponse.json(
        { error: t('userNotFound') },
        { status: 404 }
      );
    }

    if (session.user.id === id.toString()) {
      return NextResponse.json(
        { error: t('cannotDeleteSelf') },
        { status: 400 }
      );
    }

    const { count } = await prisma.user.deleteMany({
      where: { id }
    });

    if (count === 0) {
      return NextResponse.json(
        { error: t('userNotFound') },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: t('deleteUserFailed') },
      { status: 500 }
    );
  }
}
