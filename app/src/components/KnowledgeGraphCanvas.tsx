'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface GraphNode {
  id: string;
  label: string;
  type: string;
  size: number;
  color: string;
  url?: string;
  wordCount?: number;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  size: number;
  color: string;
  similarity?: number;
}

interface KnowledgeGraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick?: (nodeId: string) => void;
}

interface D3Node extends d3.SimulationNodeDatum, GraphNode {}
interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  id: string;
  size: number;
  color: string;
  similarity?: number;
}

export default function KnowledgeGraphCanvas({
  nodes,
  edges,
  onNodeClick,
}: KnowledgeGraphCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || nodes.length === 0) return;

    d3.select(svgRef.current).selectAll('*').remove();

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    const graphNodes: D3Node[] = nodes.map(n => ({ ...n }));
    const graphLinks: D3Link[] = [];

edges.forEach(e => {
  const source = graphNodes.find(n => n.id === e.source);
  const target = graphNodes.find(n => n.id === e.target);

  if (source && target) {
    graphLinks.push({
      ...e,
      source,
      target,
    });
  }
});


    // Simple force simulation
    const simulation = d3.forceSimulation<D3Node>(graphNodes)
      .force('link', d3.forceLink<D3Node, D3Link>(graphLinks)
        .id(d => d.id)
        .distance(200))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(50));

    // Draw links
    const link = g.append('g')
      .selectAll('line')
      .data(graphLinks)
      .join('line')
      .attr('stroke', '#e5e7eb')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', d => d.size || 2);

    // Draw nodes
    const node = g.append('g')
      .selectAll('g')
      .data(graphNodes)
      .join('g')
      .style('cursor', 'pointer')
      .call(d3.drag<SVGGElement, D3Node>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }) as any);

    // Node background
    node.append('rect')
      .attr('width', 140)
      .attr('height', 60)
      .attr('x', -70)
      .attr('y', -30)
      .attr('rx', 8)
      .attr('fill', '#fff')
      .attr('stroke', d => d.color)
      .attr('stroke-width', 3);

    // Document icon
    node.append('text')
      .text('📄')
      .attr('x', 0)
      .attr('y', -5)
      .attr('text-anchor', 'middle')
      .attr('font-size', '24px')
      .attr('pointer-events', 'none');

    // Title
    node.append('text')
      .text(d => d.label.length > 18 ? d.label.substring(0, 18) + '...' : d.label)
      .attr('x', 0)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('fill', '#1f2937')
      .attr('pointer-events', 'none');

    // Hover effects
    node.on('mouseenter', function() {
      d3.select(this).select('rect')
        .transition()
        .duration(200)
        .attr('stroke-width', 4)
        .attr('fill', '#f9fafb');
    }).on('mouseleave', function() {
      d3.select(this).select('rect')
        .transition()
        .duration(200)
        .attr('stroke-width', 3)
        .attr('fill', '#fff');
    });

    // Click handler
    if (onNodeClick) {
      node.on('click', (event, d) => {
        event.stopPropagation();
        onNodeClick(d.id);
      });
    }

    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as D3Node).x!)
        .attr('y1', d => (d.source as D3Node).y!)
        .attr('x2', d => (d.target as D3Node).x!)
        .attr('y2', d => (d.target as D3Node).y!);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, edges, onNodeClick]);

  return (
    <div ref={containerRef} className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg relative">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
}