<script lang="ts">
	import { env } from '$env/dynamic/public';
	import { onMount } from 'svelte';

	const PLUGIN_SLUG = env.PUBLIC_STORYBLOK_TOOL_PLUGIN_SLUG || 'your-org@send-to-flowmotion';
	const DEBUG_APP_BRIDGE = env.PUBLIC_DEBUG_APP_BRIDGE === 'true';
	const ENABLE_MOCK_CONTEXT = env.PUBLIC_ENABLE_MOCK_CONTEXT === 'true';
	const IFRAME_HEIGHT = 680;
	const MOCK_CONTEXT_DELAY = 800;

	type StoryblokStory = {
		id?: number | string;
		uuid?: string;
		name: string;
		slug?: string;
		full_slug?: string;
		content?: Record<string, unknown>;
	};

	type StoryblokContext = {
		story: StoryblokStory;
		spaceId?: number | string;
		language?: string;
	};

	type StoryblokContextMessage = {
		action?: string;
		story?: StoryblokStory;
		spaceId?: number | string;
		space_id?: number | string;
		space?: {
			id?: number | string;
		};
		language?: string;
	};

	type ConfigResponse = {
		authenticated: boolean;
		configured: boolean;
		connectUrl?: string;
		settings?: {
			hasWebhookUrl: boolean;
			httpMethod?: string;
		};
		setup?: {
			requiredKeys: string[];
		};
		missing?: string[];
	};

	type ConfigStatus = 'idle' | 'loading' | 'loaded' | 'error';
	type SendStatus = 'idle' | 'sending' | 'sent' | 'error';
	type TriggerWebhookResponse = {
		message?: string;
		error?: string;
	};

	let context: StoryblokContext | undefined = $state();
	let hasRequestedContext = $state(false);
	let config: ConfigResponse | undefined = $state();
	let configStatus = $state<ConfigStatus>('idle');
	let configError = $state('');
	let sendStatus = $state<SendStatus>('idle');
	let sendMessage = $state('');
	let configLoadKey = '';

	let canSend = $derived(
		Boolean(context && configStatus === 'loaded' && config?.authenticated && config.configured)
	);

	const mockContext: StoryblokContext = {
		story: {
			id: 123456789,
			uuid: 'mock-story-uuid',
			name: 'Article created from local mock context',
			slug: 'article-created-from-local-mock-context',
			full_slug: 'articles/article-created-from-local-mock-context',
			content: {}
		},
		spaceId: '123456',
		language: 'default'
	};

	function logAppBridge(message: string, data?: unknown) {
		if (!DEBUG_APP_BRIDGE) return;

		console.debug(`[Send to Flowmotion App Bridge] ${message}`, data);
	}

	function postToStoryblok(event: string, data: Record<string, unknown> = {}) {
		const message = {
			action: 'tool-changed',
			tool: PLUGIN_SLUG,
			event,
			...data
		};

		logAppBridge('Sending message', message);
		window.parent.postMessage(message, '*');
	}

	function isRecord(value: unknown): value is Record<string, unknown> {
		return typeof value === 'object' && value !== null;
	}

	function getStringOrNumber(value: unknown): number | string | undefined {
		return typeof value === 'string' || typeof value === 'number' ? value : undefined;
	}

	function getSpaceId(sources: Record<string, unknown>[]) {
		for (const source of sources) {
			const directSpaceId = getStringOrNumber(source.spaceId ?? source.space_id);
			if (directSpaceId !== undefined) return directSpaceId;

			if (isRecord(source.space)) {
				const nestedSpaceId = getStringOrNumber(source.space.id);
				if (nestedSpaceId !== undefined) return nestedSpaceId;
			}
		}

		const searchParams = new URLSearchParams(window.location.search);
		return (
			searchParams.get('space_id') ??
			searchParams.get('spaceId') ??
			searchParams.get('space') ??
			undefined
		);
	}

	function getUserId() {
		const searchParams = new URLSearchParams(window.location.search);
		return searchParams.get('user_id') ?? searchParams.get('userId') ?? undefined;
	}

	function normalizeContextMessage(data: unknown): StoryblokContextMessage | undefined {
		if (!isRecord(data)) return;

		const eventPayload = isRecord(data.event) ? data.event : undefined;
		const payload = isRecord(data.payload) ? data.payload : undefined;
		const nestedData = isRecord(data.data) ? data.data : undefined;
		const sources = [data, eventPayload, payload, nestedData].filter(isRecord);
		const storySource = sources.find((source) => isRecord(source.story));

		if (!storySource) {
			return {
				action: typeof data.action === 'string' ? data.action : undefined
			};
		}

		const spaceId = getSpaceId(sources);
		const languageSource = sources.find((source) => typeof source.language === 'string');

		return {
			action: typeof data.action === 'string' ? data.action : undefined,
			story: storySource.story as StoryblokStory,
			spaceId,
			language: languageSource?.language as string | undefined
		};
	}

	function handleMessage(event: MessageEvent) {
		const message = normalizeContextMessage(event.data);
		if (!message) return;

		logAppBridge('Received message', event.data);
		logAppBridge('Normalized message', message);

		if (
			(message.action === 'get-context' || message.action === 'loaded' || message.story) &&
			message.story
		) {
			setContext({
				story: message.story,
				spaceId: message.spaceId,
				language: message.language
			});
		}
	}

	function setContext(nextContext: StoryblokContext) {
		context = nextContext;

		const nextConfigLoadKey = `${nextContext.spaceId ?? 'unknown'}:${nextContext.story.uuid ?? nextContext.story.id ?? nextContext.story.name}`;
		if (configLoadKey === nextConfigLoadKey) return;

		configLoadKey = nextConfigLoadKey;
		loadConfig(nextContext);
	}

	async function loadConfig(activeContext: StoryblokContext) {
		configStatus = 'loading';
		configError = '';
		sendStatus = 'idle';
		sendMessage = '';

		try {
			const response = await fetch('/api/config', {
				headers: {
					'X-Storyblok-Space-Id': String(activeContext.spaceId ?? ''),
					'X-Storyblok-User-Id': getUserId() ?? ''
				}
			});

			if (!response.ok) {
				throw new Error(`Config request failed with status ${response.status}.`);
			}

			config = (await response.json()) as ConfigResponse;
			configStatus = 'loaded';
		} catch (error) {
			config = undefined;
			configStatus = 'error';
			configError = error instanceof Error ? error.message : 'Unable to load plugin configuration.';
		}
	}

	function connectStoryblok() {
		if (!config?.connectUrl) return;

		window.location.href = config.connectUrl;
	}

	async function sendToFlowmotion() {
		if (!context || !canSend || sendStatus === 'sending') return;

		sendStatus = 'sending';
		sendMessage = '';

		try {
			const response = await fetch('/api/trigger-webhook', {
				method: 'POST',
				headers: {
					'content-type': 'application/json',
					'X-Storyblok-Space-Id': String(context.spaceId ?? ''),
					'X-Storyblok-User-Id': getUserId() ?? ''
				},
				body: JSON.stringify({
					story: context.story,
					spaceId: context.spaceId,
					language: context.language ?? 'default'
				})
			});

			const result = (await response.json().catch(() => ({}))) as TriggerWebhookResponse;

			if (!response.ok) {
				throw new Error(result.error ?? `Webhook request failed with status ${response.status}.`);
			}

			sendStatus = 'sent';
			sendMessage = result.message ?? 'Story sent to Flowmotion.';
		} catch (error) {
			sendStatus = 'error';
			sendMessage = error instanceof Error ? error.message : 'Unable to send story to Flowmotion.';
		}
	}

	onMount(() => {
		window.addEventListener('message', handleMessage);
		postToStoryblok('heightChange', { height: IFRAME_HEIGHT });
		postToStoryblok('getContext');
		hasRequestedContext = true;

		const mockContextTimer = window.setTimeout(() => {
			if (context || !ENABLE_MOCK_CONTEXT) return;

			logAppBridge('Using mock context', mockContext);
			setContext(mockContext);
		}, MOCK_CONTEXT_DELAY);

		return () => {
			window.clearTimeout(mockContextTimer);
			window.removeEventListener('message', handleMessage);
		};
	});
