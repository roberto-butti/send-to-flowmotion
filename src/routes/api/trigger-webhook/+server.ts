import { json } from '@sveltejs/kit';

import { getStoryblokSession } from '$lib/server/storyblok-auth';
import { getFlowmotionConfig, getPluginSlug } from '$lib/server/storyblok-management';

import type { RequestHandler } from './$types';

type TriggerWebhookRequest = {
	story?: unknown;
	spaceId?: number | string;
	language?: string;
};

const ERROR_BODY_LIMIT = 500;

export const POST: RequestHandler = async (event) => {
	const { request } = event;
	const payload = (await request.json().catch(() => ({}))) as TriggerWebhookRequest;
	const validationError = validateTriggerPayload(payload);

	if (validationError) {
		return json({ sent: false, error: validationError }, { status: 400 });
	}

	const userId = request.headers.get('X-Storyblok-User-Id') ?? undefined;
	let session: Awaited<ReturnType<typeof getStoryblokSession>>;

	try {
		session = await getStoryblokSession(event, {
			spaceId: String(payload.spaceId),
			userId
		});
	} catch (error) {
		return json(
			{
				sent: false,
				error:
					error instanceof Error
						? error.message
						: 'Storyblok OAuth is not configured for this environment.'
			},
			{ status: 401 }
		);
	}

	if (!session) {
		return json(
			{
				sent: false,
				error: 'Connect Storyblok before sending stories to Flowmotion.'
			},
			{ status: 401 }
		);
	}

	let config: Awaited<ReturnType<typeof getFlowmotionConfig>>;

	try {
		config = await getFlowmotionConfig(session);
	} catch (error) {
		return json(
			{
				sent: false,
				error:
					error instanceof Error ? error.message : 'Unable to read Storyblok space-level settings.'
			},
			{ status: 400 }
		);
	}

	if (!config.webhookUrl || !config.httpMethod || config.missing.length > 0) {
		return json(
			{
				sent: false,
				error: config.missing[0] ?? 'Flowmotion webhook settings are incomplete.'
			},
			{ status: 400 }
		);
	}

	const forwardedPayload = {
		plugin: getPluginSlug(),
		story: payload.story,
		spaceId: payload.spaceId,
		language: payload.language ?? 'default',
		triggeredAt: new Date().toISOString()
	};

	try {
		const response = await fetch(config.webhookUrl, {
			method: config.httpMethod,
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify(forwardedPayload)
		});

		if (!response.ok) {
			const responseBody = await readResponseBodySnippet(response);
			const upstreamMessage = [
				`Flowmotion webhook returned status ${response.status}`,
				response.statusText && `(${response.statusText})`,
				responseBody && `: ${responseBody}`
			]
				.filter(Boolean)
				.join(' ');

			return json(
				{
					sent: false,
					error: upstreamMessage,
					upstreamStatus: response.status
				},
				{ status: 502 }
			);
		}

		return json({
			sent: true,
			message: 'Story sent to Flowmotion.'
		});
	} catch (error) {
		console.error('Flowmotion webhook request failed', {
			error: error instanceof Error ? error.message : error,
			webhookHost: safeUrlHost(config.webhookUrl)
		});

		return json(
			{
				sent: false,
				error:
					error instanceof Error
						? `Unable to reach Flowmotion webhook: ${error.message}`
						: 'Unable to reach Flowmotion webhook.'
			},
			{ status: 502 }
		);
	}
};

function validateTriggerPayload(payload: TriggerWebhookRequest) {
	if (!isRecord(payload.story)) {
		return 'A story payload is required.';
	}

	if (typeof payload.spaceId !== 'string' && typeof payload.spaceId !== 'number') {
		return 'A Storyblok space ID is required.';
	}

	if (typeof payload.spaceId === 'string' && !payload.spaceId.trim()) {
		return 'A Storyblok space ID is required.';
	}

	if (payload.language !== undefined && typeof payload.language !== 'string') {
		return 'Language must be a string.';
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function readResponseBodySnippet(response: Response) {
	const text = await response.text().catch(() => '');
	const normalized = text.replace(/\s+/g, ' ').trim();

	if (normalized.length <= ERROR_BODY_LIMIT) {
		return normalized;
	}

	return `${normalized.slice(0, ERROR_BODY_LIMIT)}...`;
}

function safeUrlHost(url: string) {
	try {
		return new URL(url).host;
	} catch {
		return 'invalid-url';
	}
}
