<svelte:head>
	<title>Send to Flowmotion</title>
</svelte:head>

<main class="min-h-screen bg-slate-50 p-4 text-slate-950">
	<section
		class="mx-auto flex max-w-md flex-col gap-4 rounded-md border border-slate-200 bg-white p-5 shadow-sm"
	>
		<div>
			<p class="text-sm font-medium text-slate-500">Storyblok Tool Plugin</p>
			<h1 class="mt-1 text-xl font-semibold">Send to Flowmotion</h1>
		</div>

		<div class="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4">
			<p class="text-sm text-slate-600">Waiting for Storyblok context.</p>
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
