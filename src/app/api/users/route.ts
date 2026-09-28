import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getTranslations } from 'next-intl/server';
import { authOptions } from '@/lib/auth';
import { authConfig } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { LIMITS, requiredText, isEmail, isUserRole } from '@/lib/validate';

export async function GET() {
  const t = await getTranslations('errors');

  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: t('unauthorized') },
        { status: 401 }
      );
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: t('fetchUsersFailed') },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const t = await getTranslations('errors');

  if (authConfig.mode === 'oidc') {
    return NextResponse.json(
      { error: t('usersManagedByProvider') },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    const userCount = await prisma.user.count();
    const isFirstUser = userCount === 0;

    if (!isFirstUser) {
      const session = await getServerSession(authOptions);
      if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: t('unauthorized') },
          { status: 401 }
        );
      }
    }

    const username = requiredText(body.username, LIMITS.username);
    const email = requiredText(body.email, LIMITS.email);
    const password = typeof body.password === 'string' ? body.password : '';

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: t('missingFields') },
        { status: 400 }
      );
    }

    if (!isEmail(email)) {
      return NextResponse.json(
        { error: t('invalidEmail') },
        { status: 400 }
      );
    }

    if (password.length < LIMITS.passwordMin || password.length > LIMITS.passwordMax) {
      return NextResponse.json(
        { error: t('passwordLength', { min: LIMITS.passwordMin, max: LIMITS.passwordMax }) },
        { status: 400 }
      );
    }

    if (body.role !== undefined && !isUserRole(body.role)) {
      return NextResponse.json(
        { error: t('invalidRole') },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: t('userExists') },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userRole = isFirstUser ? 'ADMIN' : (body.role ?? 'USER');

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: userRole,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        created_at: true,
      }
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: t('createUserFailed') },
      { status: 500 }
    );
  }
}
