export const prerender = false;

import type { APIRoute } from 'astro';
import { clearSessionCookie } from '../../../lib/report/auth';

export const POST: APIRoute = ({ cookies, redirect }) => {
  clearSessionCookie(cookies);
  return redirect('/report/login', 303);
};
