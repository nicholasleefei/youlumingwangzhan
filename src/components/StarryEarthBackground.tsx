import { useEffect, useRef } from 'react';

const StarryEarthBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 创建星星
    const stars: { x: number; y: number; size: number; opacity: number; twinkleSpeed: number }[] = [];
    const numStars = 350;

    for (let i = 0; i < numStars; i++) {
      // 使用非线性分布，让某些区域更密集
      let x: number, y: number;

      if (Math.random() > 0.7) {
        // 30% 的星星聚集在左上部
        x = Math.random() * canvas.width * 0.4;
        y = Math.random() * canvas.height * 0.4;
      } else if (Math.random() > 0.5) {
        // 20% 的星星聚集在右上部
        x = canvas.width * 0.6 + Math.random() * canvas.width * 0.4;
        y = Math.random() * canvas.height * 0.5;
      } else {
        // 50% 的星星均匀分布在上半部分
        x = Math.random() * canvas.width;
        y = Math.random() * canvas.height * 0.7;
      }

      stars.push({
        x,
        y,
        size: Math.random() * 2.5 + 0.5,
        opacity: Math.random() * 0.9 + 0.1,
        twinkleSpeed: Math.random() * 0.03 + 0.005
      });
    }

    // 绘制星星
    const drawStars = (time: number) => {
      stars.forEach((star, index) => {
        const twinkle = Math.sin(time * star.twinkleSpeed + index) * 0.3 + 0.7;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * twinkle})`;
        ctx.fill();

        // 一些星星添加闪烁的十字效果
        if (Math.random() > 0.7) {
          ctx.beginPath();
          ctx.moveTo(star.x - star.size * 3, star.y);
          ctx.lineTo(star.x + star.size * 3, star.y);
          ctx.moveTo(star.x, star.y - star.size * 3);
          ctx.lineTo(star.x, star.y + star.size * 3);
          ctx.strokeStyle = `rgba(255, 255, 255, ${star.opacity * twinkle * 0.5})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });
    };

    // 绘制地球边缘发光
    const drawEarthGlow = (time: number) => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height * 1.1;
      const radius = canvas.width * 0.7;

      // 外层发光
      const outerGlow = ctx.createRadialGradient(
        centerX, centerY, radius * 0.7,
        centerX, centerY, radius * 1.3
      );
      outerGlow.addColorStop(0, 'rgba(0, 150, 255, 0.1)');
      outerGlow.addColorStop(0.5, 'rgba(50, 150, 255, 0.05)');
      outerGlow.addColorStop(1, 'rgba(0, 100, 200, 0)');

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.3, 0, Math.PI * 2);
      ctx.fillStyle = outerGlow;
      ctx.fill();

      // 地球表面渐变
      const earthGradient = ctx.createRadialGradient(
        centerX, centerY - radius * 0.2, radius * 0.1,
        centerX, centerY, radius
      );
      earthGradient.addColorStop(0, 'rgba(150, 200, 255, 0.4)');
      earthGradient.addColorStop(0.3, 'rgba(100, 180, 255, 0.3)');
      earthGradient.addColorStop(0.6, 'rgba(50, 150, 220, 0.25)');
      earthGradient.addColorStop(1, 'rgba(0, 100, 180, 0.15)');

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = earthGradient;
      ctx.fill();

      // 地球边缘高亮
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      const edgeGradient = ctx.createRadialGradient(
        centerX, centerY, radius * 0.95,
        centerX, centerY, radius * 1.05
      );
      edgeGradient.addColorStop(0, 'rgba(150, 220, 255, 0)');
      edgeGradient.addColorStop(0.5, 'rgba(150, 220, 255, 0.4)');
      edgeGradient.addColorStop(1, 'rgba(100, 180, 255, 0)');
      ctx.strokeStyle = edgeGradient;
      ctx.lineWidth = 30;
      ctx.stroke();

      // 添加动态的光晕效果
      const glowPulse = Math.sin(time * 0.001) * 0.1 + 1;
      const innerGlow = ctx.createRadialGradient(
        centerX, centerY, radius * 0.8,
        centerX, centerY, radius * 1.1
      );
      innerGlow.addColorStop(0, `rgba(100, 200, 255, ${0.15 * glowPulse})`);
      innerGlow.addColorStop(1, 'rgba(0, 150, 255, 0)');

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.1, 0, Math.PI * 2);
      ctx.fillStyle = innerGlow;
      ctx.fill();
    };

    // 绘制星空背景渐变
    const drawBackground = () => {
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#000510');
      gradient.addColorStop(0.4, '#001030');
      gradient.addColorStop(0.7, '#002050');
      gradient.addColorStop(1, '#003060');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    // 动画循环
    const animate = (time: number) => {
      drawBackground();
      drawStars(time);
      drawEarthGlow(time);
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: 'block', position: 'absolute', top: 0, left: 0, zIndex: 0 }}
    />
  );
};

export default StarryEarthBackground;
