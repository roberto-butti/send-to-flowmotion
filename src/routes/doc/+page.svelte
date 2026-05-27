<script lang="ts">
	import { resolve } from '$app/paths';
	import favicon from '$lib/assets/favicon.svg';

	const appUrl = 'https://send-to-flowmotion.vercel.app/';
	const installUrl = 'https://app.storyblok.com/#/install/roberto-b@tool-plugin-send-to-flowmotion';
	const sourceCodeUrl = 'https://github.com/roberto-butti/send-to-flowmotion';
	const articleUrl =
		'https://dev.to/robertobutti/building-an-effective-storyblok-tool-plugin-with-sveltekit-1nf1';
	const oauthCallbackUrl = 'https://send-to-flowmotion.vercel.app/api/connect/callback';
	const oauthSignInUrl = 'https://send-to-flowmotion.vercel.app/api/connect/storyblok';

	const useCases = [
		'Publish or repurpose a specific story at the exact moment an editor chooses.',
		'Send the current Storyblok story payload to Flowmotion without rebuilding it later.',
		'Start review, notification, export, or social publishing workflows from the Visual Editor.'
	];

	const setupSteps = [
		{
			title: 'Install the Tool Plugin',
			body: 'Open the Storyblok installation URL, choose the space where editors will use it, and complete the app installation flow.'
		},
		{
			title: 'Confirm the hosted plugin URL',
			body: 'The Tool Plugin should load the hosted SvelteKit app served from https://send-to-flowmotion.vercel.app/. App Bridge must stay enabled so Storyblok can pass the current story context into the iframe.'
		},
		{
			title: 'Connect Storyblok',
			body: 'Open the plugin from the Visual Editor and use the Connect Storyblok action if authentication is required. OAuth lets the backend read the plugin settings for the current space.'
		},
		{
			title: 'Configure Flowmotion',
			body: 'In the installed plugin settings for the space, add webhook_url with your Flowmotion webhook endpoint and http_method with POST.'
		},
		{
			title: 'Send a story',
			body: 'Open a story in the Visual Editor, go to Tools, select Send to Flowmotion, and trigger the workflow for that story.'
		}
	];

	const settings = [
		{
			key: 'webhook_url',
			value: 'https://your-flowmotion-webhook.example.com/...',
			note: 'Flowmotion webhook endpoint that receives the Storyblok story payload.'
		},
		{
			key: 'http_method',
			value: 'POST',
			note: 'The request method used by the backend when forwarding the story to Flowmotion.'
		}
	];
</script>

<svelte:head>
	<title>Send to Flowmotion Documentation</title>
	<meta
		name="description"
		content="Documentation for installing and using the Send to Flowmotion Storyblok Tool Plugin."
	/>
</svelte:head>

