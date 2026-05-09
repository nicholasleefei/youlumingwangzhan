import React, { useEffect, useRef } from 'react';

export default function MosaicAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('Canvas ref is null');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Canvas context not found');
      return;
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // 绘制背景
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制大标题
    ctx.fillStyle = '#ffffff';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('马赛克动画测试', canvas.width / 2, 100);
    
    // 绘制彩色方块
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    const size = 50;
    
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        const color = colors[(i + j) % colors.length];
        ctx.fillStyle = color;
        ctx.fillRect(i * (size + 10) + 50, j * (size + 10) + 150, size, size);
      }
    }
    
  }, []);

  return (
    <div style={{ 
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: '#000000'
    }}>
      <canvas
        ref={canvasRef}
        style={{ 
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      />
      <div style={{ 
        position: 'absolute',
        top: '20px',
        left: '20px',
        color: '#ffffff',
        fontSize: '24px',
        zIndex: 1
      }}>
        测试模式：如果看到黑色背景和彩色方块，说明Canvas正常工作！
      </div>
    </div>
  );
}
