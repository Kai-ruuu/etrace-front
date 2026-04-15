<script>
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import BaseContainer from '$lib/components/global/BaseContainer.svelte';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<BaseContainer>{@render children()}</BaseContainer>
