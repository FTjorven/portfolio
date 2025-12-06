const s = (p) => {
    let resolution = 8;
    let cols, rows;
    let ripples = [];

    p.setup = () => {
        const container = document.getElementById('desktop-hero-canvas');
        p.createCanvas(container.offsetWidth, container.offsetHeight).parent(container);
        updateGrid();
    };

    p.windowResized = () => {
        const container = document.getElementById('desktop-hero-canvas');
        p.resizeCanvas(container.offsetWidth, container.offsetHeight);
        updateGrid();
    };

    function updateGrid() {
        cols = Math.floor(p.width / resolution);
        rows = Math.floor(p.height / resolution);
    }

    p.mousePressed = () => {
        if (p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
            ripples.push({ x: p.mouseX, y: p.mouseY, radius: 0, speed: 8 });
        }
    };

    p.draw = () => {
        p.background(0);

        // Update ripples
        ripples = ripples.filter(ripple => {
            ripple.radius += ripple.speed;
            ripple.speed *= 0.985;
            return ripple.speed > 0.1 && ripple.radius < 300;
        });

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                let px = x * resolution;
                let py = y * resolution;

                // Mouse distortion
                let dx = px - p.mouseX;
                let dy = py - p.mouseY;
                let mouseDist = Math.sqrt(dx * dx + dy * dy);
                let distortion = Math.sin(mouseDist * 0.05) * 30;

                // Ripple effects
                let rippleEffect = 0;
                for (let ripple of ripples) {
                    let rdx = px - ripple.x;
                    let rdy = py - ripple.y;
                    let rippleDist = Math.sqrt(rdx * rdx + rdy * rdy);
                    let wave = Math.sin((rippleDist - ripple.radius) * 0.15) * 40;
                    let fade = p.constrain(1 - rippleDist / 300, 0, 1);
                    rippleEffect += wave * fade * (ripple.speed / 8);
                }

                let mixValue = p.constrain((px + distortion + rippleEffect) / p.width, 0, 1);

                let r = p.lerp(147, 34, mixValue);
                let g = Math.abs(rippleEffect * 0.5);
                let b = p.lerp(23, 120, mixValue);

                p.noStroke();
                p.fill(r, g, b);
                p.rect(px, py, resolution, resolution);
            }
        }
    };
};

new p5(s);
