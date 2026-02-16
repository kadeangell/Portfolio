<script lang="ts">

</script>

<svelte:head>
	<title>Contact Me | Kade Angell</title>
	<meta name="description" content="Contact Me | Kade Angell's Web Portfolio" />
</svelte:head>

<section id="contact-me">
    <div class="app-container">
        <div class="content">
            <div class="content-grid">
                <div class="title-text fixed">
                    <h1>Contact Me</h1>
                </div>
                <div class="body-text">
                    <div>
                        <form action="https://formspree.io/f/mqkvgkpz" method="POST">
                            <label for="name">Name:</label>
                            <input type="text" id="name" name="name" required>

                            <label for="email">Email:</label>
                            <input type="email" id="email" name="email" required>

                            <label for="message">Message:</label>
                            <textarea id="message" name="message" rows="4" required></textarea>

                            <!-- Hidden field for spam prevention -->
                            <input type="text" name="_gotcha" style="display:none">

                            <!-- After successful submission, users will be redirected to a thankyou page -->
                            <input type="hidden" name="_next" value="/thankyou" />

                            <button type="submit">Send</button>
                        </form>
                    </div>
                </div> 
            </div>
        </div>
    </div>  
</section>

<style>
    form {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 1rem;
    }

    label {
        font-size: 1.5rem;
        margin: 0.5rem 0;
    }

    input, textarea, button {
        width: 50%;
        padding: 0.5rem;
        font-size: 1.5rem;
        border-radius: 0.5rem;
        background-color: white;
        margin: 0.5rem 0;
        border: none;
    }

    button {
        transition: 0.2s ease-in-out;
    }

    button:hover {
        background-color: var(--accent);
        color: white;
        cursor: pointer;
    }

    @media screen and (max-width: 768px) {
        input, textarea {
            width: 90%;
            left: 0;
            margin-left: 0;
        }
    }
</style>