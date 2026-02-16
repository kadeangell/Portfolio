<script lang="ts">
    import { onMount } from 'svelte';
    import VanillaTilt from 'vanilla-tilt';
    
    let card: HTMLElement;
    let flip: boolean = false;
    
    export let width: number = 300;

    let originalHeight: string = 'calc(210px + 210px + 30px + 80px)';

    const calculateHeight = () => {
        // Temporarily disable the transition to get the correct height
        const transition = card.style.transition;
        card.style.transition = '';

        // Get the new height after the card content has changed
        const newHeight = card.scrollHeight + 'px';

        // Re-enable the transition
        card.style.transition = transition;

        // Trigger a reflow to make sure the transition will animate
        card.offsetHeight;

        return newHeight;
    };

    const applyHeight = (newHeight: string) => {
        card.style.height = newHeight;

        // Force reflow to ensure transition plays
        card.offsetHeight;
    };

    const flipCard = () => {
        flip = !flip;
        card.classList.toggle('flipped');

        if (flip) {
            // If the card is flipped, calculate and apply the new height
            requestAnimationFrame(() => {
                const newHeight = calculateHeight();
                applyHeight(newHeight);
            });
        } else {
            // If the card is flipped back, revert to the original height or 'auto'
            applyHeight(originalHeight || 'auto');
        }
    };

    onMount(() => {
        // Store the initial height if necessary, or just use 'auto'
        originalHeight = card.offsetHeight + 'px';

        // Apply the initial height
        card.style.height = originalHeight || 'auto';

        // Optional: Recalculate when the window resizes, in case it affects content
        window.addEventListener('resize', () => {
            // Only recalculate if the card is flipped
            if (flip) {
                card.style.height = calculateHeight();
            }
        });

        // Cleanup the event listener when the component is destroyed
        return () => {
            window.removeEventListener('resize', calculateHeight);
        };
    });

 
</script>

<div class="{$$props.class} card" style={`width: ${width}px; ${$$props.style}`} bind:this={card} on:click={flipCard} on:keypress={flipCard} role="button" tabindex="-1" title="Click to flip over">
    <div class="card-inner">
        <div class="card-front" style={`grid-template-columns: ${width}px`}>
            <div class="card-image">
                <slot name="image" class="image"></slot> <!-- Image Slot -->
            </div>
            <div class="card-text">
                <slot name="date"><span class="date">Summer 2023</span></slot> <!-- Date Slot -->
                <slot name="heading"><h3>Software Engineering Internship</h3></slot> <!-- Heading Slot -->
                <slot name="text"><p></p></slot> <!-- Text Slot -->
            </div>
            <div class="button-wrapper">
                <button>Flip Card</button>
            </div>
            <div class="card-stats">
                <slot name="stat1"></slot> <!-- Stat 1 Slot -->
                <slot name="stat2"></slot> <!-- Stat 2 Slot -->
                <slot name="stat3"></slot> <!-- Stat 3 Slot -->
            </div>
        </div>  
        <div class="card-back">
            <div class="card-image" style={`grid-template-columns: ${width}px`}>
                <slot name="image" class="image-back"></slot>
            </div>
            <div class="card-text">
                <slot name="heading"><h3>Software Engineering Internship</h3></slot> <!-- Heading Slot -->
                <slot name="back-text" class="back-text"><p>Test</p></slot>
            </div>
            <div class="button-wrapper">
                <button>Flip Card</button>
            </div>
            <div class="card-stats">
                <slot name="stat1"></slot> <!-- Stat 1 Slot -->
                <slot name="stat2"></slot> <!-- Stat 2 Slot -->
                <slot name="stat3"></slot> <!-- Stat 3 Slot -->
            </div>
        </div>
    </div>
</div>
  
<style>
    .card {
        display: block;
        /* width: width variable;  <-- Width is assigned as a prop*/
        margin: auto;
        margin-top: 4rem;
        cursor: pointer;

        height: calc(210px + 210px + 30px + 80px);

        border-radius: 18px;
        box-shadow: 5px 5px 15px rgba(0, 0, 0, 0.9);
        font-family: var(--font-mono);
        text-align: center;

        transition: 0.5s ease;
    }

    .card:hover {
        transform: scale(1.05);
    }

    .card-inner, .card-front, .card-back {
        width: 100%;

    }

    .card-front {
        display: grid;
        /* grid-template-columns: 300px; <-- assigned as a prop*/
        grid-template-rows: 210px 210px 50px 60px;
        grid-template-areas: "image" "text" "stats";
        background: white;
        border-radius: 18px;
    }

    .card-back {
        display: grid;
        /* grid-template-columns: 300px; <-- assigned as a prop */
        grid-template-rows: 210px auto 50px 60px;

        background: white;
        border-radius: 18px;
    }

    .card-image {
        grid-area: "image";
        background: #000;
        border-top-left-radius: 15px;
        border-top-right-radius: 15px;
        background-size: cover;
        background-position: center;
    }

    .image-back {
        height: 100px;
    }

    .card-text {
        margin: 1rem 0.5rem;
        font-size: 0.75rem;
    }

    .card-text .date {
        color: #777;
        font-size: 1rem;
    }

    .card-text p {
        color: #777;
        font-size: 1rem;
        margin-top: 15px;
    }

    .card-text h3 {
        color: #111;
        margin-top: 0;
        font-size: 1.8rem;
    }

    .button-wrapper {
        grid-area: "button";
        display: flex;
        align-items: center;
        justify-content: center;
    }

    button {
        background: var(--green-highlight);
        color: var(--green-highlight-text);
        border: none;
        border-radius: 2rem;
        padding: 10px;
        font-size: 0.6rem;
        cursor: pointer;
    }

    .card-stats {
        grid-area: "stats";
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        grid-template-rows: 1fr;

        border-bottom-left-radius: 15px;
        border-bottom-right-radius: 15px;
        background: var(--accent);
    }

    .border {
        border-left: 1px solid #fff;
        border-right: 1px solid #fff;
    }

    .card-inner {
        transform-style: preserve-3d;
        transition: transform 0.5s;
    }

    .flipped .card-inner {
        transform: rotateY(180deg);
    }

    .card-front,
    .card-back {
        backface-visibility: hidden;
        position: absolute;
        top: 0;
        left: 0;
    }

    .card-back {
        transform: rotateY(180deg);
    }

    /* Mobile view */
	@media only screen and (max-width: 768px) {
        .card {
            margin: 2rem 0;
            display: block;
        }

    }

    /* Prefers reduced motion */
    @media (prefers-reduced-motion: reduce) {
        .card, .card-back, .card-inner {
            transition: none;
        }
    }

</style>
  