// Interactive 3D Solar System using Three.js for AstroAle Portfolio
// Generates procedural HD textures and handles camera focus and manual rotation.

let scene, camera, renderer, controls;
let stars, sun, planets = [];
let animId;
let globalSpeedMultiplier = 1;
let orbitLinesVisible = true;

// Active state tracking
let activePlanet = null; // null means viewing the full solar system
let isTransitioning = false;
let baseOrbitSpeeds = {};

// Info about planets (incorporating AstroAle's photography details)
const planetsData = [
    { 
        name: 'Mercurio', 
        type: 'mercury', 
        radius: 0.7, 
        orbitRadius: 9, 
        orbitSpeed: 0.006, 
        rotSpeed: 0.005, 
        info: 'È il pianeta più piccolo e più vicino al Sole. Rimosso dal forte bagliore solare solo durante brevi crepuscoli o eclissi totali. Ha un aspetto aspro e craterizzato simile alla Luna.',
        details: {
            distanza: '57.9 milioni di km',
            diametro: '4.879 km',
            periodo: '88 giorni terrestri',
            astroNote: 'Target estremamente basso sull\'orizzonte. Richiede un cielo molto limpido al tramonto o all\'alba. Ripreso con filtro IR-pass per ridurre la turbolenza.'
        }
    },
    { 
        name: 'Venere', 
        type: 'venus', 
        radius: 1.2, 
        orbitRadius: 13, 
        orbitSpeed: 0.004, 
        rotSpeed: 0.002, 
        info: 'Coperto da una spessa e riflettente coltre di nubi acide. Risplende brillantemente nel cielo come il "Faro della sera" o della mattina. Mostra fasi simili a quelle lunari.',
        details: {
            distanza: '108.2 milioni di km',
            diametro: '12.104 km',
            periodo: '224.7 giorni',
            astroNote: 'Molto luminoso. Fotografato nelle prime ore della sera. Un filtro UV rivela dettagli sottili e strutture nuvolose altrimenti invisibili.'
        }
    },
    { 
        name: 'Terra', 
        type: 'earth', 
        radius: 1.3, 
        orbitRadius: 18, 
        orbitSpeed: 0.0024, 
        rotSpeed: 0.015, 
        info: 'La nostra oasi azzurra nello spazio, protetta da un\'atmosfera vitale. È la base da cui AstroAle riprende la luna e gli altri corpi celesti.',
        details: {
            distanza: '149.6 milioni di km',
            diametro: '12.742 km',
            periodo: '365.25 giorni',
            astroNote: 'La nostra casa. Ottimo punto di partenza per immortalare il transito della Stazione Spaziale Internazionale (ISS) davanti al Sole o alla Luna.'
        }
    },
    { 
        name: 'Marte', 
        type: 'mars', 
        radius: 0.9, 
        orbitRadius: 23, 
        orbitSpeed: 0.0018, 
        rotSpeed: 0.014, 
        info: 'Il Pianeta Rosso. La superficie arrugginita ricca di ossido di ferro ospita grandi vulcani spenti, canyon e calotte polari di ghiaccio secco e acqua.',
        details: {
            distanza: '227.9 milioni di km',
            diametro: '6.779 km',
            periodo: '687 giorni',
            astroNote: 'Emozionante da fotografare durante l\'opposizione. Con il telescopio 130/900 e la Barlow 2x si riescono ad intravedere la calotta polare e la regione scura di Syrtis Major.'
        }
    },
    { 
        name: 'Giove', 
        type: 'jupiter', 
        radius: 2.6, 
        orbitRadius: 30, 
        orbitSpeed: 0.001, 
        rotSpeed: 0.03, 
        info: 'Il re dei pianeti, un gigante gassoso colossale. Famoso per le sue turbolente bande atmosferiche colorate e la Grande Macchia Rossa, un ciclone attivo da secoli.',
        details: {
            distanza: '778.5 milioni di km',
            diametro: '139.820 km',
            periodo: '11.86 anni',
            astroNote: 'Fotografabile in alta definizione. Si distinguono nettamente le bande equatoriali e i quattro satelliti galileiani (Io, Europa, Ganimede, Callisto) come puntini luminosi.'
        }
    },
    { 
        name: 'Saturno', 
        type: 'saturn', 
        radius: 2.1, 
        orbitRadius: 39, 
        orbitSpeed: 0.0006, 
        rotSpeed: 0.025, 
        hasRings: true, 
        info: 'Il gioiello del sistema solare. Caratterizzato da uno spettacolare e complesso sistema di anelli composto principalmente da miliardi di frammenti di ghiaccio e roccia.',
        details: {
            distanza: '1.434 miliardi di km',
            diametro: '116.460 km',
            periodo: '29.45 anni',
            astroNote: 'Il soggetto più spettacolare. Gli anelli e la divisione di Cassini sono ben visibili nei dettagli catturati con la camera Sony α6400 accoppiata al fuoco diretto del Newton 130.'
        }
    },
    { 
        name: 'Urano', 
        type: 'uranus', 
        radius: 1.6, 
        orbitRadius: 47, 
        orbitSpeed: 0.0003, 
        rotSpeed: 0.02, 
        info: 'Un gigante di ghiaccio con un asse di rotazione inclinato di quasi 98 gradi rispetto al suo piano orbitale, facendolo rotolare su un fianco durante la sua orbita.',
        details: {
            distanza: '2.871 miliardi di km',
            diametro: '50.724 km',
            periodo: '84.01 anni',
            astroNote: 'Appare come un piccolo e flebile disco di colore azzurro-verde. Richiede lunghi tempi di esposizione ed un inseguimento motorizzato preciso della montatura.'
        }
    },
    { 
        name: 'Nettuno', 
        type: 'neptune', 
        radius: 1.5, 
        orbitRadius: 54, 
        orbitSpeed: 0.00016, 
        rotSpeed: 0.022, 
        info: 'Il pianeta più esterno, sferzato dai venti più veloci del sistema solare. Ha un colore blu profondo dovuto al metano presente nella sua atmosfera ghiacciata.',
        details: {
            distanza: '4.495 miliardi di km',
            diametro: '49.244 km',
            periodo: '164.8 anni',
            astroNote: 'Sfida estrema. Visibile come una debolissima stellina bluastra. Richiede l\'uso di mappe stellari di precisione per essere distinto dalle stelle di campo.'
        }
    }
];