</script>

<svelte:head>
	<title>Send to Flowmotion</title>
</svelte:head>

<main class="overflow-hidden bg-slate-50 p-2 text-slate-950">
	<section
		class="flex w-full min-w-0 flex-col gap-3 rounded-md border border-slate-200 bg-white p-3 shadow-sm"
	>
		<div class="min-w-0">
			<p class="text-xs font-medium text-slate-500">Storyblok Tool Plugin</p>
			<h1 class="mt-1 text-2xl leading-tight font-semibold break-words">Send to Flowmotion</h1>
		</div>

		<div class="min-w-0 rounded-md border border-dashed border-slate-300 bg-slate-50 p-3">
			{#if context}
				<p class="text-sm font-medium break-words text-slate-900">Story: {context.story.name}</p>
				{#if ENABLE_MOCK_CONTEXT && context === mockContext}
					<p class="mt-1 text-xs text-slate-500">Local mock context</p>
				{/if}
			{:else if hasRequestedContext}
				<p class="text-sm text-slate-600">Waiting for Storyblok context.</p>
			{:else}
				<p class="text-sm text-slate-600">Loading Send to Flowmotion.</p>
			{/if}
		</div>

		<div class="min-w-0 rounded-md border border-slate-200 bg-white p-3 text-sm">
			{#if configStatus === 'idle' || configStatus === 'loading'}
				<p class="text-slate-600">Checking plugin configuration.</p>
			{:else if configStatus === 'error'}
				<p class="font-medium text-red-700">Configuration check failed.</p>
				<p class="mt-1 break-words text-red-600">{configError}</p>
			{:else if config && !config.authenticated}
				<p class="font-medium text-slate-900">Connect Storyblok</p>
				<p class="mt-1 text-slate-600">
					Authentication is required before reading plugin settings.
				</p>
				<button
					type="button"
					onclick={connectStoryblok}
					class="mt-3 rounded-md bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800"
				>
					Connect Storyblok
				</button>
				{#if config.missing?.length}
					<ul class="mt-2 grid gap-1 text-xs text-slate-500">
						{#each config.missing as item (item)}
							<li>{item}</li>
						{/each}
					</ul>
				{/if}
			{:else if config && !config.configured}
				<p class="font-medium text-slate-900">Please set up Send to Flowmotion.</p>
				<p class="mt-1 text-slate-600">Add these keys in the plugin space-level settings:</p>
				<ul class="mt-2 grid gap-1 text-slate-700">
					{#each config.setup?.requiredKeys ?? ['webhook_url', 'http_method'] as key (key)}
						<li><code class="rounded bg-slate-100 px-1 py-0.5">{key}</code></li>
					{/each}
				</ul>
				{#if config.missing?.length}
					<ul class="mt-2 grid gap-1 text-xs text-slate-500">
						{#each config.missing as item (item)}
							<li>{item}</li>
						{/each}
					</ul>
				{/if}
			{:else if config}
				<p class="font-medium text-emerald-700">Plugin configured.</p>
				<p class="mt-1 text-slate-600">
					Webhook is configured. Method: {config.settings?.httpMethod ?? 'POST'}.
				</p>
			{/if}
		</div>

		<button
			type="button"
			disabled={!canSend || sendStatus === 'sending'}
			onclick={sendToFlowmotion}
			class={[
				'rounded-md px-4 py-2 text-sm font-medium',
				canSend && sendStatus !== 'sending'
					? 'bg-teal-700 text-white hover:bg-teal-800'
					: 'bg-slate-300 text-slate-600'
			]}
		>
			{sendStatus === 'sending' ? 'Sending...' : 'Send to Flowmotion'}
		</button>

		{#if sendStatus === 'sent'}
			<p class="text-sm font-medium text-emerald-700">{sendMessage}</p>
		{:else if sendStatus === 'error'}
			<p class="text-sm font-medium break-words text-red-700">{sendMessage}</p>
		{/if}

		{#if context}
			<div class="min-w-0 rounded-md border border-slate-200 bg-slate-50 p-3">
				<dl class="grid gap-3 text-sm text-slate-600">
					<div class="grid min-w-0 gap-1">
						<dt class="text-xs font-medium tracking-wide text-slate-500 uppercase">Slug</dt>
						<dd class="min-w-0 break-words text-slate-700">
							{context.story.full_slug ?? context.story.slug ?? 'Unknown'}
						</dd>
					</div>
					<div class="grid min-w-0 gap-1">
						<dt class="text-xs font-medium tracking-wide text-slate-500 uppercase">Story ID</dt>
						<dd class="min-w-0 break-words text-slate-700">{context.story.id ?? 'Unknown'}</dd>
					</div>
					<div class="grid min-w-0 gap-1">
						<dt class="text-xs font-medium tracking-wide text-slate-500 uppercase">Space ID</dt>
						<dd class="min-w-0 break-words text-slate-700">{context.spaceId ?? 'Unknown'}</dd>
					</div>
					{#if context.language}
						<div class="grid min-w-0 gap-1">
							<dt class="text-xs font-medium tracking-wide text-slate-500 uppercase">Language</dt>
							<dd class="min-w-0 break-words text-slate-700">{context.language}</dd>
						</div>
					{/if}
				</dl>
			</div>
		{/if}
	</section>
</main>
