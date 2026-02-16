<script lang="ts">
  export let toRotate: string[] = ["Default text"];
  let period: number = 2000;
  let txt: string = '';
  let loopNum: number = 0;
  let isDeleting: boolean = false;
  
  const init = () => {
    tick();
  };
  
  const tick = () => {
    const i: number = loopNum % toRotate.length;
    const fullTxt: string = toRotate[i];

    if (isDeleting) {
      txt = fullTxt.substring(0, txt.length - 1);
    } else {
      txt = fullTxt.substring(0, txt.length + 1);
    }

    let delta: number = 150 - Math.random() * 100;
    if (isDeleting) { delta /= 2; }

    if (!isDeleting && txt === fullTxt) {
      delta = period;
      isDeleting = true;
    } else if (isDeleting && txt === '') {
      isDeleting = false;
      loopNum++;
      delta = 600;
    }

    setTimeout(tick, delta);
  };

  import { onMount } from "svelte";
  onMount(() => {
    init();
  });
</script>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono&display=swap');

    .typewrite > .wrap {
        border-right: 0.6em solid #fff;
        font-size: 2rem;
        font-weight: 700;
        color: #fff;
        text-align: center;
        width: 100%;
        white-space: nowrap;
        font-family: "Roboto Mono", monospace;
        min-height: 5rem;
    }

    @media only screen and (max-width: 768px) {
        .typewrite > .wrap {
            font-size: 1rem;
            white-space: normal;
            min-height: 5rem;
        }
    }
</style>

<div class="typewrite">
  <span class="wrap">{txt}</span>
</div>
