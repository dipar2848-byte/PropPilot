'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { publicEnv } from '@/lib/env';
import {
  signInSchema,
  signUpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/lib/validation';

export interface ActionState {
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
}

function flattenZod(error: import('zod').ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0]?.toString() ?? 'form';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export async function signInAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { fieldErrors: flattenZod(parsed.error) };
  }

  const redirectTo = (formData.get('redirect') as string) || '/dashboard';
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: 'Invalid email or password. Please try again.' };
  }

  revalidatePath('/', 'layout');
  redirect(redirectTo.startsWith('/') ? redirectTo : '/dashboard');
}

export async function signUpAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = signUpSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    fullName: formData.get('fullName'),
  });
  if (!parsed.success) {
    return { fieldErrors: flattenZod(parsed.error) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${publicEnv.siteUrl}/auth/callback?next=/dashboard`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // If email confirmation is disabled the user is signed in immediately.
  if (data.session) {
    revalidatePath('/', 'layout');
    redirect('/dashboard');
  }

  return {
    message:
      'Account created! Please check your inbox to confirm your email, then sign in.',
  };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

export async function forgotPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get('email') });
  if (!parsed.success) {
    return { fieldErrors: flattenZod(parsed.error) };
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${publicEnv.siteUrl}/auth/callback?next=/reset-password`,
  });

  // Always return success to avoid leaking which emails are registered.
  return {
    message:
      'If an account exists for that email, a password reset link is on its way.',
  };
}

export async function resetPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse({ password: formData.get('password') });
  if (!parsed.success) {
    return { fieldErrors: flattenZod(parsed.error) };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Your reset link is invalid or has expired. Please request a new one.' };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}
