<script>
	import { Check, Info, X } from "lucide-svelte";
	import { twMerge } from "tailwind-merge";
	import ButtonM from "../global/ButtonM.svelte";
	import RoundedCard from "../global/RoundedCard.svelte";
	import TextM from "../global/TextM.svelte";
	import TextS from "../global/TextS.svelte";
	import { get, patchJson } from "$lib/utils/api";
	import { user } from "$lib/stores/user";
	import { error, success } from "$lib/utils/ui";
	import { goto } from "$app/navigation";

    let { forRole } = $props();
    let agreed = $state(false);
    let urlRoleSegment = $derived({
        'System Administrator': 'system-admin',
        'Dean': 'dean',
        'PESO Staff': 'peso-staff',
    }[forRole]);

    async function onProceed() {
        await patchJson(`/api/user/${urlRoleSegment}/agree-to-consent`, null, {
            onSuccess: async (data) => {
                $user = {
                    ...$user,
                    profile: {
                        ...$user.profile,
                        agreed_to_consent: true
                    }
                };
                success('Welcome to Etrace+!');
            },
            onFail: async (err) => error(err?.message ?? 'Unable to proceed due to an error.')
        });
    }

    async function onLogout() {
        await get('/api/auth', {
            onSuccess: async (data) => goto('/', { replaceState: true }),
            onFail: async (data) => goto('/', { replaceState: true })
        });
    }
</script>

<div class="fixed w-screen h-dvh bg-gray-300/50 p-8 flex items-center justify-center inset-0 z-100">
    <RoundedCard class='flex flex-col items-stretch w-full md:w-3/5 gap-y-4 relative py-0 max-h-full overflow-auto scrollbar'>
        <div class="flex items-center justify-between sticky top-0 bg-white pt-6 pb-2">
            <TextM>Data Access and Confidentiality Agreement</TextM>
            <ButtonM
                Icon={X}
                onclick={onLogout}
                class='p-0 px-1 bg-red-500'
            />
        </div>
        
        <div class="space-y-4 text-justify">
            <TextM>1. Introduction</TextM>
            <TextS>This system contains personal and employment-related data of alumni of the City College of Tagaytay. Access to this system is restricted to authorized personnel only.</TextS>
        </div>

        <hr class="border-t border-gray-200 mb-2">
        
        <div class="space-y-4 text-justify">
            <TextM>2. Access Responsibility</TextM>
            <TextS>By accessing the system, you acknowledge that you are authorized to view and manage data based on your assigned role <strong class="text-gray-700">({forRole})</strong>.</TextS>
        </div>

        <hr class="border-t border-gray-200 mb-2">
        
        <div class="space-y-4 text-justify">
            <TextM>3. Data Privacy Compliance</TextM>
            <TextS>All data accessed through the system must be handled in accordance with the Data Privacy Act of 2012.</TextS>
            <div>
                <TextS>You agree to:</TextS>
                <ul class="list-disc list-inside">
                    <li class="flex items-center">
                        <TextS>● Use the data only for official and institutional purposes</TextS>
                    </li>
                    <li class="flex items-center">
                        <TextS>● Protect the confidentiality of all personal information</TextS>
                    </li>
                    <li class="flex items-center">
                        <TextS>● Avoid unauthorized sharing, disclosure, or misuse of data</TextS>
                    </li>
                </ul>
            </div>
        </div>

        <hr class="border-t border-gray-200 mb-2">
        
        <div class="space-y-4 text-justify">
            <TextM>4. Security Responsibility</TextM>
            <div>
                <TextS>You are responsible for maintaining the security of your account, including:</TextS>
                <ul class="list-disc list-inside">
                    <li class="flex items-center">
                        <TextS>● Keeping login credentials confidential</TextS>
                    </li>
                    <li class="flex items-center">
                        <TextS>● Logging out after system use</TextS>
                    </li>
                    <li class="flex items-center">
                        <TextS>● Reporting any unauthorized access or data issues</TextS>
                    </li>
                </ul>
            </div>
        </div>

        <hr class="border-t border-gray-200 mb-2">
        
        <div class="space-y-4 text-justify mb-4">
            <TextM>5. Declaration</TextM>
            <div>
                <TextS>By accessing the system, I confirm that:</TextS>
                <ul class="list-disc list-inside">
                    <li class="flex items-center">
                        <TextS>● I understand my responsibility in handling sensitive data</TextS>
                    </li>
                    <li class="flex items-center">
                        <TextS>● I will comply with data privacy and system policies</TextS>
                    </li>
                    <li class="flex items-center">
                        <TextS>● I will use the system only for authorized purposes</TextS>
                    </li>
                </ul>
            </div>
        </div>

        <div class="space-y-4 bg-white pt-4 pb-6 border-t border-gray-200">
            <label for="agree" class="flex items-center gap-x-2 cursor-pointer">
                <input type="checkbox" id="agree" bind:checked={agreed} class="rounded">
                <TextS>I agree to the Data Access and Confidentiality Agreement</TextS>
            </label>
            <ButtonM
                disabled={!agreed}
                label='Proceed'
                onclick={onProceed}
                class='w-full'
            />
        </div>
    </RoundedCard>
</div>