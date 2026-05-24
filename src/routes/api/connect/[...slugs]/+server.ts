import { json } from '@sveltejs/kit';

import { runAuthHandler } from '$lib/server/storyblok-auth';

import type { RequestHandler } from './$types';

async function handleAuth(event: Parameters<RequestHandler>[0]) {
	try {
		return await runAuthHandler(event);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unable to start Storyblok OAuth.';

		return json({ message }, { status: 500 });
	}
}

export const GET: RequestHandler = handleAuth;
export const POST: RequestHandler = handleAuth;
