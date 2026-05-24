import { json } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

type TriggerWebhookRequest = {
	story?: unknown;
	spaceId?: number | string;
	language?: string;
};

export const POST: RequestHandler = async ({ request }) => {
	const payload = (await request.json().catch(() => ({}))) as TriggerWebhookRequest;

	return json({
		sent: true,
		mock: true,
		message: 'Mock Flowmotion webhook triggered.',
		forwardedPayload: {
			plugin: 'your-org@send-to-flowmotion',
			story: payload.story ?? null,
			spaceId: payload.spaceId ?? null,
			language: payload.language ?? 'default',
			triggeredAt: new Date().toISOString()
		}
	});
};
