<script lang="ts">
    import '@fortawesome/fontawesome-free/css/all.css';
</script>

<div id="footer">
    <a id="linkedin" href="https://www.linkedin.com/in/kade-angell" target="_blank">
        <i class="fab fa-linkedin fa-2x"></i>
    </a>
    <a href="https://github.com/kadeangell" id="github" target="_blank">
        <i class="fab fa-github-square fa-2x"></i>
    </a>
    <a href="/contact-me" id="contact-me">
        <i class="fas fa-envelope-square fa-2x"></i>
    </a>
</div>  

<style>
    #footer {
        width: 100%;
        height: 3rem;
        display: flex;
        justify-content: center;
        z-index: 100;
    }

    a {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 3rem;
        margin: 0 1rem;
        height: 3rem;
        text-decoration: none;
    }

    i {
        color: white;
        padding: 0.5rem;
        transition: 0.2s ease-in-out;
    }

    i:hover {
        color: var(--accent);
    }
</style>
