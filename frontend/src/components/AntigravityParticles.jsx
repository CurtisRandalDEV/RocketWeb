import React, { useEffect, useRef } from 'react';

export default function AntigravityParticles() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationId;
        
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        const particles = [];
        // Space/Stars style colors: Mostly white/light gray, with subtle orange hints to match brand
        const colors = ['#ffffff', '#f3f4f6', '#9ca3af', '#f97316', '#ea580c'];

        for (let i = 0; i < 300; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 1.5 + 0.5,
                speedX: (Math.random() - 0.5) * 0.15,
                speedY: (Math.random() - 0.5) * 0.15,
                color: colors[Math.floor(Math.random() * colors.length)],
                opacity: Math.random() * 0.7 + 0.1,
                pulseSpeed: Math.random() * 0.005 + 0.001, // Much slower pulsing
                pulseDir: Math.random() > 0.5 ? 1 : -1
            });
        }

        // Load rocket image for flying rockets
        const rocketImg = new Image();
        rocketImg.src = '/logo/Logo_Rocket_Designers.png';
        const rockets = [];
        
        for (let i = 0; i < 3; i++) {
            rockets.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 30 + 20, // 20px to 50px
                speedX: Math.random() * 1.5 + 0.5,
                speedY: -(Math.random() * 1.5 + 0.5),
                opacity: Math.random() * 0.3 + 0.1 // Semi-transparent
            });
        }

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw blurred background stars
            ctx.filter = 'blur(1.5px)';
            particles.forEach(p => {
                ctx.save();
                ctx.translate(p.x, p.y);
                
                // Pulsing opacity effect
                p.opacity += p.pulseSpeed * p.pulseDir;
                if (p.opacity >= 1) { p.opacity = 1; p.pulseDir = -1; }
                if (p.opacity <= 0.1) { p.opacity = 0.1; p.pulseDir = 1; }

                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.opacity;
                
                ctx.beginPath();
                ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();

                p.x += p.speedX;
                p.y += p.speedY;

                if (p.x < -10) p.x = canvas.width + 10;
                if (p.x > canvas.width + 10) p.x = -10;
                if (p.y < -10) p.y = canvas.height + 10;
                if (p.y > canvas.height + 10) p.y = -10;
            });

            // Draw sharp rockets
            ctx.filter = 'none';
            if (rocketImg.complete && rocketImg.naturalHeight !== 0) {
                rockets.forEach(r => {
                    ctx.save();
                    ctx.globalAlpha = r.opacity;
                    // Draw image centered
                    ctx.drawImage(rocketImg, r.x, r.y, r.size, r.size);
                    ctx.restore();

                    r.x += r.speedX;
                    r.y += r.speedY;

                    // Reset rocket if it goes off screen (top right)
                    if (r.x > canvas.width + 50 || r.y < -50) {
                        r.x = -50 - Math.random() * 200; // Start off screen left
                        r.y = canvas.height + Math.random() * 200; // Start off screen bottom
                        r.size = Math.random() * 30 + 20;
                        r.speedX = Math.random() * 1.5 + 0.5;
                        r.speedY = -(Math.random() * 1.5 + 0.5);
                    }
                });
            }

            animationId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationId);
        };
    }, []);

    return (
        <canvas 
            ref={canvasRef} 
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 0,
                pointerEvents: 'none'
            }}
        />
    );
}
