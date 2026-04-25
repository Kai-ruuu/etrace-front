<script>
    import BaseContainer from "$lib/components/global/BaseContainer.svelte";
    import ButtonM from "$lib/components/global/ButtonM.svelte";
    import RoundedCard from "$lib/components/global/RoundedCard.svelte";
    import { GraduationCap, Briefcase, Check } from "lucide-svelte";
    import { goto } from "$app/navigation";

    const roles = [
        {
            id: "alumni",
            label: "Alumni",
            description: "Discover job opportunities posted by companies in the network.",
            Icon: GraduationCap,
            href: "/registration/alumni"
        },
        {
            id: "company",
            label: "Company",
            description: "Post job openings and connect with qualified alumni candidates.",
            Icon: Briefcase,
            href: "/registration/company"
        }
    ];

    let selectedRole = $state(null);
</script>

<BaseContainer withBgImage={true} class="animate-bg">
    <div class="bg-white/50 w-full h-full flex items-center justify-center">
        <RoundedCard class="p-8 pb-6 md:w-2/5 rounded-xl flex flex-col gap-y-5">

            <div>
                <h1 class="text-lg font-medium text-gray-900">Create your account</h1>
                <p class="text-sm text-gray-500 mt-0.5">Choose how you'll be using the E-trace+:</p>
            </div>

            <div class="grid grid-cols-2 gap-3">
                {#each roles as role}
                    <button
                        onclick={() => selectedRole = role.id}
                        class="relative flex flex-col items-start gap-y-2 p-4 rounded-lg border text-left transition-all cursor-pointer
                            {selectedRole === role.id
                                ? 'border-blue-900 bg-blue-50 border'
                                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'}"
                    >
                        {#if selectedRole === role.id}
                            <span class="absolute top-3 right-3 bg-blue-900 text-white rounded-full p-0.5">
                                <Check class="w-3 h-3" />
                            </span>
                        {/if}

                        <span class="p-2 rounded-lg {role.id === 'alumni' ? 'bg-blue-100' : 'bg-green-100'}">
                            <role.Icon class="min-w-4 min-h-4 {role.id === 'alumni' ? 'text-blue-900' : 'text-green-700'}" />
                        </span>

                        <div>
                            <p class="text-sm font-medium {selectedRole === role.id ? 'text-blue-900' : 'text-gray-800'}">
                                {role.label}
                            </p>
                            <p class="text-xs text-gray-500 leading-relaxed mt-0.5">
                                {role.description}
                            </p>
                        </div>
                    </button>
                {/each}
            </div>

            <hr class="border-gray-100" />

            <ButtonM
                label={selectedRole ? `Continue as ${roles.find(r => r.id === selectedRole)?.label}` : "Proceed"}
                disabled={!selectedRole}
                onclick={() => {
                    const role = roles.find(r => r.id === selectedRole);
                    if (role) goto(role.href, { replaceState: true });
                }}
                class="w-full justify-center"
            />

            <p class="text-xs text-center text-gray-400">
                Already have an account?
                <a href="/" class="text-blue-600 font-medium hover:underline">Sign in</a>
            </p>

        </RoundedCard>
    </div>
</BaseContainer>