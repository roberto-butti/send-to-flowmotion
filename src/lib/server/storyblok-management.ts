import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { getManagementBaseUrl } from '@storyblok/region-helper';

import type { AppSession } from '@storyblok/app-extension-auth';

const DEFAULT_PLUGIN_SLUG = 'your-org@send-to-flowmotion';
const REQUIRED_SETTINGS = ['webhook_url', 'http_method'] as const;
const ALLOWED_HTTP_METHODS = new Set(['POST']);

export type FlowmotionConfig = {
	webhookUrl?: string;
	httpMethod?: string;
	missing: string[];
};

type AppProvision = {
	slug?: unknown;
	app_id?: unknown;
	extension_id?: unknown;
	space_level_settings?: unknown;
};

type AppProvisionsResponse = {
	app_provisions?: unknown;
};

export async function getFlowmotionConfig(session: AppSession): Promise<FlowmotionConfig> {
	const provision = await getInstalledToolPluginProvision(session);
	const settings = readSpaceLevelSettings(provision.space_level_settings);
	const webhookUrl = readWebhookUrlSetting(settings.webhook_url);
	const httpMethod = readStringSetting(settings.http_method)?.toUpperCase();
	const missing = getMissingSettings({ webhookUrl, httpMethod });

	return {
		webhookUrl,
		httpMethod,
		missing
	};
}

export function getRequiredSettings() {
	return [...REQUIRED_SETTINGS];
}

async function getInstalledToolPluginProvision(session: AppSession) {
	const response = await fetch(
		`${getManagementBaseUrl(session.region)}/v1/spaces/${session.spaceId}/app_provisions/`,
		{
			headers: {
				Authorization: `Bearer ${session.accessToken}`,
				Accept: 'application/json'
			}
		}
	);

	if (!response.ok) {
		throw new Error(`Storyblok settings lookup failed with status ${response.status}.`);
	}

	const body = (await response.json()) as AppProvisionsResponse;
	const appProvisions = Array.isArray(body.app_provisions) ? body.app_provisions : [];
	const pluginSlug = getPluginSlug();
	const provision = appProvisions.find(
		(item): item is AppProvision => isAppProvision(item) && item.slug === pluginSlug
	);

	if (!provision) {
		throw new Error(`Installed Storyblok plugin "${pluginSlug}" was not found in this space.`);
	}

	return provision;
}

export function getPluginSlug() {
	return (
		publicEnv.PUBLIC_STORYBLOK_TOOL_PLUGIN_SLUG ||
		env.STORYBLOK_TOOL_PLUGIN_SLUG ||
		DEFAULT_PLUGIN_SLUG
	);
}

function isAppProvision(value: unknown): value is AppProvision {
	return typeof value === 'object' && value !== null;
}

function readSpaceLevelSettings(value: unknown): Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: {};
}

function readStringSetting(value: unknown) {
	return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function readWebhookUrlSetting(value: unknown) {
	const webhookUrl = readStringSetting(value);
	if (!webhookUrl) return undefined;

	try {
		return new URL(webhookUrl).toString();
	} catch {
		return undefined;
	}
}

function getMissingSettings(config: Pick<FlowmotionConfig, 'httpMethod' | 'webhookUrl'>) {
	const missing: string[] = [];

	if (!config.webhookUrl) {
		missing.push('Add a valid absolute webhook_url setting.');
	}

	if (!config.httpMethod) {
		missing.push('Add the http_method setting.');
	} else if (!ALLOWED_HTTP_METHODS.has(config.httpMethod)) {
		missing.push('Set http_method to POST.');
	}

	return missing;
}
