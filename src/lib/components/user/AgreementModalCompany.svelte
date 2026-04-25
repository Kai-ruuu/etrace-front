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
        await postForm(`/api/auth/register/company`, data, {
            onSuccess: async (_data) => {
                show = false;
                success(_data?.message ?? 'You are now registered to E-trace+! Do not forget to verify your email.');
                goto('/', { replaceState: true });
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
                <TextM>Company Privacy Notice & Consent</TextM>
                <ButtonM
                    Icon={X}
                    onclick={onExit}
                    class='p-0 px-1 bg-red-500'
                />
            </div>
            
            <div class="space-y-4 text-justify">
                <TextM>1. Introduction</TextM>
                <TextS>Welcome to the CCT Alumni Career Tracking and Employment Analytics System (E-Trace). The City College of Tagaytay (CCT) is committed to handling company and representative data in accordance with the Data Privacy Act of 2012. By registering in the system, the company agrees to provide accurate information for verification and employment facilitation purposes.</TextS>
            </div>

            <hr class="border-t border-gray-200 mb-2">
            
            <div class="space-y-4 text-justify">
                <TextM>2. Information We Collect</TextM>
                <TextS>The system collects the following company-related information and documents:</TextS>
                <div>
                    <TextS>Company Profile Information:</TextS>
                    <ul class="list-disc list-inside">
                        <li class="flex items-center">
                            <TextS>● Company name</TextS>
                        </li>
                        <li class="flex items-center">
                            <TextS>● Email address</TextS>
                        </li>
                        <li class="flex items-center">
                            <TextS>● Contact details</TextS>
                        </li>
                        <li class="flex items-center">
                            <TextS>● Company address</TextS>
                        </li>
                    </ul>
                </div>
                <div>
                    <TextS>Verification Documents:</TextS>
                    <ul class="list-disc list-inside">
                        <li class="flex items-center">
                            <TextS>● Company Profile</TextS>
                        </li>
                        <li class="flex items-center">
                            <TextS>● Business Permit</TextS>
                        </li>
                        <li class="flex items-center">
                            <TextS>● SEC</TextS>
                        </li>
                        <li class="flex items-center">
                            <TextS>● DTI / CDA Reg.</TextS>
                        </li>
                        <li class="flex items-center">
                            <TextS>● Registry of Establishment fr. DOLE</TextS>
                        </li>
                        <li class="flex items-center">
                            <TextS>● Certification from DOLE Provincial Office</TextS>
                        </li>
                        <li class="flex items-center">
                            <TextS>● Certification of No. Pending Case</TextS>
                        </li>
                        <li class="flex items-center">
                            <TextS>● Phil-Jobnet Reg.</TextS>
                        </li>
                        <li class="flex items-center">
                            <TextS>● List of Vacancies (w/Qualifications and No. of Vacancies per position to be deployed at Tagaytay City)</TextS>
                        </li>
                    </ul>
                </div>
                <div>
                    <TextS>Employment Information:</TextS>
                    <ul class="list-disc list-inside">
                        <li class="flex items-center">
                            <TextS>● Job postings and list of vacancies</TextS>
                        </li>
                    </ul>
                </div>
            </div>

            <hr class="border-t border-gray-200 mb-2">
            
            <div class="space-y-4 text-justify">
                <TextM>3. Purpose of Data Collection</TextM>
                <div>
                    <TextS>The collected information will be used solely for:</TextS>
                    <ul class="list-disc list-inside">
                        <li class="flex items-center">
                            <TextS>● Verifying the legitimacy of the company</TextS>
                        </li>
                        <li class="flex items-center">
                            <TextS>● Approving and managing company accounts</TextS>
                        </li>
                        <li class="flex items-center">
                            <TextS>● Ensuring that job postings are valid and credible</TextS>
                        </li>
                        <li class="flex items-center">
                            <TextS>● Facilitating employment opportunities for alumni</TextS>
                        </li>
                        <li class="flex items-center">
                            <TextS>● Supporting institutional employment and reporting processes</TextS>
                        </li>
                    </ul>
                </div>
            </div>

            <hr class="border-t border-gray-200 mb-2">
            
            <div class="space-y-4 text-justify">
                <TextM>4. Data Protection</TextM>
                <div>
                    <TextS>All company data and submitted documents are handled with appropriate security measures, including:</TextS>
                    <ul class="list-disc list-inside">
                        <li class="flex items-center">
                            <TextS>● Restricted access to authorized personnel only</TextS>
                        </li>
                        <li class="flex items-center">
                            <TextS>● Secure storage of uploaded documents</TextS>
                        </li>
                        <li class="flex items-center">
                            <TextS>● Protection against unauthorized access, disclosure, or modification</TextS>
                        </li>
                    </ul>
                </div>
            </div>

            <hr class="border-t border-gray-200 mb-2">
            
            <div class="space-y-4 text-justify mb-4">
                <TextM>5. Responsibilities of the Company</TextM>
                <div>
                    <TextS>By registering, the company agrees to:</TextS>
                    <ul class="list-disc list-inside">
                        <li class="flex items-center">
                            <TextS>● Provide accurate, complete, and updated information</TextS>
                        </li>
                        <li class="flex items-center">
                            <TextS>● Submit valid and legitimate documents for verification</TextS>
                        </li>
                        <li class="flex items-center">
                            <TextS>● Post truthful and relevant job opportunities</TextS>
                        </li>
                        <li class="flex items-center">
                            <TextS>● Comply with system policies and verification procedures</TextS>
                        </li>
                    </ul>
                </div>
            </div>

            <hr class="border-t border-gray-200 mb-2">
            
            <div class="space-y-4 text-justify mb-4">
                <TextM>6. Declaration and Consent</TextM>
                <div>
                    <TextS>By selecting “I Agree” or registering in the system, the company confirms that:</TextS>
                    <ul class="list-disc list-inside">
                        <li class="flex items-center">
                            <TextS>● All submitted information and documents are accurate and authorized</TextS>
                        </li>
                        <li class="flex items-center">
                            <TextS>● The company consents to the collection and use of its data for verification and employment facilitation purposes</TextS>
                        </li>
                        <li class="flex items-center">
                            <TextS>● The company agrees to comply with system policies and applicable data protection regulations</TextS>
                        </li>
                    </ul>
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