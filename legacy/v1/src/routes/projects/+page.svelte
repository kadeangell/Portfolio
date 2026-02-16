<script lang="ts">
    import Card from '$lib/components/Card.svelte';
    import Stat from '$lib/components/Stat.svelte';

    import { writable } from 'svelte/store';

    import kash from '$lib/images/kash.png';
    import nds from '$lib/images/nds.png';
    import website from '$lib/images/website.png';
	import { onMount } from 'svelte';

    let cardWidth = writable(800);

    onMount(() => {
        function checkWidth() {
            const mobileMQ = window.matchMedia('(max-width: 768px)');
            const tabletMQ = window.matchMedia('(max-width: 1024px)');

            if (mobileMQ.matches) {
                console.log("on Mobile");
                cardWidth.set(300);
            } else if (tabletMQ.matches) {
                cardWidth.set(500);
            } else {
                cardWidth.set(800); // Default for larger screens
            }
        }

        // Run once on mount
        checkWidth();

        // Add listener for resize events
        window.addEventListener('resize', checkWidth);

        // Cleanup listener when component is unmounted
        return () => {
            window.removeEventListener('resize', checkWidth);
        };
    });
</script>

<svelte:head>
	<title>Projects | Kade Angell</title>
	<meta name="description" content="Projects | Kade Angell's Web Portfolio" />
</svelte:head>

<section id="project1">
    <div class="app-container">
        <div class="content">
            <div class="content-grid">
                <div class="title-text fixed">
                    <h1>Projects</h1>
                </div>
                <div class="body-text">

                    <div class="project">
                        <Card class="card" width={$cardWidth}>
                            <img class="card-image" slot="image" src={kash} alt="kash" />
                            <span slot="date" style="color:#444; font-size: 1rem;">Fall 2023</span>
                            <h2 slot="heading" style="color: #111">Custom Unix shell - kash</h2>
                            <div slot="text">
                                <span class="card-skill">C++</span>
                                <span class="card-skill">Unix</span>
                                <span class="card-skill">Shell</span>

                            </div>
                            <Stat slot="stat1">
                                <div slot="type" class="card-stat-type">Location</div>
                                <div slot="value" class="card-stat-value">Logan, UT</div>
                            </Stat>
                            <Stat slot="stat2">
                                <div slot="type" class="card-stat-type">Time Spent</div>
                                <div slot="value" class="card-stat-value">2 days</div>
                            </Stat>
                            <Stat slot="stat3">
                                <div slot="type" class="card-stat-type">Reason</div>
                                <div slot="value" class="card-stat-value">Weekend Project</div>
                            </Stat>
        
                            <p slot="back-text" class="card-back-text">
                                Built a custom Unix shell in C++ for fun. The shell is called `kash` and is a work in progress, although almost entirely functional.
                                I used the <a href="https://tiswww.case.edu/php/chet/readline/rltop.html">readline</a> library for storing the history of commands, and the execvp() function for executing commands.
                                I built my own parser using an abstract syntax tree.

                                You can view the project <a href="https://github.com/ArKade523/kash">here</a>.
                            </p>
                            
                        </Card>
                    </div>
                    <div class="project">
                        <Card class="card" width={$cardWidth}>
                            <img class="card-image" slot="image" src={nds} alt="nintendo ds lite"/>
                            <span slot="date" style="color:#444; font-size: 1rem;">Spring 2023</span>
                            <h2 slot="heading" style="color: #111">Nintendo DS Game</h2>
                            <div slot="text">
                                <span class="card-skill">C++</span>

                            </div>
                            <Stat slot="stat1">
                                <div slot="type" class="card-stat-type">Location</div>
                                <div slot="value" class="card-stat-value">Logan, UT</div>
                            </Stat>
                            <Stat slot="stat2">
                                <div slot="type" class="card-stat-type">Time Spent</div>
                                <div slot="value" class="card-stat-value">24 hours</div>
                            </Stat>
                            <Stat slot="stat3">
                                <div slot="type" class="card-stat-type">Reason</div>
                                <div slot="value" class="card-stat-value">Hackathon</div>
                            </Stat>
        
                            <p slot="back-text" class="card-back-text">
                                Built a Nintendo DS Game using C++ for a hackathon. I used the LibNDS toolchain to build the game and 
                                GL2D to render the graphics. The game is a simple tower defense game where you have to prevent red
                                blocks from reaching the end of the path. 

                                You can view the project <a href="https://github.com/ArKade523/HackUSU2023">here</a>.
                            </p>
                            
                        </Card>
                    </div>
                    <div class="project">
                        <Card class="card" width={$cardWidth}>
                            <img class="card-image" slot="image" src={website} alt="website homepage screenshot"/>
                            <span slot="date" style="color:#444; font-size: 1rem;">Fall 2023</span>
                            <h2 slot="heading" style="color: #111">This Website</h2>
                            <div slot="text" class="card-text">
                                <span class="card-skill">Three.js</span>
                                <span class="card-skill">TypeScript</span>
                                <span class="card-skill">Svelte</span>

                            </div>
                            <Stat slot="stat1">
                                <div slot="type" class="card-stat-type">Location</div>
                                <div slot="value" class="card-stat-value">Logan, UT</div>
                            </Stat>
                            <Stat slot="stat2">
                                <div slot="type" class="card-stat-type"></div>
                                <div slot="value" class="card-stat-value"></div>
                            </Stat>
                            <Stat slot="stat3">
                                <div slot="type" class="card-stat-type">Reason</div>
                                <div slot="value" class="card-stat-value">Portfolio</div>
                            </Stat>
        
                            <p slot="back-text" class="card-back-text">
                                Built this website using Svelte to display my projects and capabilities. 
                                I used SvelteKit to build the website and GitHub Pages to host it.
                                The stars in the background are rendered using three.js. 

                                You can view the source code <a href="https://github.com/ArKade523/Portfolio">here</a>.
                            </p>
                            
                        </Card>
                    </div>
                </div>
            </div> 
        </div>
    </div>
</section>

<style>
    .card-image {
        max-width: 100%;
        max-height: 100%;
        width: auto;
        height: auto;
    }

    .card-text {
        line-height: 2.5rem;
    }

</style>