<script>
    let {
        label,
        value,
        disabled = false
    } = $props();
</script>

<option
    {disabled}
    value={value}
>
    {label}
</option>