<main class="min-h-screen bg-zinc-50 text-zinc-950">
	<section class="border-b border-zinc-200 bg-white">
		<div class="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-14">
			<div class="min-w-0">
				<a
					href={resolve('/')}
					class="inline-flex items-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-800"
				>
					<img src={favicon} alt="" class="h-5 w-5" />
					Send to Flowmotion
				</a>
				<h1 class="mt-5 max-w-3xl text-4xl leading-tight font-semibold text-zinc-950 sm:text-5xl">
					Storyblok Tool Plugin for manual Flowmotion workflows
				</h1>
				<p class="mt-5 max-w-2xl text-lg leading-8 text-zinc-600">
					Send to Flowmotion adds an editor-controlled action inside the Storyblok Visual
					Editor. It reads the current story context and forwards that story payload to a
					configured Flowmotion webhook.
				</p>
				<div class="mt-7 flex flex-wrap gap-3">
					<a
						href={installUrl}
						class="rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
					>
						Install in Storyblok
					</a>
					<a
						href={appUrl}
						class="rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-100"
					>
						Open hosted app
					</a>
				</div>
				<div class="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
					<a class="font-medium text-teal-700 hover:text-teal-800" href={sourceCodeUrl}>
						Source code
					</a>
					<a class="font-medium text-teal-700 hover:text-teal-800" href={articleUrl}>
						Build article
					</a>
				</div>
			</div>

			<aside class="min-w-0 rounded-md border border-zinc-200 bg-zinc-50 p-5">
				<h2 class="text-sm font-semibold tracking-wide text-zinc-500 uppercase">Plugin details</h2>
				<dl class="mt-4 grid gap-4 text-sm">
					<div class="min-w-0">
						<dt class="font-medium text-zinc-900">Install URL</dt>
						<dd class="mt-1 break-words text-zinc-600">
							<a class="text-teal-700 hover:text-teal-800" href={installUrl}>{installUrl}</a>
						</dd>
					</div>
					<div class="min-w-0">
						<dt class="font-medium text-zinc-900">Served by</dt>
						<dd class="mt-1 break-words text-zinc-600">
							<a class="text-teal-700 hover:text-teal-800" href={appUrl}>{appUrl}</a>
						</dd>
					</div>
					<div class="min-w-0">
						<dt class="font-medium text-zinc-900">OAuth callback</dt>
						<dd class="mt-1 break-words text-zinc-600">{oauthCallbackUrl}</dd>
					</div>
					<div class="min-w-0">
						<dt class="font-medium text-zinc-900">OAuth sign-in</dt>
						<dd class="mt-1 break-words text-zinc-600">{oauthSignInUrl}</dd>
					</div>
					<div class="min-w-0">
						<dt class="font-medium text-zinc-900">Source code</dt>
						<dd class="mt-1 break-words text-zinc-600">
							<a class="text-teal-700 hover:text-teal-800" href={sourceCodeUrl}>{sourceCodeUrl}</a>
						</dd>
					</div>
					<div class="min-w-0">
						<dt class="font-medium text-zinc-900">Implementation article</dt>
						<dd class="mt-1 break-words text-zinc-600">
							<a class="text-teal-700 hover:text-teal-800" href={articleUrl}>{articleUrl}</a>
						</dd>
					</div>
				</dl>
			</aside>
		</div>
	</section>

	<section class="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
		<div>
			<p class="text-sm font-semibold tracking-wide text-teal-700 uppercase">What it is</p>
			<h2 class="mt-2 text-2xl font-semibold text-zinc-950">A Storyblok tool for one story at a time</h2>
		</div>
		<div class="prose prose-zinc max-w-none">
			<p>
				A Storyblok Tool Plugin is a hosted web app that appears in the Visual Editor Tools
				panel. This plugin is built with SvelteKit and loaded by Storyblok in an iframe.
			</p>
			<p>
				When an editor opens it, App Bridge provides the current story, space, and language.
				The backend then checks whether the space has Flowmotion webhook settings and sends the
				current story to that webhook only when the editor clicks the send button.
			</p>
		</div>
	</section>

	<section class="border-y border-zinc-200 bg-white">
		<div class="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
			<div>
				<p class="text-sm font-semibold tracking-wide text-teal-700 uppercase">Why it exists</p>
				<h2 class="mt-2 text-2xl font-semibold text-zinc-950">Manual control for editorial workflows</h2>
			</div>
			<ul class="grid gap-3">
				{#each useCases as useCase (useCase)}
					<li class="rounded-md border border-zinc-200 bg-zinc-50 p-4 text-zinc-700">{useCase}</li>
				{/each}
			</ul>
		</div>
	</section>

	<section class="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
		<div>
			<p class="text-sm font-semibold tracking-wide text-teal-700 uppercase">Installation</p>
			<h2 class="mt-2 text-2xl font-semibold text-zinc-950">Install and configure the plugin</h2>
		</div>
		<ol class="grid gap-4">
			{#each setupSteps as step, index (step.title)}
				<li class="grid gap-2 rounded-md border border-zinc-200 bg-white p-4">
					<div class="flex items-center gap-3">
						<span class="flex h-7 w-7 items-center justify-center rounded-full bg-teal-700 text-sm font-semibold text-white">
							{index + 1}
						</span>
						<h3 class="text-base font-semibold text-zinc-950">{step.title}</h3>
					</div>
					<p class="text-sm leading-6 text-zinc-600">{step.body}</p>
				</li>
			{/each}
		</ol>
	</section>

	<section class="border-t border-zinc-200 bg-white">
		<div class="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
			<div>
				<p class="text-sm font-semibold tracking-wide text-teal-700 uppercase">Space settings</p>
				<h2 class="mt-2 text-2xl font-semibold text-zinc-950">Flowmotion webhook keys</h2>
			</div>
			<div class="overflow-hidden rounded-md border border-zinc-200">
				<table class="w-full border-collapse text-left text-sm">
					<thead class="bg-zinc-100 text-zinc-700">
						<tr>
							<th class="px-4 py-3 font-semibold">Key</th>
							<th class="px-4 py-3 font-semibold">Example value</th>
							<th class="px-4 py-3 font-semibold">Purpose</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-zinc-200 bg-white">
						{#each settings as setting (setting.key)}
							<tr>
								<td class="px-4 py-3 align-top">
									<code class="rounded bg-zinc-100 px-1.5 py-0.5 text-zinc-900">{setting.key}</code>
								</td>
								<td class="px-4 py-3 align-top break-words text-zinc-700">{setting.value}</td>
								<td class="px-4 py-3 align-top text-zinc-600">{setting.note}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</section>

	<section class="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
		<div>
			<p class="text-sm font-semibold tracking-wide text-teal-700 uppercase">References</p>
			<h2 class="mt-2 text-2xl font-semibold text-zinc-950">Learn from the implementation</h2>
		</div>
		<div class="grid gap-4">
			<a
				href={sourceCodeUrl}
				class="rounded-md border border-zinc-200 bg-white p-4 hover:border-teal-300"
			>
				<h3 class="text-base font-semibold text-zinc-950">Plugin source code</h3>
				<p class="mt-2 text-sm leading-6 text-zinc-600">
					Review the SvelteKit routes, Storyblok OAuth handling, App Bridge integration, and
					webhook forwarding code used by this plugin.
				</p>
				<p class="mt-3 break-words text-sm font-medium text-teal-700">{sourceCodeUrl}</p>
			</a>
			<a
				href={articleUrl}
				class="rounded-md border border-zinc-200 bg-white p-4 hover:border-teal-300"
			>
				<h3 class="text-base font-semibold text-zinc-950">Build article</h3>
				<p class="mt-2 text-sm leading-6 text-zinc-600">
					Read the walkthrough explaining how to build an effective Storyblok Tool Plugin with
					SvelteKit, using this project as the concrete example.
				</p>
				<p class="mt-3 break-words text-sm font-medium text-teal-700">{articleUrl}</p>
			</a>
		</div>
	</section>
</main>
