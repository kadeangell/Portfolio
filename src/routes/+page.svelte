<script lang="ts">
	import Card from '$lib/components/Card.svelte';
	import Stat from '$lib/components/Stat.svelte';
	import Typewriter from '$lib/components/Typewriter.svelte';

	const texts: string[] = ["Welcome to my website!",
                            "I founded Raydoc.",
							"I'm a Software Engineer",
							"I do full-stack and embedded development",
                            "I built this with SvelteKit (4)",
							"I interned with NASA-JPL"];

	import nasa from '$lib/images/nasa.png';
	import usu from '$lib/images/usu.png';
	import gas from '$lib/images/gas.png';
	import beta from '$lib/images/beta.png';
	import zaymo from '$lib/images/zaymo.png';

</script>

<svelte:head>
	<title>Kade Angell</title>
	<meta name="description" content="Home | Kade Angell's Web Portfolio" />
</svelte:head>

<section id="home">
	<div class="app-container">
		<div class="content">
			<div class="title-text">
				<h1>Hey, I'm <span>Kade</span>!</h1>
				<Typewriter toRotate={texts}/>

			</div>
		</div>
	</div>
</section>
<section id="about">
	<div class="app-container">
		<div class="content">
			<div class="title-text">
				<h1>About Me</h1>
			</div>
			<div class="content-grid">
				<div class="body-text">
					<p>
            I'm the founding engineer at <a href="https://zaymo.com" target="_blank">Zaymo</a>, building emails that behave like websites.
						<br />
						<br />
						I graduated with a degree in Computer Science from Utah State University in 2025, with minors in Mathematics and Electrical Engineering.
						<br />
						<br />
            I cofounded <a href="https://raydoc.dev">Raydoc</a>, where I tried to abstract the semantic meaning of a codebase away from its syntax.
						<br />
						<br />
						When I'm not at school or work, I'm probably messing around with a retro game console,
						reading, or rock climbing.
					</p>
				</div>

			</div>
		</div>
	</div>
