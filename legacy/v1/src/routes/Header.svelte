<script lang="ts">
	import '@fortawesome/fontawesome-free/css/all.css';
	let showMenu: boolean = false;
</script>

<header>
	<nav class="desktop-nav" class:hidden={showMenu}>
		<a href='/#home'>Home</a>
		<span>	|</span>
		<a href='/#about'>About Me</a>
		<span>	|</span>
		<a href='/#work'>Work Experience</a>
		<span>	|</span>
		<a href='/projects'>Projects</a>
	</nav>
	<button class="hamburger-button" aria-label="Hamburger Menu" on:click={() => showMenu = !showMenu}>
		<i class={`fas ${showMenu ? 'fa-times rotate-x' : 'fa-bars rotate-bars'}`}></i>
	</button>
	<nav class={`mobile-nav ${showMenu ? 'show-nav' : 'hidden'}`} >
		<a href='/#home' on:click={() => showMenu = !showMenu}>Home</a>
		<a href='/#about' on:click={() => showMenu = !showMenu}>About Me</a>
		<a href='/#work' on:click={() => showMenu = !showMenu}>Work Experience</a>
		<a href='/projects' on:click={() => showMenu = !showMenu}>Projects</a>
	</nav>
</header>

<style>
	header {
		position: fixed;
		top: 0;
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0 2rem;
		height: 4rem;
		z-index: 2;
		font-family: var(--font-mono);
	}

	.desktop-nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
		height: 100%;
	}

	nav > * {
		color: #fff;
		text-decoration: none;
		font-size: 1.5rem;
		font-weight: 700;
		padding: 0 1rem;
	}
	
	nav > a:hover {
		color: var(--accent);
		text-decoration: none;
		cursor: pointer;
	}
	
	.hidden {
		display: none;
	}
	
	/* Mobile view */
	@media only screen and (max-width: 768px) {
		header {
			background: #000;
		}

		.desktop-nav {
			display: none;
		}
		
		.hamburger-button {
			display: block;
			background: none;
			color: var(--color-text);
			border: none;
			left: 0;
			top: 0;
			position: absolute;
			margin: 1rem;
			font-size: 2rem;
			cursor: pointer;
		}
		
		.rotate-bars {
			transform: rotate(0deg);
			transition: transform 0.3s ease;
		}
	
		.rotate-x {
			transform: rotate(90deg);
			transition: transform 0.3s ease;
		}

		.hamburger-button:hover {
			color: var(--accent);
		}

		.mobile-nav {
			background: var(--background);
			width: 100%;
			padding: 0.25rem;
			position: absolute;
			top: 4rem;
			left: 0;
			margin-left: 0.45rem;
			flex-direction: column;
			align-items: left;
			transform: translateY(-100%);
			transition: transform 0.3s ease;
			display: none;
		}
		
		.mobile-nav.show-nav {
			display: flex;
			transform: translateY(0%);
			transition: transform 0.3s ease;
		}

	}

</style>
