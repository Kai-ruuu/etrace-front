<script>
	import RoundedCard from "../global/RoundedCard.svelte";
	import InputText from "../global/InputText.svelte";
	import TextL from "../global/TextL.svelte";
    import { Mail } from "lucide-svelte";
	import InputPass from "../global/InputPass.svelte";
	import Logo from "../global/Logo.svelte";
	import TextS from "../global/TextS.svelte";
	import ButtonM from "../global/ButtonM.svelte";
	import BaseContainer from "../global/BaseContainer.svelte";
	import { error, success } from "$lib/utils/ui";
	import { postJson } from "$lib/utils/api";
	import { user } from "$lib/stores/user";
	import { goto } from "$app/navigation";

    let email = $state({ value: '', error: '' });
    let password = $state({ value: '', error: '' });

    function gotoDashboard(user) {
        switch (user.role) {
            case 'sysad':
                goto('/user/system-admin', { replaceState: true });
                break;
            case 'dean':
                goto('/user/dean', { replaceState: true });
                break;
            case 'pstaff':
                goto('/user/peso-staff', { replaceState: true });
                break;
            case 'company':
                goto('/user/company', { replaceState: true });
                break;
            case 'alumni':
                goto('/user/alumni', { replaceState: true });
                break;
        }
    }

    async function onLogin() {
        if (email.error || password.error || !email.value.trim() || !password.value.trim()) {
            error('Cannot login yet.');
            return;
        }

        await postJson('/api/auth', {
            email: email.value,
            password: password.value
        }, {
            onSuccess: async (data) => {
                console.log(data);
                
                user.set(data);
                gotoDashboard(data);
                success(data?.message ?? 'Login success!');
            },
            onFail: async (data) => {
                error(data?.message ?? 'Failed to login.');
            },
        });
    }
</script>

<BaseContainer withBgImage={true} class='animate-bg'>
    <div class="bg-white/50 w-full h-full flex items-center justify-center">
        <RoundedCard class='p-8 pb-6 md:w-2/7 rounded-xl'>
            <form
                onsubmit={onLogin}
                class="w-full h-full"
            >
                <div class="flex flex-col items-center gap-y-2">
                    <Logo />
                    <TextS>Login with an existing account</TextS>
                </div>
        
                <div class="flex flex-col items-stretch mt-2 mb-4">
                    <InputText
                        label='Email'
                        Icon={Mail}
                        placeholder='enter your email'
                        bind:value={email.value}
                        bind:error={email.error}
                        onInput={(value) => {
                            if (value.trim().length === 0) {
                                email.error = 'Email is required';
                            } else if (!value.includes('@')) {
                                email.error = 'Invalid email address';
                            } else {
                                email.error = '';
                            }
                        }}
                    />
                    <InputPass
                        label='Password'
                        placeholder='enter your password'
                        bind:value={password.value}
                        bind:error={password.error}
                        onInput={(value) => {
                            if (value.trim().length === 0) {
                                password.error = 'Password is required';
                            } else if (value.trim().length < 8) {
                                password.error = 'Password should have at least 8 characters';
                            } else if (value.trim().length > 65) {
                                password.error = 'Password should not exceed 65 characters';
                            } else {
                                password.error = '';
                            }
                        }}
                    />
                </div>
                
                <ButtonM
                    label='Login'
                    class='w-full mb-4'
                    onclick={onLogin}
                />
        
                <a href="/">
                    <TextS class='text-center text-blue-900'>Forgot Password</TextS>
                </a>
        
                <hr class="border-t border-gray-200 my-4">
        
                <TextS class='text-center'>No account yet? <a href="/registration" class="text-blue-900">Register</a> now!</TextS>
            </form>
        </RoundedCard>
    </div>
</BaseContainer>