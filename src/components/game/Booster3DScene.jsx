import React, { useEffect, useRef } from "react";

const STAGE_SPEED = { sealed: 0.7, shake: 3.8, charge: 2.2, crack: 4.5, explode: 8 };

export default function Booster3DScene({ stage = "sealed", color = "#8b5cf6", icon = "✦" }) {
  const canvasRef = useRef(null);
  const stageRef = useRef(stage);
  useEffect(() => { stageRef.current = stage; }, [stage]);

  useEffect(() => {
    let disposed = false;
    let frameId;
    const cleanups = [];
    const boot = async () => {
      const THREE = await import("three");
      if (disposed || !canvasRef.current) return;
      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true, antialias: false, powerPreference: "high-performance" });
      } catch {
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(320, 420, false);
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, 320 / 420, 0.1, 50);
      camera.position.set(0, 0, 7.4);
      scene.add(new THREE.AmbientLight(0xffffff, 1.6));
      const keyLight = new THREE.PointLight(0xffffff, 30, 20);
      keyLight.position.set(3, 4, 5);
      scene.add(keyLight);
      const rimLight = new THREE.PointLight(new THREE.Color(color), 42, 18);
      rimLight.position.set(-4, -2, 3);
      scene.add(rimLight);

      const art = document.createElement("canvas");
      art.width = 512; art.height = 720;
      const context = art.getContext("2d");
      const gradient = context.createLinearGradient(0, 0, 512, 720);
      gradient.addColorStop(0, color); gradient.addColorStop(0.55, "#111827"); gradient.addColorStop(1, "#020617");
      context.fillStyle = gradient; context.fillRect(0, 0, art.width, art.height);
      context.strokeStyle = "rgba(255,255,255,.45)"; context.lineWidth = 10; context.strokeRect(20, 20, 472, 680);
      context.strokeStyle = "rgba(255,255,255,.12)"; context.lineWidth = 2;
      for (let y = 70; y < 680; y += 42) { context.beginPath(); context.moveTo(30, y); context.lineTo(482, y - 35); context.stroke(); }
      context.textAlign = "center"; context.fillStyle = "white"; context.shadowColor = color; context.shadowBlur = 24;
      context.font = "900 90px sans-serif"; context.fillText(icon || "✦", 256, 300);
      context.shadowBlur = 10; context.font = "900 48px sans-serif"; context.fillText("MANGA", 256, 410);
      context.font = "700 22px sans-serif"; context.fillStyle = "rgba(255,255,255,.72)"; context.fillText("TRADING CARD GAME", 256, 452);
      const texture = new THREE.CanvasTexture(art); texture.colorSpace = THREE.SRGBColorSpace;
      const front = new THREE.MeshStandardMaterial({ map: texture, metalness: 0.35, roughness: 0.3, emissive: new THREE.Color(color), emissiveIntensity: 0.12 });
      const side = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.7, roughness: 0.22 });
      const pack = new THREE.Mesh(new THREE.BoxGeometry(2.5, 3.5, 0.34, 2, 2, 1), [side, side, side, side, front, side]);
      scene.add(pack);

      const particleCount = 70;
      const positions = new Float32Array(particleCount * 3);
      for (let index = 0; index < particleCount; index += 1) {
        positions[index * 3] = (Math.random() - 0.5) * 7;
        positions[index * 3 + 1] = (Math.random() - 0.5) * 8;
        positions[index * 3 + 2] = (Math.random() - 0.5) * 3;
      }
      const particleGeometry = new THREE.BufferGeometry(); particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const particles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({ color: new THREE.Color(color), size: 0.045, transparent: true, opacity: 0.8 }));
      scene.add(particles);

      const clock = new THREE.Clock();
      const render = () => {
        if (disposed) return;
        const elapsed = clock.getElapsedTime();
        const currentStage = stageRef.current;
        const speed = STAGE_SPEED[currentStage] || 1;
        pack.rotation.y = Math.sin(elapsed * speed) * (currentStage === "shake" || currentStage === "crack" ? 0.18 : 0.09);
        pack.rotation.x = Math.sin(elapsed * 1.2) * 0.04;
        pack.position.y = Math.sin(elapsed * 2.2) * 0.09;
        const charged = currentStage === "charge" || currentStage === "crack";
        front.emissiveIntensity = charged ? 0.75 + Math.sin(elapsed * 9) * 0.2 : currentStage === "explode" ? 1.8 : 0.12;
        const scale = currentStage === "explode" ? 1 + Math.min(0.8, elapsed % 0.3) : 1;
        pack.scale.setScalar(scale);
        particles.rotation.z = elapsed * 0.08 * speed;
        particles.material.opacity = charged ? 1 : 0.65;
        renderer.render(scene, camera);
        frameId = requestAnimationFrame(render);
      };
      render();
      cleanups.push(() => {
        cancelAnimationFrame(frameId); texture.dispose(); front.dispose(); side.dispose(); pack.geometry.dispose();
        particleGeometry.dispose(); particles.material.dispose(); renderer.dispose();
      });
    };
    boot();
    return () => { disposed = true; cleanups.forEach(cleanup => cleanup()); };
  }, [color, icon]);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-1/2 z-10 h-[420px] w-[320px] -translate-x-1/2 -translate-y-1/2" />;
}
