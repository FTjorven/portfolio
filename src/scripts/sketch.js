const s = (p) => {
    let resolution = 8; // smaller = more rectangles = smoother visual
    let cols, rows;
    let rectWidth, rectHeight;

    p.setup = () => {
        console.log('Setting up canvas');

        const container = document.getElementById('desktop-hero-canvas');
        console.log('Container:', container);
        console.log('Container dimensions:', container.offsetWidth, container.offsetHeight);

        p.createCanvas(container.offsetWidth, container.offsetHeight).parent(container);
        console.log('Canvas created:', p.width, p.height);
        updateGrid();
    };

    p.windowResized = () => {
        const container = document.getElementById('desktop-hero-canvas');
        p.resizeCanvas(container.offsetWidth, container.offsetHeight);
        updateGrid();
    };

    function updateGrid() {
        rectWidth = p.width * 1;    // larger sketch area
        rectHeight = p.height * 1;  // larger sketch area
        cols = Math.floor(rectWidth / resolution);
        rows = Math.floor(rectHeight / resolution);
    }

    p.draw = () => {
        p.background(0);

        let startX = (p.width - rectWidth) / 2;
        let startY = (p.height - rectHeight) / 2;

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                let px = x * resolution;
                let py = y * resolution;

                // distortion
                let dx = startX + px - p.mouseX;
                let dy = startY + py - p.mouseY;
                let d = Math.sqrt(dx * dx + dy * dy);
                let distortion = Math.sin(d * 0.05) * 30; // slightly larger effect

                let mixValue = p.constrain((px + distortion) / rectWidth, 0, 1);

                let r = p.lerp(147, 34, mixValue);
                let g = 0;
                let b = p.lerp(23, 120, mixValue);

                p.noStroke();
                p.fill(r, g, b);
                p.rect(startX + px, startY + py, resolution, resolution);
            }
        }
    };
};

new p5(s);