</section>
<section id="work">
	<div class="app-container">
		<div class="content">
			<div class="title-text">
				<h1>Work Experience</h1>
			</div>
			<div class="content-grid">
				<Card class="card">
					<img slot="image" class="card-image" style="padding: 1rem; box-sizing: border-box;" src={zaymo} alt="Zaymo Logo" />
					<span slot="date" style="color:#444; font-size: 1rem;">August 2025 - Present</span>
					<h2 slot="heading" style="color: #111">Founding Engineer</h2>
					<div slot="text">
						<span class="card-skill">Typescript</span>
					</div>
					<Stat slot="stat1">
						<div slot="value" class="card-stat-value">Lehi, UT</div>
						<div slot="type" class="card-stat-type">Location</div>
					</Stat>
					<Stat slot="stat2">
					</Stat>
					<Stat slot="stat3">
						<div slot="value" class="card-stat-value">Zaymo</div>
						<div slot="type" class="card-stat-type">Employer</div>
					</Stat>

					<p slot="back-text" class="card-back-text">
						I build the product, infrastructure, and architecture for Zaymo's email platform.
					</p>
					
				</Card>
				<Card class="card">
					<img slot="image" class="card-image" src={beta} alt="BETA Logo" />
					<span slot="date" style="color:#444; font-size: 1rem;">Summer 2024 - August 2025</span>
					<h2 slot="heading" style="color: #111">Software Engineering Internship</h2>
					<div slot="text">
						<span class="card-skill">C</span>
						<span class="card-skill">Python</span>
						<span class="card-skill">MATLAB</span>
					</div>
					<Stat slot="stat1">
						<div slot="value" class="card-stat-value">Raleigh, NC</div>
						<div slot="type" class="card-stat-type">Location</div>
					</Stat>
					<Stat slot="stat2">
						<div slot="value" class="card-stat-value"><a href="https://www.beta.team/aircraft/" target="_blank">ALIA</a></div>
						<div slot="type" class="card-stat-type">Mission</div>
					</Stat>
					<Stat slot="stat3">
						<div slot="value" class="card-stat-value">BETA Technologies</div>
						<div slot="type" class="card-stat-type">Employer</div>
					</Stat>

					<p slot="back-text" class="card-back-text">
						Worked on <a href="https://www.beta.team/aircraft/">ALIA</a>, automating testing procedures and writing production drivers.
					</p>
					
				</Card>
				<Card class="card">
					<img slot="image" class="card-image" src={nasa} alt="NASA Logo" />
					<span slot="date" style="color:#444; font-size: 1rem;">Summer 2023</span>
					<h2 slot="heading" style="color: #111">Software Engineering Internship</h2>
					<div slot="text">
						<span class="card-skill">C++</span>
						<span class="card-skill">F Prime</span>
					</div>
					<Stat slot="stat1">
						<div slot="value" class="card-stat-value">Pasadena, CA</div>
						<div slot="type" class="card-stat-type">Location</div>
					</Stat>
					<Stat slot="stat2">
						<div slot="value" class="card-stat-value"><a href="https://www.jpl.nasa.gov/missions/cadre" target="_blank">CADRE</a></div>
						<div slot="type" class="card-stat-type">Mission</div>
					</Stat>
					<Stat slot="stat3">
						<div slot="value" class="card-stat-value">NASA-JPL</div>
						<div slot="type" class="card-stat-type">Employer</div>
					</Stat>

					<p slot="back-text" class="card-back-text">
						Worked on the <a href="https://www.jpl.nasa.gov/missions/cadre">CADRE</a> mission
						developing flight software using the <a href="https://nasa.github.io/fprime/">F Prime</a> framework.
					</p>
					
				</Card>
				<Card class="card">
					<img slot="image" class="card-image" src={usu} alt="USU Logo" style="width: 76%" />
					<span slot="date" style="color:#444; font-size: 1rem;">February 2022 - Present</span>
					<h2 slot="heading" style="color: #111">IT Administrator</h2>
					<div slot="text">
						<span class="card-skill">Servers</span>
						<span class="card-skill">Web Design</span>
					</div>
					<Stat slot="stat1">
						<div slot="value" class="card-stat-value">Logan, UT</div>
						<div slot="type" class="card-stat-type">Location</div>
					</Stat>
					<Stat slot="stat2">
						<div slot="value" class="card-stat-value">Math</div>
						<div slot="type" class="card-stat-type">Department</div>
					</Stat>
					<Stat slot="stat3">
						<div slot="value" class="card-stat-value">USU</div>
						<div slot="type" class="card-stat-type">Employer</div>
					</Stat>

					<p slot="back-text" class="card-back-text">
						Provide IT support for the Math Department at USU.
						Designed the <a href="https://math.usu.edu">Math Department Website</a>.
					</p>
					
				</Card>
				<Card class="card">
					<img slot="image" class="card-image width-100 height-auto" src={gas} alt="GAS Logo"/>
					<span slot="date" style="color:#444; font-size: 1rem;">January 2023 - May 2024</span>
					<h2 slot="heading" style="color: #111">Flight Software Team Lead</h2>
					<div slot="text">
						<span class="card-skill">C++</span>
						<span class="card-skill">F Prime</span>
					</div>
					<Stat slot="stat1">
						<div slot="value" class="card-stat-value">Logan, UT</div>
						<div slot="type" class="card-stat-type">Location</div>
					</Stat>
					<Stat slot="stat2">
						<div slot="value" class="card-stat-value">GASRATS</div>
						<div slot="type" class="card-stat-type">Mission</div>
					</Stat>
					<Stat slot="stat3">
						<div slot="value" class="card-stat-value">USU GAS</div>
						<div slot="type" class="card-stat-type">Team</div>
					</Stat>

					<p slot="back-text" class="card-back-text">
						Led the Flight Software team for the <a href="https://www.usu.edu/physics/gas/projects/gasrats">GASRATS</a> cubesat.
						Developed using the <a href="https://nasa.github.io/fprime/" style="white-space: nowrap;">F Prime</a> framework.
					</p>
					
				</Card>
			</div>
		</div>
	</div>
</section>

<style>
	h1 span {
		background: linear-gradient(120deg, var(--accent), var(--color-text), var(--accent));
		background-clip: text;
		background-size: 200% 100%;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		transition: background-position 0.5s ease-in-out;
	}

	h1 span:hover {
		background-position: 100% 0;
	}

	h2 {
		font-size: 1rem;
	}

	#home > .app-container > .content > .title-text {
		top: 50vh;
	}
	
	.body-text {
		grid-column-start: 2;
		grid-column-end: 4;
	}

	/* Tablet view */
	@media only screen and (max-width: 1024px) {

	}

	/* Mobile view */
	@media only screen and (max-width: 768px) {
		.body-text {
			grid-column-start: 1;
			padding: 0 0.5rem;
		}
	}
</style>
