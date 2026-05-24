import { env } from '$env/dynamic/private';

import type { AuthHandlerParams } from '@storyblok/app-extension-auth';
import type { RequestEvent } from '@sveltejs/kit';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createRequire } from 'node:module';

const ENDPOINT_PREFIX = '/api/connect';
const SESSION_KEY = 'send-to-flowmotion.sb.auth';
const require = createRequire(import.meta.url);

type HeaderValue = number | string | string[];

type CapturedServerResponse = {
	status: number;
	headers: Headers;
	body: string;
};

type MinimalServerResponse = Pick<ServerResponse, 'getHeader' | 'setHeader' | 'writeHead' | 'end'>;

export function getAuthParams(): AuthHandlerParams {
	const clientId = env.APP_CLIENT_ID;
	const clientSecret = env.APP_CLIENT_SECRET;
	const baseUrl = env.APP_URL;

	if (!clientId || !clientSecret || !baseUrl) {
		throw new Error('Missing APP_CLIENT_ID, APP_CLIENT_SECRET, or APP_URL.');
	}

	return {
		clientId,
		clientSecret,
		baseUrl,
		endpointPrefix: ENDPOINT_PREFIX,
		sessionKey: SESSION_KEY,
		successCallback: '/',
		errorCallback: '/401'
	};
}

export function getConnectUrl(url: URL) {
	return `${url.origin}${ENDPOINT_PREFIX}/storyblok`;
}

export async function getStoryblokSession(
	event: RequestEvent,
	query?: { spaceId?: string; userId?: string }
) {
	const { getSessionStore } = await importStoryblokAuth();
	const params = getAuthParams();
	const { req, res } = createNodeRequestResponse(event);
	const sessionStore = getSessionStore(params)({ req, res });

	if (!query?.spaceId || !query.userId) {
		return undefined;
	}

	return sessionStore.get({
		spaceId: query.spaceId,
		userId: query.userId
	});
}

export async function runAuthHandler(event: RequestEvent) {
	const { authHandler } = await importStoryblokAuth();
	const params = getAuthParams();
	const { req, res, captured } = createNodeRequestResponse(event);
	const handler = authHandler(params);

	await new Promise<void>((resolve, reject) => {
		captured.resolve = resolve;
		captured.reject = reject;

		Promise.resolve(handler(req, res)).catch(reject);
	});

	return new Response(captured.body, {
		status: captured.status,
		headers: captured.headers
	});
}

async function importStoryblokAuth() {
	ensureSlowBufferCompatibility();
	return await import('@storyblok/app-extension-auth');
}

function ensureSlowBufferCompatibility() {
	const bufferModule = require('buffer') as { Buffer: typeof Buffer; SlowBuffer?: typeof Buffer };
	bufferModule.SlowBuffer ??= bufferModule.Buffer;
}

function createNodeRequestResponse(event: RequestEvent) {
	const requestHeaders = Object.fromEntries(event.request.headers.entries());
	const responseHeaders = new Map<string, HeaderValue>();
	const captured = {
		status: 200,
		headers: new Headers(),
		body: '',
		resolve: undefined as (() => void) | undefined,
		reject: undefined as ((error: unknown) => void) | undefined
	};

	const req = {
		method: event.request.method,
		url: `${event.url.pathname}${event.url.search}`,
		headers: requestHeaders
	} as IncomingMessage;

	const res: MinimalServerResponse = {
		getHeader(name) {
			return responseHeaders.get(name.toLowerCase());
		},
		setHeader(name, value) {
			responseHeaders.set(name.toLowerCase(), value as HeaderValue);
			return res as ServerResponse;
		},
		writeHead(status, headers) {
			captured.status = status;

			if (headers) {
				for (const [name, value] of Object.entries(headers)) {
					responseHeaders.set(name.toLowerCase(), value as HeaderValue);
				}
			}

			return res as ServerResponse;
		},
		end(chunk?: unknown) {
			if (typeof chunk === 'string') {
				captured.body += chunk;
			} else if (chunk instanceof Uint8Array) {
				captured.body += new TextDecoder().decode(chunk);
			}

			copyHeaders(responseHeaders, captured.headers);
			captured.resolve?.();
			return res as ServerResponse;
		}
	};

	return {
		req,
		res: res as ServerResponse,
		captured: captured as CapturedServerResponse & typeof captured
	};
}

function copyHeaders(source: Map<string, HeaderValue>, target: Headers) {
	for (const [name, value] of source) {
		if (Array.isArray(value)) {
			for (const item of value) {
				target.append(name, item);
			}
		} else {
			target.set(name, String(value));
		}
	}
}
