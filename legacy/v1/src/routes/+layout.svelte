<script>
	import Header from './Header.svelte';
	import StarBackground from '$lib/components/StarBackground.svelte';
	import Footer from './Footer.svelte';
	import Logo from '$lib/images/Logo.svg';
    import '$lib/styles/App.css'
    import '$lib/styles/index.css'
    import '$lib/styles/utils.css'
</script>

<svelte:head>
	<link rel="favicon" type="image/svg+xml" href={Logo} />
</svelte:head>

<div class="app">
	<div class="content-wrapper">
		<Header />
		
		<main>
			<StarBackground />
			<slot />
		</main>

		<footer>
			<Footer />
		</footer>
	</div>
</div>

<style>

</style>
