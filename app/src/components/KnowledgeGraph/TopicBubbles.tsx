'use client';

import { useEffect, useRef, useState } from 'react';

interface Topic {
  id: string;
  name: string;
  category: string;
  documentCount: number;
  totalWords: number;
}

interface TopicBubblesProps {
  topics: Topic[];
  onTopicClick: (topicId: string) => void;
  selectedTopicId?: string;
}

export default function TopicBubbles({ topics, onTopicClick, selectedTopicId }: TopicBubblesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredTopic, setHoveredTopic] = useState<string | null>(null);
  const [bubbles, setBubbles] = useState<any[]>([]);

  const CATEGORY_COLORS: Record<string, string> = {
    'Technology': '#3b82f6',
    'Science': '#10b981',
    'Business': '#8b5cf6',
    'Personal': '#f59e0b',
    'Creative': '#ec4899',
    'Education': '#06b6d4',
    'General': '#6b7280',
  };

  useEffect(() => {
    if (!topics || topics.length === 0) return;

    // Initialize bubble positions
    const newBubbles = topics.map((topic, index) => {
      const radius = Math.sqrt(topic.documentCount) * 20 + 30;
      const angle = (index / topics.length) * Math.PI * 2;
      const distance = 150;

      return {
        ...topic,
        x: 400 + Math.cos(angle) * distance,
        y: 300 + Math.sin(angle) * distance,
        targetX: 400 + Math.cos(angle) * distance,
        targetY: 300 + Math.sin(angle) * distance,
        vx: 0,
        vy: 0,
        radius,
        color: CATEGORY_COLORS[topic.category] || CATEGORY_COLORS.General,
      };
    });

    setBubbles(newBubbles);
  }, [topics]);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current || bubbles.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const container = containerRef.current;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    let animationFrame: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update bubble physics
      bubbles.forEach((bubble, i) => {
        // Attraction to target position
        const dx = bubble.targetX - bubble.x;
        const dy = bubble.targetY - bubble.y;
        bubble.vx += dx * 0.01;
        bubble.vy += dy * 0.01;

        // Repulsion from other bubbles
        bubbles.forEach((other, j) => {
          if (i === j) return;
          const dx = bubble.x - other.x;
          const dy = bubble.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = bubble.radius + other.radius + 10;

          if (dist < minDist && dist > 0) {
            const force = (minDist - dist) / dist * 0.5;
            bubble.vx += dx * force;
            bubble.vy += dy * force;
          }
        });

        // Apply velocity with damping
        bubble.vx *= 0.9;
        bubble.vy *= 0.9;
        bubble.x += bubble.vx;
        bubble.y += bubble.vy;

        // Keep in bounds
        bubble.x = Math.max(bubble.radius, Math.min(canvas.width - bubble.radius, bubble.x));
        bubble.y = Math.max(bubble.radius, Math.min(canvas.height - bubble.radius, bubble.y));

        // Draw bubble
        const isSelected = selectedTopicId === bubble.id;
        const isHovered = hoveredTopic === bubble.id;

        // Glow effect for selected/hovered
        if (isSelected || isHovered) {
          ctx.shadowBlur = 20;
          ctx.shadowColor = bubble.color;
        } else {
          ctx.shadowBlur = 0;
        }

        // Draw circle
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
        ctx.fillStyle = bubble.color + (isSelected ? 'ff' : isHovered ? 'dd' : '99');
        ctx.fill();

        // Border
        ctx.strokeStyle = bubble.color;
        ctx.lineWidth = isSelected ? 4 : 2;
        ctx.stroke();

        ctx.shadowBlur = 0;

        // Draw text
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.max(12, bubble.radius / 4)}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Wrap text
        const words = bubble.name.split(' ');
        const maxWidth = bubble.radius * 1.6;
        let lines: string[] = [];
        let currentLine = '';

        words.forEach((word: string) => {
          const testLine = currentLine + (currentLine ? ' ' : '') + word;
          const metrics = ctx.measureText(testLine);

          if (metrics.width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        });

        if (currentLine) lines.push(currentLine);

        // Limit to 2 lines
        lines = lines.slice(0, 2);

        const lineHeight = Math.max(14, bubble.radius / 3.5);
        const startY = bubble.y - ((lines.length - 1) * lineHeight) / 2;

        lines.forEach((line, i) => {
          ctx.fillText(line, bubble.x, startY + i * lineHeight);
        });

        // Draw count
        ctx.font = `${Math.max(10, bubble.radius / 5)}px Inter, sans-serif`;
        ctx.fillText(
          `${bubble.documentCount} docs`,
          bubble.x,
          bubble.y + bubble.radius - 15
        );
      });

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [bubbles, selectedTopicId, hoveredTopic]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let foundTopic: string | null = null;

    for (const bubble of bubbles) {
      const dx = x - bubble.x;
      const dy = y - bubble.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < bubble.radius) {
        foundTopic = bubble.id;
        break;
      }
    }

    setHoveredTopic(foundTopic);
    canvas.style.cursor = foundTopic ? 'pointer' : 'default';
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (const bubble of bubbles) {
      const dx = x - bubble.x;
      const dy = y - bubble.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < bubble.radius) {
        onTopicClick(bubble.id);
        break;
      }
    }
  };

  return (
    <div ref={containerRef} className="w-full h-full relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        className="w-full h-full"
      />

      {hoveredTopic && (
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur rounded-lg p-3 shadow-lg border border-gray-200 pointer-events-none">
          {(() => {
            const topic = bubbles.find(b => b.id === hoveredTopic);
            if (!topic) return null;
            return (
              <>
                <div className="font-semibold text-gray-900">{topic.name}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {topic.documentCount} documents • {(topic.totalWords / 1000).toFixed(1)}K words
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Category: {topic.category}
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}