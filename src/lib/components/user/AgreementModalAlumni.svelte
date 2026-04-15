<script>
	import { Check, Info, X } from "lucide-svelte";
	import { twMerge } from "tailwind-merge";
	import ButtonM from "../global/ButtonM.svelte";
	import RoundedCard from "../global/RoundedCard.svelte";
	import TextM from "../global/TextM.svelte";
	import TextS from "../global/TextS.svelte";
	import { get, patchJson, postForm } from "$lib/utils/api";
	import { user } from "$lib/stores/user";
	import { error, success } from "$lib/utils/ui";
	import { goto } from "$app/navigation";

    let {
        data,
        show = $bindable(false),
    } = $props();
    let agreed = $state(false);

    async function onProceed() {
        await postForm(`/api/auth/register/alumni`, data, {
            onSuccess: async (data) => {
                
            },
            onFail: async (err) => error(err?.message ?? 'Unable to proceed due to an error.')
        });
    }

    async function onExit() {
        show = false;
    }
</script>

{#if show}
    <div class="fixed w-screen h-dvh bg-gray-300/50 p-8 flex items-center justify-center inset-0 z-100">
        <RoundedCard class='flex flex-col items-stretch w-full md:w-3/5 gap-y-4 relative py-0 max-h-full overflow-auto scrollbar'>
            <div class="flex items-center justify-between sticky top-0 bg-white pt-6 pb-2">
                <TextM>Alumni Privacy Notice & Consent</TextM>
                <ButtonM
                    Icon={X}
                    onclick={onExit}
                    class='p-0 px-1 bg-red-500'
                />
            </div>
            
            <div class="space-y-4 text-justify">
                <TextM>1. Introduction</TextM>
                <TextS>Welcome to the CCT Alumni Career Tracking and Employment Analytics System (E-Trace). The City College of Tagaytay (CCT) is committed to protecting your personal data in accordance with the Data Privacy Act of 2012. By registering in this system, you support the institution in improving academic programs, meeting accreditation requirements, and monitoring the career outcomes of its graduates.</TextS>
            </div>

            <hr class="border-t border-gray-200 mb-2">
            
            <div class="space-y-4 text-justify">
                <TextM>2. Information We Collect</TextM>
                <TextS>The system collects only necessary personal and employment information, including:</TextS>
                <div>
                    <TextS>Personal Information:</TextS>
                    <ul class="list-disc list-inside">
                        <li class="flex items-center">
                            <TextS>● Full name</TextS>
                        </li>
                        <li class="flex items-center">
                            <TextS>● Date of birth</TextS>
                        </li>
                        <li class="flex items-center">
                            <TextS>● Phone number</TextS>
                        </li>
                        <li class="flex items-center">
                            <TextS>● Email address</TextS>
                        </li>
                        <li class="flex items-center">
                            <TextS>● Current home address</TextS>
                        </li>
                    </ul>
                </div>
                <div>
                    <TextS>Employment Information:</TextS>
                    <ul class="list-disc list-inside">
                        <li class="flex items-center">
                            <TextS>● Employment status (e.g., employed, unemployed, self-employed)</TextS>
                        </li>
                        <li class="flex items-center">
                            <TextS>● Current job position</TextS>
                        </li>
                        <li class="flex items-center">
                            <TextS>● Company name</TextS>
                        </li>
                        <li class="flex items-center">
                            <TextS>● Company address</TextS>
                        </li>
                    </ul>
                </div>
            </div>

            <hr class="border-t border-gray-200 mb-2">
            
            <div class="space-y-4 text-justify">
                <TextM>3. Purpose of Data Collection</TextM>
                <div>
                    <TextS>All collected data will be used strictly for institutional purposes, including:</TextS>
                    <ul class="list-disc list-inside">
                        <li class="flex items-center">
                            <TextS>● Monitoring alumni employment status and career progression</TextS>
                        </li>
                        <li class="flex items-center">
                            <TextS>● Generating statistical reports for academic evaluation and planning</TextS>
                        </li>
                        <li class="flex items-center">
                            <TextS>● Supporting curriculum improvement and accreditation requirements</TextS>
                        </li>
                        <li class="flex items-center">
                            <TextS>● Strengthening alumni engagement and institutional development</TextS>
                        </li>
                    </ul>
                </div>

                <TextS class='font-bold text-gray-700/80'>Note: All reports and analytics will be presented in aggregated and anonymized form, and no personal data will be publicly disclosed.</TextS>
            </div>

            <hr class="border-t border-gray-200 mb-2">
            
            <div class="space-y-4 text-justify">
                <TextM>4. Data Privacy and Protection</TextM>
                <div>
                    <TextS>The system is designed in accordance with the Data Privacy Act of 2012 (RA 10173) and follows these principles:</TextS>
                    <ul class="list-disc list-inside">
                        <li class="flex items-center">
                            <TextS>● Data Minimization: Only necessary information is collected</TextS>
                        </li>
                        <li class="flex items-center">
                            <TextS>● Confidentiality: Access is limited to authorized personnel</TextS>
                        </li>
                        <li class="flex items-center">
                            <TextS>● Security: Secure login and access control mechanisms are implemented</TextS>
                        </li>
                        <li class="flex items-center">
                            <TextS>● Integrity: Data is protected against unauthorized modification</TextS>
                        </li>
                    </ul>
                </div>
            </div>

            <hr class="border-t border-gray-200 mb-2">
            
            <div class="space-y-4 text-justify mb-4">
                <TextM>5. Rights of the Data Subject</TextM>
                <div>
                    <TextS>By accessing the system, I confirm that:</TextS>
                    <ul class="list-disc list-inside">
                        <li class="flex items-center">
                            <TextS>● Access and review your personal data</TextS>
                        </li>
                        <li class="flex items-center">
                            <TextS>● Update or correct your information to ensure accuracy</TextS>
                        </li>
                        <li class="flex items-center">
                            <TextS>● Request account deactivation</TextS>
                        </li>
                        <li class="flex items-center">
                            <TextS>● Request deletion of your personal data, subject to institutional policies and legal requirements</TextS>
                        </li>
                    </ul>
                    <TextS>The institution may retain limited necessary data for legitimate academic, research, and reporting purposes in accordance with applicable laws.</TextS>
                </div>
            </div>

            <hr class="border-t border-gray-200 mb-2">
            
            <div class="space-y-4 text-justify mb-4">
                <TextM>6. Declaration and Consent</TextM>
                <div>
                    <TextS>By selecting “I Agree” or registering in the system, I confirm that:</TextS>
                    <ul class="list-disc list-inside">
                        <li class="flex items-center">
                            <TextS>● I have read and understood this Privacy Notice</TextS>
                        </li>
                        <li class="flex items-center">
                            <TextS>● I voluntarily provide my personal and employment information</TextS>
                        </li>
                        <li class="flex items-center">
                            <TextS>● I understand that my data will be used solely for alumni tracking and institutional purposes of the City College of Tagaytay</TextS>
                        </li>
                        <li class="flex items-center">
                            <TextS>● I understand that my data will be used solely for alumni tracking and institutional purposes of the City College of Tagaytay</TextS>
                        </li>
                    </ul>
                    <TextS>The institution may retain limited necessary data for legitimate academic, research, and reporting purposes in accordance with applicable laws.</TextS>
                </div>
            </div>

            <div class="space-y-4 bg-white pt-4 pb-6 border-t border-gray-200">
                <label for="agree" class="flex items-center gap-x-2 cursor-pointer">
                    <input type="checkbox" id="agree" bind:checked={agreed} class="rounded">
                    <TextS>I have read and agree to the Terms and Conditions</TextS>
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
{/if}