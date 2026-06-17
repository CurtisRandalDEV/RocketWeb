import React, { useEffect, useRef } from 'react';

const words = [
    "Software a tu medida", "SaaS", "Redes Sociales", "Desarrollo Web", 
    "Apps Móviles", "E-commerce", "Diseño UX/UI", "Marketing Digital",
    "Innovación", "Escalabilidad", "Transformación Digital", "Rocket Designers"
];

export default function MatrixRain() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        const katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレゲゼデベペオォコソトノホモヨョロゴゾドボポヴッン';
        const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const alphabet = katakana + latin;

        const fontSize = 16;
        const columns = Math.floor(canvas.width / fontSize);
        
        // Vertical drops
        const drops = [];
        for (let x = 0; x < columns; x++) {
            drops[x] = Math.random() * -canvas.height; // start off screen randomly
        }

        // Horizontal flowing words
        const horizontalWords = words.map(() => ({
            x: Math.random() * -canvas.width * 2, // Start off-screen to the left
            y: Math.random() * canvas.height,
            text: words[Math.floor(Math.random() * words.length)],
            speed: Math.random() * 2 + 1,
            opacity: Math.random() * 0.4 + 0.2
        }));

        const draw = () => {
            // Semi-transparent dark background color to create trail effect
            ctx.fillStyle = 'rgba(11, 15, 25, 0.08)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.textAlign = 'left';

            // 1. Draw Vertical Classic Matrix Rain
            ctx.font = `${fontSize}px monospace`;
            for (let i = 0; i < drops.length; i++) {
                const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
                
                // Brighter orange for the falling head, fading into the trail
                ctx.fillStyle = '#f97316'; 
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                // Reset drop to top randomly
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }

            // 2. Draw Horizontal Words
            ctx.font = `bold ${fontSize * 1.5}px monospace`;
            horizontalWords.forEach(wordObj => {
                ctx.fillStyle = `rgba(251, 146, 60, ${wordObj.opacity})`; // Slightly lighter orange
                ctx.fillText(wordObj.text, wordObj.x, wordObj.y);
                
                wordObj.x += wordObj.speed;
                
                // Reset when word goes off screen to the right
                if (wordObj.x > canvas.width) {
                    ctx.font = `bold ${fontSize * 1.5}px monospace`; // ensure font is set before measure
                    wordObj.x = -ctx.measureText(wordObj.text).width - (Math.random() * 500);
                    wordObj.y = Math.random() * canvas.height;
                    wordObj.text = words[Math.floor(Math.random() * words.length)];
                    wordObj.speed = Math.random() * 2 + 1;
                }
            });

            requestAnimationFrame(draw);
        };

        const animationId = requestAnimationFrame(draw);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
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
                pointerEvents: 'none',
                opacity: 0.8
            }}
        />
    );
}
