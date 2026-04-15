<script>
	import { AlertCircle, Calendar, Check, CheckCircle, File, MessageCircle, Send, ShowerHead, X } from "lucide-svelte";
	import Modal from "../global/modals/Modal.svelte";
	import TextS from "../global/TextS.svelte";
	import { apiUrl, get, patchJson } from "$lib/utils/api";
	import { onMount } from "svelte";
	import { error, formatDate, success } from "$lib/utils/ui";
	import ConfirmModal from "../global/modals/ConfirmModal.svelte";
	import InputTextArea from "../global/InputTextArea.svelte";
	import ButtonM from "../global/ButtonM.svelte";
	import TextM from "../global/TextM.svelte";

    let {
        profile = $bindable(null),
        reqKey,
        reqDisplay,
    } = $props();

    let folderKey = $derived({
        req_company_profile: 'profile',
        req_business_permit: 'permit',
        req_sec: 'sec',
        req_dti_cda: 'dti',
        req_reg_of_est: 'reg_est',
        req_cert_from_dole: 'cert_dole',
        req_cert_no_case: 'cert_npc',
        req_philjobnet_reg: 'reg_pjn',
        req_list_of_vacancies: 'lov',
    }[reqKey]);

    let status = $derived(profile.profile['stat_' + reqKey]);
    let opened = $state(false);
    let showApprovalConfirmation = $state(false);
    let confirmRevisionReq = $state({ item: null, show: false });
    let revisionReason = $state({ value: '', error: '' });
    let revisionInfo = $state({ value: null, show: false });
    
    async function onApprove() {
        await patchJson(`/api/user/company/approve/${profile.id}/${reqKey}`, null,
            {
                onSuccess: async (data) => {
                    profile.profile['stat_' + reqKey] = 'Approved';
                    showApprovalConfirmation = false;
                    success(data?.message ?? 'Requirement has been approved');
                },
                onFail: async (err) => success(err?.message ?? 'Unable to approve requirement.')
            }
        );
    }
    
    async function onRequestRevise() {
        if (
            !revisionReason.value.trim() ||
            revisionReason.error
        ) {
            error('Cannot request for revision yet.');
            return;
        }
        
        await patchJson(`/api/user/company/request-revise/${profile.id}/${reqKey}`,
            { reason: revisionReason.value.trim()},
            {
                onSuccess: async (data) => {
                    profile.profile['stat_' + reqKey] = 'For Revision';
                    confirmRevisionReq.show = false;
                    success(data?.message ?? 'Requested for the requirement to be revised.');
                },
                onFail: async (err) => success(err?.message ?? 'Unable to request revision for the requirement.')
            }
        );
    }

    async function onLoadRevisionInfo() {
        await get(`/api/user/company/revision-info/${profile.id}/${reqKey}`, {
            onSuccess: async (data) => {
                revisionInfo.value = data;
                revisionInfo.show = true;
                console.log(data);
            },
            onFail: async (err) => error('Failed to fetch revision request information.')
        });
    }
</script>

