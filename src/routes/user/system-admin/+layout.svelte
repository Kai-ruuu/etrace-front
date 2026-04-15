<script>
    import favicon from '$lib/assets/favicon.svg';
    import BaseContainer from '$lib/components/global/BaseContainer.svelte';
    import { onMount } from 'svelte';
    import { user } from '$lib/stores/user';
    import { goto } from '$app/navigation';
	import Sidebar from '$lib/components/user/Sidebar.svelte';
	import { get } from '$lib/utils/api';
	import { error } from '$lib/utils/ui';
	import TextM from '$lib/components/global/TextM.svelte';
	import Modal from '$lib/components/global/modals/Modal.svelte';
	import AgreementModal from '$lib/components/user/AgreementModal.svelte';
    
    let { children } = $props();

    onMount(async () => {
        await get('/api/auth/me', {
            onSuccess: async (data) => {
                if (!data) {
                    goto('/', { replaceState: true });
                    return;
                }

                if (data.role !== 'sysad') {
                    goto('/http/bad-request');
                    return;
                }
                
                user.set(data);
            },
            onFail: async (data, status) => {
                if (status === 400) goto('/', { replaceState: true });
                
                error(data?.message ?? 'An unknown error has occurred.');
            },
        });
    });
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{#if !$user}
    <BaseContainer>
        <TextM>Loading...</TextM>
    </BaseContainer>
{:else}
    {#if $user.profile.agreed_to_consent}
        <BaseContainer class='flex items-stretch'>
            <Sidebar />
            <div class="grow flex flex-col items-stretch h-dvh">
                {@render children()}
            </div>
        </BaseContainer>
    {:else}
        <AgreementModal forRole='System Administrator'/>
    {/if}
{/if}
