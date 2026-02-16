<script lang="ts">
    import { onMount } from "svelte";
    import * as THREE from "three";
  
    let canvas: HTMLCanvasElement;
  
    onMount(() => {
        const scene: THREE.Scene = new THREE.Scene();
        const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        camera.position.z = 5;

        let cameraMovement: THREE.Vector3 = new THREE.Vector3(0, 0, -0.1);
    
        const renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({ canvas });
        renderer.setSize(window.innerWidth, window.innerHeight);
    
        const ambientLight: THREE.AmbientLight = new THREE.AmbientLight(0xffffff);
        scene.add(ambientLight);
    
        const starGeometry: THREE.SphereGeometry = new THREE.SphereGeometry(0.2, 24, 24);
        const starMaterial: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
        const stars: THREE.Mesh[] = [];
    
        function addStar(existingStar?: THREE.Mesh): void {
            let star: THREE.Mesh;
            if (existingStar) {
                star = existingStar;
            } else {
                star = new THREE.Mesh(starGeometry, starMaterial);
            }

            const cameraDirection: THREE.Vector3 = camera.getWorldDirection(new THREE.Vector3());

            // Get a random point in a cone in front of the camera
            const spreadAngle = 2;
            const randomAngle = Math.random() * spreadAngle - spreadAngle / 2;
            const randomTilt = Math.random() * spreadAngle - spreadAngle / 2;

            const starDirection = cameraDirection.clone();
            starDirection.applyAxisAngle(new THREE.Vector3(1, 0, 0), randomTilt);
            starDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), randomAngle);

            const distanceFromCamera = THREE.MathUtils.randFloat(50, 150);
            
            star.position.copy(camera.position);
            star.position.add(starDirection.multiplyScalar(distanceFromCamera));

            if (!existingStar) {
                scene.add(star);
                stars.push(star);
            }
        }
    
        Array(300).fill(0).forEach(() => addStar());

        let mouse: THREE.Vector2 = new THREE.Vector2(0, 0);
        window.addEventListener('mousemove', event => {
            mouse.x = ((event.clientX + (window.innerWidth / 2)) / window.innerWidth) - 1;
            mouse.y = -((event.clientY + (window.innerHeight / 2)) / window.innerHeight) + 1;
        });

        // Listen for window resize events
        window.addEventListener('resize', () => {
            // Update camera aspect ratio
            camera.aspect = window.innerWidth / window.innerHeight;
            
            // Always update the projection matrix after changing parameters
            camera.updateProjectionMatrix();

            // Update renderer size
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
  
        function animate(): void {
            requestAnimationFrame(animate);

            cameraMovement.x = mouse.x * 0.15;
            cameraMovement.y = mouse.y * 0.15;

            // Move the camera towards the stars
            camera.position.add(cameraMovement);
    
            const distanceThreshold: number = 150;
            const closeDistanceThreshold: number = 50;

            stars.forEach((star, index) => {
                const distance = star.position.distanceTo(camera.position);

                if (star.position.z > camera.position.z || 
                    distance > distanceThreshold || 
                    distance < closeDistanceThreshold) {
                    addStar(star);
                }
            });
            
            // Replenish stars if fewer than 300
            while (stars.length < 300) {
                addStar();
            }

            renderer.render(scene, camera);
        }
    
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            animate();
        }
    });
  </script>
  
  <canvas bind:this={canvas} id="gameCanvas"></canvas>
  
  <style>
    #gameCanvas {
        position: fixed;
        top: 0;
        left: 0;
        /* overflow: hidden; */
        z-index: -1;
    }
  </style>