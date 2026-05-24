import { json } from '@sveltejs/kit';

import { getConnectUrl, getStoryblokSession } from '$lib/server/storyblok-auth';
import { getFlowmotionConfig, getRequiredSettings } from '$lib/server/storyblok-management';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	const spaceId = event.request.headers.get('X-Storyblok-Space-Id') ?? undefined;
	const userId = event.request.headers.get('X-Storyblok-User-Id') ?? undefined;
	const connectUrl = getConnectUrl(event.url);
	const requiredKeys = getRequiredSettings();
	let session: Awaited<ReturnType<typeof getStoryblokSession>>;

	try {
		session = await getStoryblokSession(event, { spaceId, userId });
	} catch (error) {
		return json({
			authenticated: false,
			configured: false,
			connectUrl,
			setup: {
				requiredKeys
			},
			missing: [
				error instanceof Error
					? error.message
					: 'Storyblok OAuth is not configured for this environment.'
			]
		});
	}

	if (!session) {
		return json({
			authenticated: false,
			configured: false,
			connectUrl,
			setup: {
				requiredKeys
			},
			missing: ['Connect Storyblok before reading space-level settings.']
		});
	}

	try {
		const flowmotionConfig = await getFlowmotionConfig(session);

		return json({
			authenticated: true,
			configured: flowmotionConfig.missing.length === 0,
			settings: {
				hasWebhookUrl: Boolean(flowmotionConfig.webhookUrl),
				httpMethod: flowmotionConfig.httpMethod
			},
			setup: {
				requiredKeys
			},
			missing: flowmotionConfig.missing
		});
	} catch (error) {
		return json({
			authenticated: true,
			configured: false,
			setup: {
				requiredKeys
			},
			missing: [
				error instanceof Error ? error.message : 'Unable to read Storyblok space-level settings.'
			]
		});
	}
};
