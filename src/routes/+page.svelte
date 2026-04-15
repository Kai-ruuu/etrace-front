<script>
	import { page } from "$app/stores";
	import LoginForm from "$lib/components/auth/LoginForm.svelte";
	import { success } from "$lib/utils/ui";
	import { onMount } from "svelte";

	onMount(() => {
		let verified = $page.url.searchParams.get('verified') ?? null;

		if (verified)
			success('Your Etrace+ email is now verified!');
	});
</script>

<LoginForm />