<div class="flex items-center justify-between gap-y-1">
    <div class="flex items-center justify-between">
        <div class="flex items-center gap-x-3">
            <div class="bg-gray-100 border border-gray-200 w-8 h-8 rounded-sm flex items-center justify-center">
                <File class='w-4 text-gray-400'/>
            </div>
            <div class="min-w-22">
                {#if status === 'Approved'}
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-600">Approved</span>
                {:else if status === 'Pending'}
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-50 text-yellow-600">Pending</span>
                {:else}
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-600">For Revision</span>
                {/if}
            </div>
            <TextS>{reqDisplay}</TextS>
        </div>
    </div>
    <div class="flex items-center gap-x-2">
        {#if !opened}
            <button
                Icon={X}
                label='Close'
                onclick={async () => {
                    if (status === 'For Revision') {
                        await onLoadRevisionInfo();
                    } else {
                        opened = true;
                    }
                }}
                class="text-xs px-3 py-1 rounded border transition-colors cursor-pointer border-blue-100 text-blue-500 hover:bg-blue-50"
            >
                View
            </button>
        {/if}
        {#if ['Pending', 'For Revision'].includes(status)}
            <button
                Icon={X}
                label='Close'
                onclick={() => showApprovalConfirmation = true}
                class="text-xs px-3 py-1 rounded border transition-colors cursor-pointer border-green-100 text-green-500 hover:bg-green-50"
            >
                Approve
            </button>
            <button
                Icon={X}
                label='Close'
                onclick={() => confirmRevisionReq.show = true}
                class="text-xs px-3 py-1 rounded border transition-colors cursor-pointer border-red-100 text-red-500 hover:bg-red-50"
            >
                Request Revision
            </button>
        {/if}
    </div>
</div>

{#if status === 'For Revision'}
    <Modal
        bind:show={revisionInfo.show}
        heading={reqDisplay}
        class='md:w-2/3 h-full gap-y-0 overflow-y-auto'
    >
        <div class="flex flex-col gap-y-2 p-4 pl-0">
            <TextS class='text-gray-700/75'>Revision Request Information</TextS>
            <div class="flex flex-col gap-y-2">
                <div class="flex items-center gap-x-2">
                    <Calendar class='w-4 text-gray-400'/>
                    <TextS>Rejected on: <span class="text-gray-600 font-bold">{formatDate(revisionInfo.value.created_at)}</span></TextS>
                </div>
                <div class="flex flex-col items-stretch">
                    <div class="flex items-center gap-x-2">
                        <AlertCircle class='w-4 text-red-900/65'/>
                        <TextS class='text-red-900'>Rejection reason:</TextS>
                    </div>
                    <div class="text-sm rounded text-gray-600 ml-6 pt-1">
                        {revisionInfo.value.message}
                    </div>
                </div>
            </div>
        </div>

        <div class="flex flex-col gap-y-2 p-4 border-t border-gray-100 pl-0">
            <div class="flex items-center justify-between">
                <TextS class='text-gray-700/75'>Appeal Information</TextS>
            </div>
            <div class="flex flex-col gap-y-2">
                {#if revisionInfo.value.appeal}
                    <div class="flex items-center gap-x-2">
                        <Calendar class='w-4 text-gray-400'/>
                        <TextS>Appealed on: <span class="text-gray-600 font-bold">{formatDate(revisionInfo.value.appeal.created_at)}</span></TextS>
                    </div>
                    <div class="flex flex-col items-stretch">
                        <div class="flex items-center gap-x-2">
                            <MessageCircle class='w-4 text-gray-400'/>
                            <TextS class='text-gray-600'>Appeal:</TextS>
                        </div>
                        <div class="text-sm rounded text-gray-600 ml-6 pt-1">
                            {revisionInfo.value.appeal.message}
                        </div>
                    </div>
                {:else}
                    <TextS>{profile.profile.name} has not appealed yet.</TextS>
                {/if}
            </div>
        </div>
        
        <iframe
            frameborder="0"
            title={reqDisplay}
            src={apiUrl('/Uploads/company/' + folderKey + '/' + profile.profile[reqKey] + '#toolbar=0&navpanes=0view=Fit')}
            class="scrollbar grow bg-white rounded-lg overflow-clip min-h-full"
        >
        </iframe>
    </Modal>
{:else}
    <Modal
        bind:show={opened}
        heading={reqDisplay}
        class='md:w-2/3 h-full'
    >
        <iframe
            frameborder="0"
            title={reqDisplay}
            src={apiUrl('/Uploads/company/' + folderKey + '/' + profile.profile[reqKey] + '#toolbar=0&navpanes=0view=Fit')}
            class="scrollbar grow bg-white rounded-lg overflow-clip"
        >
        </iframe>
    </Modal>
{/if}

<ConfirmModal
    bind:show={showApprovalConfirmation}
    text='Approve requirement?'
    onConfirm={onApprove}
/>

<Modal
    bind:show={confirmRevisionReq.show}
    heading='Revision Request'
    class='gap-y-0'
>
    <InputTextArea
        label='Revision reason'
        bind:value={revisionReason.value}
        bind:error={revisionReason.error}
        minLength={1}
        maxLength={1000}
        placeholder='Please enter your reason for requesting a revision for the requirment'
        onInput={(value) => {
            if (!revisionReason.value.trim()) {
                revisionReason.error = 'Reason for revision is required.';
            } else if (revisionReason.value.trim() > 1000){
                revisionReason.error = 'Reason for revision must not exceed 100 characters.';
            } else {
                revisionReason.error = '';
            }
        }}
    />

    <ButtonM 
        Icon={Send}
        label='Request'
        onclick={onRequestRevise}
        class='mt-2'
    />
</Modal>