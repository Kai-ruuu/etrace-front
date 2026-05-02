<script>
	import { goto } from "$app/navigation";
	import BaseContainer from "$lib/components/global/BaseContainer.svelte";
	import ButtonM from "$lib/components/global/ButtonM.svelte";
	import InputText from "$lib/components/global/InputText.svelte";
	import RoundedCard from "$lib/components/global/RoundedCard.svelte";
	import TextM from "$lib/components/global/TextM.svelte";
	import TextS from "$lib/components/global/TextS.svelte";
	import { postJson } from "$lib/utils/api";
	import { error, success } from "$lib/utils/ui";

    let email = $state({ value: '', error: '' });
    
    function validateEmail(value) {
        const val = String(value);

        if (val.length === 0)
            email.error = 'Email is required';
        else if (!val.includes('@'))
            email.error = 'Invalid email address';
        else
            email.error = ''
    }

    async function validateAndSubmitEmail() {
        validateEmail(email.value);

        if (email.error) {
            error('Cannot submit link yet.');
            return;
        }

        await postJson('/api/user/send-password-reset-link', { email: email.value }, {
            onSuccess: async (_data) => success(_data?.message ?? 'Link has been sent. You may now check your inbox.'),
            onFail: async (err) => error(err?.message ?? 'Unable to send password reset link due to an error.'),
        });
    }
</script>

<BaseContainer withBgImage={true} class="animate-bg">
    <div class="bg-white/50 w-full h-full flex items-center justify-center">
        <RoundedCard class="p-8 pb-6 md:w-2/7 rounded-xl flex flex-col gap-y-5">
            <div class="space-y-2">
                <TextM class='font-bold text-gray-600'>Send Password Reset Link</TextM>
                <TextS>Enter your Etrace+ account's email address so that we can send you a password reset link</TextS>
            </div>
            <InputText
                label='Email'
                placeholder='enter your email'
                bind:value={email.value}
                bind:error={email.error}
                onInput={validateEmail}
            />
            <div class="grid grid-cols-2 gap-x-4">
                <ButtonM
                    label='Cancel'
                    class='bg-red-500'
                    onclick={() => goto("/")}
                />
                <ButtonM
                    label='Send Link'
                    onclick={validateAndSubmitEmail}
                />
            </div>
        </RoundedCard>
    </div>
</BaseContainer>