// Helper to generate planet textures procedurally using 2D Canvas
function createPlanetTexture(type) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    if (type === 'sun') {
        let grad = ctx.createRadialGradient(256, 128, 0, 256, 128, 256);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.2, '#fff1a8');
        grad.addColorStop(0.5, '#ff9c00');
        grad.addColorStop(0.8, '#ff3c00');
        grad.addColorStop(1, '#990000');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 256);
        
        // Solar flares / texture details
        for (let i = 0; i < 1500; i++) {
            ctx.fillStyle = 'rgba(255, 230, 0, ' + Math.random() * 0.2 + ')';
            ctx.fillRect(Math.random() * 512, Math.random() * 256, Math.random() * 3 + 1, Math.random() * 3 + 1);
        }
    } else if (type === 'mercury') {
        ctx.fillStyle = '#6e6e6e';
        ctx.fillRect(0, 0, 512, 256);
        
        // Noise and craters
        for (let i = 0; i < 600; i++) {
            let x = Math.random() * 512;
            let y = Math.random() * 256;
            let r = Math.random() * 7 + 1;
            ctx.fillStyle = 'rgba(40, 40, 40, ' + Math.random() * 0.4 + ')';
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = 'rgba(180, 180, 180, ' + Math.random() * 0.25 + ')';
            ctx.beginPath();
            ctx.arc(x + 1, y + 1, r * 0.7, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (type === 'venus') {
        let grad = ctx.createLinearGradient(0, 0, 0, 256);
        grad.addColorStop(0, '#ebd8b0');
        grad.addColorStop(0.4, '#dfc491');
        grad.addColorStop(0.6, '#ccab70');
        grad.addColorStop(1, '#a68246');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 256);
        
        // Atmospheric wind lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 10;
        for (let i = 0; i < 20; i++) {
            ctx.beginPath();
            let y = i * 15;
            ctx.moveTo(0, y);
            ctx.bezierCurveTo(128, y + 25, 384, y - 25, 512, y);
            ctx.stroke();
        }
    } else if (type === 'earth') {
        // Ocean base
        ctx.fillStyle = '#103f7a';
        ctx.fillRect(0, 0, 512, 256);
        
        // Green and brown landmasses (procedural continents)
        ctx.fillStyle = '#2d633c';
        for (let i = 0; i < 15; i++) {
            let cx = Math.random() * 512;
            let cy = 40 + Math.random() * 170;
            let size = 35 + Math.random() * 55;
            ctx.beginPath();
            ctx.arc(cx, cy, size, 0, Math.PI * 2);
            ctx.fill();
            
            // Sub-continental blobs for complex shapes
            for (let j = 0; j < 4; j++) {
                ctx.beginPath();
                ctx.arc(cx + (Math.random() - 0.5) * size, cy + (Math.random() - 0.5) * size, size * 0.6, 0, Math.PI * 2);
                ctx.fillStyle = Math.random() > 0.4 ? '#4a7536' : '#736d41'; // Greenish vs brownish desert
                ctx.fill();
            }
        }
        
        // White cloud structures on top
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        for (let i = 0; i < 22; i++) {
            ctx.beginPath();
            let y = Math.random() * 180 + 38;
            ctx.arc(Math.random() * 512, y, Math.random() * 25 + 8, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Polar Ice caps
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 512, 18);
        ctx.fillRect(0, 238, 512, 18);
    } else if (type === 'mars') {
        ctx.fillStyle = '#bf4c1d';
        ctx.fillRect(0, 0, 512, 256);
        
        // Dark iron oxide deserts
        ctx.fillStyle = '#7a2d0b';
        for (let i = 0; i < 10; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * 512, 45 + Math.random() * 160, Math.random() * 50 + 15, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Ice caps
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(256, 4, 15, 0, Math.PI, false);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(256, 252, 18, Math.PI, 0, false);
        ctx.fill();
    } else if (type === 'jupiter') {
        // Alternating atmospheric belt colors
        const colors = ['#8d5b32', '#cca478', '#a87548', '#dfc3a7', '#6b3f1c', '#b38a60', '#dfc3a7'];
        for (let y = 0; y < 256; y += 4) {
            ctx.fillStyle = colors[Math.floor(y / 15) % colors.length];
            ctx.fillRect(0, y, 512, 4);
        }
        
        // Swirly storms
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 3;
        for (let i = 0; i < 18; i++) {
            ctx.beginPath();
            let y = i * 15;
            ctx.moveTo(0, y);
            ctx.bezierCurveTo(128, y + 12, 384, y - 12, 512, y);
            ctx.stroke();
        }
        
        // Great Red Spot (GMR)
        ctx.fillStyle = '#a12b2b';
        ctx.beginPath();
        ctx.ellipse(320, 175, 22, 13, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#d85252';
        ctx.beginPath();
        ctx.ellipse(320, 175, 15, 8, 0, 0, Math.PI * 2);
        ctx.fill();
    } else if (type === 'saturn') {
        const colors = ['#e6cfa3', '#d9bd84', '#c2a163', '#d9bd84', '#e6cfa3', '#ad8a4e'];
        for (let y = 0; y < 256; y += 5) {
            ctx.fillStyle = colors[Math.floor(y / 16) % colors.length];
            ctx.fillRect(0, y, 512, 5);
        }
        
        // Faint striping
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 4;
        for (let i = 0; i < 10; i++) {
            ctx.beginPath();
            let y = i * 25;
            ctx.moveTo(0, y);
            ctx.bezierCurveTo(128, y + 8, 384, y - 8, 512, y);
            ctx.stroke();
        }
    } else if (type === 'uranus') {
        let grad = ctx.createLinearGradient(0, 0, 0, 256);
        grad.addColorStop(0, '#c7effa');
        grad.addColorStop(0.5, '#a3e0f0');
        grad.addColorStop(1, '#77c3d6');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 256);
        
        // Faint horizontal bands
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fillRect(0, 80, 512, 15);
        ctx.fillRect(0, 160, 512, 20);
    } else if (type === 'neptune') {
        let grad = ctx.createLinearGradient(0, 0, 0, 256);
        grad.addColorStop(0, '#214287');
        grad.addColorStop(0.5, '#355caa');
        grad.addColorStop(1, '#152b5c');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 256);
        
        // Darker storms and white cirrus clouds
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.ellipse(100 + i * 110, 80 + i * 30, 25, 4, Math.PI / 12, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Great Dark Spot
        ctx.fillStyle = '#0f204c';
        ctx.beginPath();
        ctx.ellipse(220, 140, 22, 14, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

// Procedural texture for Saturn's rings (drawn concentric on square canvas)
function createSaturnRingTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 512, 512);
    
    const cx = 256;
    const cy = 256;
    
    // Draw concentric ring bands from radius 110px to 240px
    for (let r = 110; r < 245; r++) {
        let alpha = 0;
        let color = '#d4af37';
        
        if (r >= 110 && r < 135) {
            // Inner semi-transparent C ring
            alpha = 0.2 + Math.sin(r * 0.6) * 0.08;
            color = '#a38d60';
        } else if (r >= 135 && r < 195) {
            // Bright B ring
            alpha = 0.85 + Math.sin(r * 0.15) * 0.1;
            color = '#ebd09b';
        } else if (r >= 195 && r < 205) {
            // Cassini Division (very dark, almost empty)
            alpha = 0.02;
            color = '#000000';
        } else if (r >= 205 && r < 238) {
            // A ring
            alpha = 0.65 + Math.cos(r * 0.2) * 0.08;
            color = '#c7b083';
        } else {
            // Outer faint F ring
            alpha = 0.18;
            color = '#8f7e5d';
        }
        
        ctx.strokeStyle = color;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

// Main initialization
function initSolarSystem() {
    const container = document.getElementById('solar-system-container');
    if (!container) return;
    
    // Clear any previous canvas
    container.innerHTML = '';
    
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Scene setup
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.005);
    
    // Camera setup
    camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 32, 55);
    
    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    
    // Controls setup
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 150;
    controls.minDistance = 3;
    controls.enableZoom = false; // Disabilita lo zoom con scroll/pinch per permettere lo scrolling della pagina
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x222233, 1.2);
    scene.add(ambientLight);
    
    // PointLight at the center (acting as Sun rays)
    const sunLight = new THREE.PointLight(0xffffff, 3.5, 300, 0.5);
    sunLight.position.set(0, 0, 0);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);
    
    // Build Starfield background
    createStars();
    
    // Build Sun
    createSun();
    
    // Build Planets
    createPlanets();
    
    // Raycasting for interactions
    setupInteractions();
    
    // Bind UI HUD buttons
    setupUIControls();
    
    // Start loop
    animate();
    
    // Window resize
    window.addEventListener('resize', onWindowResize);
}

// Starfield particles
function createStars() {
    const starCount = 3000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount * 3; i += 3) {
        // Distribute points in a huge sphere
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const r = 150 + Math.random() * 200; // Far away
        
        positions[i] = r * Math.sin(phi) * Math.cos(theta);
        positions[i+1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i+2] = r * Math.cos(phi);
        
        // Soft blue/white stars
        const starColor = new THREE.Color();
        const rand = Math.random();
        if (rand > 0.8) {
            starColor.setHSL(0.6, 0.3, 0.7 + Math.random() * 0.3); // bluish
        } else {
            starColor.setHSL(0.1, 0.1, 0.8 + Math.random() * 0.2); // whitish/yellowish
        }
        
        colors[i] = starColor.r;
        colors[i+1] = starColor.g;
        colors[i+2] = starColor.b;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // Simple square star shader or canvas sprite
    const material = new THREE.PointsMaterial({
        size: 0.8,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        sizeAttenuation: true
    });
    
    stars = new THREE.Points(geometry, material);
    scene.add(stars);
}

// Sun setup
function createSun() {
    const sunGeom = new THREE.SphereGeometry(4.2, 32, 32);
    const sunTexture = createPlanetTexture('sun');
    
    // MeshBasicMaterial because the Sun emits light and shouldn't receive shadows/shading
    const sunMat = new THREE.MeshBasicMaterial({
        map: sunTexture
    });
    
    sun = new THREE.Mesh(sunGeom, sunMat);
    sun.position.set(0, 0, 0);
    scene.add(sun);
    
    // Visual Sun Glow (nested sphere with transparent addative glow)
    const glowGeom = new THREE.SphereGeometry(4.7, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
        color: 0xffaa44,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide
    });
    const sunGlow = new THREE.Mesh(glowGeom, glowMat);
    sun.add(sunGlow);
}

// Planets setup
function createPlanets() {
    planets = [];
    
    planetsData.forEach((data) => {
        const pivot = new THREE.Group();
        scene.add(pivot);
        
        // Draw Orbit Line
        const orbitGeom = new THREE.BufferGeometry();
        const points = [];
        for (let i = 0; i <= 180; i++) {
            const angle = (i / 180) * Math.PI * 2;
            points.push(new THREE.Vector3(Math.cos(angle) * data.orbitRadius, 0, Math.sin(angle) * data.orbitRadius));
        }
        orbitGeom.setFromPoints(points);
        const orbitMat = new THREE.LineBasicMaterial({
            color: 0x334466,
            transparent: true,
            opacity: 0.45,
            linewidth: 1
        });
        const orbitLine = new THREE.Line(orbitGeom, orbitMat);
        scene.add(orbitLine);
        
        let mesh;
        let earthGroup;
        
        if (data.type === 'earth') {
            // Earth Group to isolate Earth self-rotation from Moon orbital pivot
            earthGroup = new THREE.Group();
            earthGroup.position.set(data.orbitRadius, 0, 0);
            pivot.add(earthGroup);
            
            const planetGeom = new THREE.SphereGeometry(data.radius, 32, 32);
            const planetTexture = createPlanetTexture(data.type);
            const planetMat = new THREE.MeshStandardMaterial({
                map: planetTexture,
                roughness: 0.8,
                metalness: 0.1
            });
            mesh = new THREE.Mesh(planetGeom, planetMat);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            earthGroup.add(mesh);
            
            // Add Moon Orbit inside earthGroup
            const moonPivot = new THREE.Group();
            earthGroup.add(moonPivot);
            
            // Moon Orbit Line
            const moonOrbitGeom = new THREE.BufferGeometry();
            const moonPoints = [];
            for (let i = 0; i <= 64; i++) {
                const angle = (i / 64) * Math.PI * 2;
                moonPoints.push(new THREE.Vector3(Math.cos(angle) * 2.2, 0, Math.sin(angle) * 2.2));
            }
            moonOrbitGeom.setFromPoints(moonPoints);
            const moonOrbitMat = new THREE.LineBasicMaterial({
                color: 0x445566,
                transparent: true,
                opacity: 0.35
            });
            const moonOrbitLine = new THREE.Line(moonOrbitGeom, moonOrbitMat);
            earthGroup.add(moonOrbitLine);
            
            // Moon Sphere
            const moonGeom = new THREE.SphereGeometry(0.35, 16, 16);
            const moonTexture = createPlanetTexture('mercury'); // Reuse mercury gray texture
            const moonMat = new THREE.MeshStandardMaterial({
                map: moonTexture,
                roughness: 0.9,
                metalness: 0.1
            });
            const moonMesh = new THREE.Mesh(moonGeom, moonMat);
            moonMesh.position.set(2.2, 0, 0);
            moonMesh.castShadow = true;
            moonMesh.receiveShadow = true;
            
            moonMesh.userData = {
                name: 'Luna',
                type: 'moon',
                radius: 0.35,
                info: 'Il satellite naturale della Terra. È in rotazione sincrona con il nostro pianeta, mostrandone sempre la stessa faccia. Costellata di mari e crateri.',
                details: {
                    distanza: '384.400 km',
                    diametro: '3.474 km',
                    periodo: '27.3 giorni',
                    astroNote: 'Soggetto più fotografato in assoluto. Consigliata la ripresa lungo il terminatore (confine ombra/luce) per mettere in risalto la profondità dei crateri.'
                }
            };
            
            moonPivot.add(moonMesh);
            
            // Bind references
            mesh.userData = { 
                name: data.name, 
                type: data.type,
                radius: data.radius,
                info: data.info,
                details: data.details,
                orbitRadius: data.orbitRadius,
                orbitSpeed: data.orbitSpeed,
                rotSpeed: data.rotSpeed,
                pivot: pivot,
                moonPivot: moonPivot,
                moonMesh: moonMesh
            };
        } else {
            // Planet Sphere
            const planetGeom = new THREE.SphereGeometry(data.radius, 32, 32);
            const planetTexture = createPlanetTexture(data.type);
            const planetMat = new THREE.MeshStandardMaterial({
                map: planetTexture,
                roughness: 0.8,
                metalness: 0.1
            });
            
            mesh = new THREE.Mesh(planetGeom, planetMat);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.position.set(data.orbitRadius, 0, 0);
            
            // Custom name and reference binding for raycasting
            mesh.userData = { 
                name: data.name, 
                type: data.type,
                radius: data.radius,
                info: data.info,
                details: data.details,
                orbitRadius: data.orbitRadius,
                orbitSpeed: data.orbitSpeed,
                rotSpeed: data.rotSpeed,
                pivot: pivot
            };
            
            pivot.add(mesh);
        }
        
        // Save base speeds
        baseOrbitSpeeds[data.name] = data.orbitSpeed;
        
        // Initialize random starting angle
        pivot.rotation.y = Math.random() * Math.PI * 2;
        
        // Add Saturn Rings
        if (data.hasRings) {
            // Flat Ring
            const ringGeom = new THREE.RingGeometry(data.radius * 1.5, data.radius * 3.0, 64);
            const ringTexture = createSaturnRingTexture();
            
            const pos = ringGeom.attributes.position;
            const uv = ringGeom.attributes.uv;
            for (let i = 0; i < pos.count; i++) {
                const vx = pos.getX(i);
                const vy = pos.getY(i);
                const distance = Math.sqrt(vx * vx + vy * vy);
                
                const inner = data.radius * 1.5;
                const outer = data.radius * 3.0;
                const u = (distance - inner) / (outer - inner);
                
                uv.setXY(i, u, 0.5);
            }
            
            const ringMat = new THREE.MeshStandardMaterial({
                map: ringTexture,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.85,
                roughness: 0.6,
                metalness: 0.2
            });
            
            const rings = new THREE.Mesh(ringGeom, ringMat);
            rings.rotation.x = Math.PI / 2.2;
            rings.rotation.y = Math.PI / 12;
            mesh.add(rings);
        }
        
        planets.push({
            name: data.name,
            mesh: mesh,
            pivot: pivot,
            orbitRadius: data.orbitRadius,
            orbitLine: orbitLine
        });
    });
}

// Raycasting Interaction Setup
function setupInteractions() {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const tooltip = document.getElementById('planet-tooltip');
    const container = document.getElementById('solar-system-container');
    
    if (!container) return;
    
    const getTargetMeshes = () => {
        const meshes = [];
        planets.forEach(p => {
            meshes.push(p.mesh);
            if (p.mesh.userData.moonMesh) {
                meshes.push(p.mesh.userData.moonMesh);
            }
        });
        return meshes;
    };
    
    // Mouse hover detection
    container.addEventListener('mousemove', (event) => {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        raycaster.setFromCamera(mouse, camera);
        
        const targetMeshes = getTargetMeshes();
        const intersects = raycaster.intersectObjects([...targetMeshes, sun]);
        
        if (intersects.length > 0) {
            const object = intersects[0].object;
            container.style.cursor = 'pointer';
            
            if (tooltip) {
                const name = object === sun ? 'Sole' : object.userData.name;
                tooltip.textContent = name;
                tooltip.style.left = (event.clientX + 15) + 'px';
                tooltip.style.top = (event.clientY + 15) + 'px';
                tooltip.style.opacity = '1';
            }
        } else {
            container.style.cursor = 'default';
            if (tooltip) tooltip.style.opacity = '0';
        }
    });
    
    // Mouse click selection
    container.addEventListener('click', () => {
        if (isTransitioning) return;
        
        raycaster.setFromCamera(mouse, camera);
        const targetMeshes = getTargetMeshes();
        const intersects = raycaster.intersectObjects(targetMeshes);
        
        if (intersects.length > 0) {
            const clickedMesh = intersects[0].object;
            focusOnPlanet(clickedMesh);
        }
    });
}

// Camera Lerping & Zoom Focus
function focusOnPlanet(planetMesh) {
    activePlanet = planetMesh;
    isTransitioning = true;
    
    // Hide tooltip
    const tooltip = document.getElementById('planet-tooltip');
    if (tooltip) tooltip.style.opacity = '0';
    
    // Disable orbit controls temporarily to avoid glitching during transition
    controls.enabled = false;
    
    // Display the UI info HUD with glassmorphic styling
    showPlanetHUD(planetMesh.userData);
    
    // Target position of the planet in world space
    const targetWorldPos = new THREE.Vector3();
    planetMesh.getWorldPosition(targetWorldPos);
    
    // Desired camera position relative to the planet
    const zoomDistance = planetMesh.userData.radius * 4;
    const targetCamPos = new THREE.Vector3()
        .copy(targetWorldPos)
        .add(new THREE.Vector3(zoomDistance, zoomDistance * 0.6, zoomDistance * 1.2));
        
    // Animate camera position and target controls
    let progress = 0;
    const startCamPos = camera.position.clone();
    const startTarget = controls.target.clone();
    
    // Freeze system orbits when inspecting
    globalSpeedMultiplier = 0;
    const speedSlider = document.getElementById('speed-slider');
    if (speedSlider) speedSlider.value = 0;
    const speedVal = document.getElementById('speed-value');
    if (speedVal) speedVal.textContent = '0.0x (Pausa)';
    
    function lerpCamera() {
        progress += 0.04; // speed of transit
        
        // Re-read world position
        planetMesh.getWorldPosition(targetWorldPos);
        targetCamPos.copy(targetWorldPos).add(new THREE.Vector3(zoomDistance, zoomDistance * 0.6, zoomDistance * 1.2));
        
        if (progress >= 1) {
            progress = 1;
            isTransitioning = false;
            // Bind OrbitControls to orbit specifically around the planet
            controls.target.copy(targetWorldPos);
            controls.update(); // Sync OrbitControls with new camera position/target
            controls.enabled = true;
            controls.maxDistance = planetMesh.userData.radius * 12;
            controls.minDistance = planetMesh.userData.radius * 2.2;
            return;
        }
        
        // Lerp camera position
        camera.position.lerpVectors(startCamPos, targetCamPos, progress);
        
        // Lerp controls target (center of screen lookat)
        controls.target.lerpVectors(startTarget, targetWorldPos, progress);
        camera.lookAt(controls.target);
        
        requestAnimationFrame(lerpCamera);
    }
    
    lerpCamera();
}

// Reset camera to standard global view
function resetToGlobalView() {
    if (isTransitioning) return;
    
    isTransitioning = true;
    controls.enabled = false;
    activePlanet = null;
    
    // Hide Info panel HUD
    hidePlanetHUD();
    
    // Reset speeds
    globalSpeedMultiplier = 1;
    const speedSlider = document.getElementById('speed-slider');
    if (speedSlider) speedSlider.value = 1;
    const speedVal = document.getElementById('speed-value');
    if (speedVal) speedVal.textContent = '1.0x';
    
    const startCamPos = camera.position.clone();
    const startTarget = controls.target.clone();
    
    const targetCamPos = new THREE.Vector3(0, 32, 55);
    const targetTarget = new THREE.Vector3(0, 0, 0);
    
    let progress = 0;
    
    function lerpBack() {
        progress += 0.04;
        if (progress >= 1) {
            progress = 1;
            isTransitioning = false;
            controls.target.copy(targetTarget);
            controls.update(); // Sync controls state with camera
            controls.enabled = true;
            controls.maxDistance = 150;
            controls.minDistance = 3;
            return;
        }
        
        camera.position.lerpVectors(startCamPos, targetCamPos, progress);
        controls.target.lerpVectors(startTarget, targetTarget, progress);
        camera.lookAt(controls.target);
        
        requestAnimationFrame(lerpBack);
    }
    
    lerpBack();
}

// Show HUD Overlay Panel
function showPlanetHUD(data) {
    const panel = document.getElementById('planet-info-panel');
    if (!panel) return;
    
    document.getElementById('hud-planet-name').textContent = data.name;
    document.getElementById('hud-planet-desc').textContent = data.info;
    document.getElementById('hud-distanza').textContent = data.details.distanza;
    document.getElementById('hud-diametro').textContent = data.details.diametro;
    document.getElementById('hud-periodo').textContent = data.details.periodo;
    document.getElementById('hud-astronote').textContent = data.details.astroNote;
    
    // Dynamic gallery link redirection
    const exploreLink = document.querySelector('.hud-explore-link');
    const exploreBtn = exploreLink ? exploreLink.querySelector('button') : null;
    if (exploreLink && exploreBtn) {
        exploreLink.href = `/astro?tag=${data.name}`;
        exploreBtn.textContent = `Esplora Foto di ${data.name}`;
    }
    
    panel.classList.add('active');
    
    // Show back button
    const backBtn = document.getElementById('back-to-system');
    if (backBtn) backBtn.style.display = 'inline-block';
}

function hidePlanetHUD() {
    const panel = document.getElementById('planet-info-panel');
    if (panel) panel.classList.remove('active');
    
    // Reset gallery link
    const exploreLink = document.querySelector('.hud-explore-link');
    const exploreBtn = exploreLink ? exploreLink.querySelector('button') : null;
    if (exploreLink && exploreBtn) {
        exploreLink.href = `/astro`;
        exploreBtn.textContent = `Esplora Foto`;
    }
    
    const backBtn = document.getElementById('back-to-system');
    if (backBtn) backBtn.style.display = 'none';
}

// Bind HUD controls
function setupUIControls() {
    // Speed Slider
    const speedSlider = document.getElementById('speed-slider');
    const speedVal = document.getElementById('speed-value');
    if (speedSlider) {
        speedSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            globalSpeedMultiplier = val;
            
            if (speedVal) {
                if (val === 0) speedVal.textContent = 'Pausa';
                else speedVal.textContent = val.toFixed(1) + 'x';
            }
            
            // If user adjusts speed slider while focused, unfreeze the focus
            // but keep camera centered on the planet!
            if (activePlanet && val > 0) {
                // Keep controls.target matching planet world position inside animation loop
            }
        });
    }
    
    // Toggle Orbit Lines
    const orbitToggle = document.getElementById('orbit-toggle');
    if (orbitToggle) {
        orbitToggle.addEventListener('click', () => {
            orbitLinesVisible = !orbitLinesVisible;
            planets.forEach(p => {
                p.orbitLine.visible = orbitLinesVisible;
            });
            orbitToggle.classList.toggle('off', !orbitLinesVisible);
            orbitToggle.textContent = orbitLinesVisible ? 'Nascondi Orbite' : 'Mostra Orbite';
        });
    }
    
    // Back to system view
    const backBtn = document.getElementById('back-to-system');
    if (backBtn) {
        backBtn.addEventListener('click', resetToGlobalView);
    }
}

