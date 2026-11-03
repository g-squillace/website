export const prerender = false;

import type { APIRoute } from 'astro';
import { PRIVATE_AREA } from '../../../config';
import { clearSessionCookie } from '../../../lib/report/auth';

export const POST: APIRoute = ({ cookies, redirect }) => {
  clearSessionCookie(cookies);
  return redirect(PRIVATE_AREA.loginPath, 303);
};
