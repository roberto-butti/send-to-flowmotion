<script lang="ts">
	import { env } from '$env/dynamic/public';
	import { onMount } from 'svelte';

	const PLUGIN_SLUG = env.PUBLIC_STORYBLOK_TOOL_PLUGIN_SLUG || 'your-org@send-to-flowmotion';
	const DEBUG_APP_BRIDGE = env.PUBLIC_DEBUG_APP_BRIDGE === 'true';
	const IFRAME_HEIGHT = 320;

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

	let context: StoryblokContext | undefined = $state();
	let hasRequestedContext = $state(false);

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
			context = {
				story: message.story,
				spaceId: message.spaceId,
				language: message.language
			};
		}
	}

	onMount(() => {
		window.addEventListener('message', handleMessage);
		postToStoryblok('heightChange', { height: IFRAME_HEIGHT });
		postToStoryblok('getContext');
		hasRequestedContext = true;

		return () => {
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
				<dl class="mt-3 grid gap-3 text-sm text-slate-600">
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
			{:else if hasRequestedContext}
				<p class="text-sm text-slate-600">Waiting for Storyblok context.</p>
			{:else}
				<p class="text-sm text-slate-600">Loading Send to Flowmotion.</p>
			{/if}
		</div>

		<button
			type="button"
			disabled
			class="rounded-md bg-slate-300 px-4 py-2 text-sm font-medium text-slate-600"
		>
			Send to Flowmotion
		</button>
	</section>
</main>
