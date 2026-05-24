import { json } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

const mockSpaceLevelSettings = {
	webhook_url: 'https://flowmotion.example.com/webhook',
	http_method: 'POST'
};

export const GET: RequestHandler = () => {
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
