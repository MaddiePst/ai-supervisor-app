import React from "react";
import { useEffect, useRef } from "react";

export default function NeuralBackground() {
  // Reference to the canvas DOM element
  const canvasRef = useRef(null);

  // Runs when the component mounts
  useEffect(() => {
    // React stores the HTML canvas el in canvas 
    const canvas = canvasRef.current;
    // The canvas needs the drawing context to render shapes
    const ctx = canvas.getContext("2d");
    // Stores ID of the animation frame
    let animationFrameId;

    // Canvas must match the actual size of the element
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    // if the browser window changes size, it will automatically resize
    window.addEventListener("resize", resize);

    // Creates nodes
    const nodes = Array.from({ length: 80 }).map(() => ({
      x: Math.random() * canvas.offsetWidth,
      y: Math.random() * canvas.offsetHeight,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
    }));

    // draw funct runs every animation frame. It updates positions and redraws everything
    const draw = () => {
      // Clears previous frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Moves the nodes using velocity
      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;

        // If node hits edge, creates bouncing effect
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;

        // Starts a new shape 
        ctx.beginPath();
        ctx.arc(n.x, n.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = "#0EA5E9";
        ctx.fill();
      });

      // draw lines between nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          // Calculation of distance
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          // Draw connection
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = "rgba(34, 211, 238, 0.15)";
            ctx.stroke();
          }
        }
      }

      // Animation creation and starting
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();
    // Cleanup - when the component unmounts, stop the animation
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Render the canvas
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}
