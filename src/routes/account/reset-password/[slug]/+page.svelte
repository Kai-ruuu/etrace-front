<script>
	import { goto } from "$app/navigation";
	import BaseContainer from "$lib/components/global/BaseContainer.svelte";
	import ButtonM from "$lib/components/global/ButtonM.svelte";
	import RoundedCard from "$lib/components/global/RoundedCard.svelte";
	import TextM from "$lib/components/global/TextM.svelte";
	import TextS from "$lib/components/global/TextS.svelte";
	import { postJson } from "$lib/utils/api";
	import { error, success } from "$lib/utils/ui";
    import { page } from "$app/stores";
	import InputPass from "$lib/components/global/InputPass.svelte";

    let newPassword = $state({ value: '', error: '' });
    let confirmPassword = $state({ value: '', error: '' });
    
    function validateNewPassword(value) {
        const val = String(value);

        if (val.length === 0)
            newPassword.error = 'Password is required';
        else if (val.length < 8)
            newPassword.error = 'Password must have at least 8 characters';
        else if (val.length > 8)
            newPassword.error = 'Password must not exceed 65 characters';
        else
            newPassword.error = ''
    }
    
    function validateConfirmPassword(value) {
        const val = String(value);

        if (val.length === 0)
            confirmPassword.error = 'Password is required';
        else if (val.length < 8)
            confirmPassword.error = 'Password must have at least 8 characters';
        else if (val.length > 8)
            confirmPassword.error = 'Password must not exceed 65 characters';
        else if (val !== newPassword.value)
            confirmPassword.error = 'Passwords do not match';
        else
            confirmPassword.error = ''
    }

    async function validateAndResetPassword() {
        validateNewPassword(newPassword.value);
        validateConfirmPassword(confirmPassword.value);

        if (
            newPassword.error ||
            confirmPassword.error
        ) {
            error('Cannot reset password yet.');
            return;
        }

        await postJson('/api/user/reset-password',
            {
                new_password: newPassword.value,
                token: $page.params.slug
            },
            {
                onSuccess: async (_data) => {
                    newPassword = { value: '', error: '' };
                    confirmPassword = { value: '', error: '' };
                    success(_data?.message ?? 'Password has been reset. You may now try logging-in with your new password.');
                    goto('/');
                },
                onFail: async (err) => error(err?.message ?? 'Unable to reset password due to an error.'),
            }
        );
    }
</script>

<BaseContainer withBgImage={true} class="animate-bg">
    <div class="bg-white/50 w-full h-full flex items-center justify-center">
        <RoundedCard class="p-8 pb-6 md:w-2/7 rounded-xl flex flex-col gap-y-5">
            <div class="space-y-2">
                <TextM class='font-bold text-gray-600'>Password Reset</TextM>
                <TextS>Enter your Etrace+ account's new password.</TextS>
            </div>
            <div>
                <InputPass
                    label='Password'
                    placeholder='enter your new password'
                    bind:value={newPassword.value}
                    bind:error={newPassword.error}
                    onInput={validateNewPassword}
                />
                <InputPass
                    label='Re-type Password'
                    placeholder='re-enter your new password'
                    bind:value={confirmPassword.value}
                    bind:error={confirmPassword.error}
                    onInput={validateConfirmPassword}
                />
            </div>
            <div class="grid grid-cols-2 gap-x-4">
                <ButtonM
                    label='Cancel'
                    class='bg-red-500'
                    onclick={() => goto("/")}
                />
                <ButtonM
                    label='Reset Password'
                    onclick={validateAndResetPassword}
                />
            </div>
        </RoundedCard>
    </div>
</BaseContainer>