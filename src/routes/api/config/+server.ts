import { json } from '@sveltejs/kit';

import { getConnectUrl, getStoryblokSession } from '$lib/server/storyblok-auth';

import type { RequestHandler } from './$types';

const mockSpaceLevelSettings = {
	webhook_url: 'https://flowmotion.example.com/webhook',
	http_method: 'POST'
};

export const GET: RequestHandler = async (event) => {
	const spaceId = event.request.headers.get('X-Storyblok-Space-Id') ?? undefined;
	const userId = event.request.headers.get('X-Storyblok-User-Id') ?? undefined;
	const connectUrl = getConnectUrl(event.url);

	try {
		const session = await getStoryblokSession(event, { spaceId, userId });

		if (!session) {
			return json({
				authenticated: false,
				configured: false,
				connectUrl,
				setup: {
					requiredKeys: ['webhook_url', 'http_method']
				},
				missing: ['Connect Storyblok before reading space-level settings.']
			});
		}
	} catch (error) {
		return json({
			authenticated: false,
			configured: false,
			connectUrl,
			setup: {
				requiredKeys: ['webhook_url', 'http_method']
			},
			missing: [
				error instanceof Error
					? error.message
					: 'Storyblok OAuth is not configured for this environment.'
			]
		});
	}

	const missing = [
		!mockSpaceLevelSettings.webhook_url && 'Add the webhook_url setting.',
		!mockSpaceLevelSettings.http_method && 'Add the http_method setting.'
	].filter(Boolean);

	return json({
		authenticated: true,
		configured: missing.length === 0,
		settings: {
			hasWebhookUrl: Boolean(mockSpaceLevelSettings.webhook_url),
			httpMethod: mockSpaceLevelSettings.http_method
		},
		setup: {
			requiredKeys: ['webhook_url', 'http_method']
		},
		missing
	});
};
