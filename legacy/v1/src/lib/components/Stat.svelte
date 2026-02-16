<div class="{$$props.class} stat" style={$$props.style}>
    <slot name="type" class="type"></slot> <!-- Type Slot -->
    <slot name="value"></slot> <!-- Value Slot -->
</div>

<style>
    .stat {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;

        color: white;
        padding: 10px;
    }
</style>