// Main Render Loop
function animate() {
    animId = requestAnimationFrame(animate);
    
    // Rotate Sun
    if (sun) {
        sun.rotation.y += 0.002;
    }
    
    // Update planetary orbits
    planets.forEach(p => {
        // Orbit speed affected by global speed slider
        p.pivot.rotation.y += p.mesh.userData.orbitSpeed * globalSpeedMultiplier;
        
        // Axial rotation (rotation of the planet on its own axis)
        p.mesh.rotation.y += p.mesh.userData.rotSpeed;
        
        // Moon orbit & synchronous rotation (if Earth)
        if (p.mesh.userData.moonPivot) {
            p.mesh.userData.moonPivot.rotation.y += 0.02 * globalSpeedMultiplier;
            p.mesh.userData.moonMesh.rotation.y += 0.005 * globalSpeedMultiplier;
        }
    });
    
    // In focus mode, lock controls target directly to the moving planet
    if (activePlanet && !isTransitioning) {
        const currentWorldPos = new THREE.Vector3();
        activePlanet.getWorldPosition(currentWorldPos);
        
        // Shift camera coordinate together with the planet's orbit
        const camOffset = camera.position.clone().sub(controls.target);
        controls.target.copy(currentWorldPos);
        camera.position.copy(currentWorldPos).add(camOffset);
    }
    
    if (!isTransitioning) {
        controls.update();
    }
    renderer.render(scene, camera);
}

// Resize event
function onWindowResize() {
    const container = document.getElementById('solar-system-container');
    if (!container || !renderer) return;
    
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    
    renderer.setSize(width, height);
}

// Start simulation on DOM load
document.addEventListener('DOMContentLoaded', () => {
    // Delay slightly to ensure layout rendering is complete and sizes are stable
    setTimeout(initSolarSystem, 100);
});
