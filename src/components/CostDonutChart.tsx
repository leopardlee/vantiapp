import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface DataPoint {
  label: string;
  value: number;
  color: string;
}

interface CostDonutChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
}

export const CostDonutChart = ({ data, width = 200, height = 200 }: CostDonutChartProps) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const radius = Math.min(width, height) / 2;
    const g = svg.append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const pie = d3.pie<DataPoint>()
      .value(d => d.value)
      .sort(null);

    const arc = d3.arc<d3.PieArcDatum<DataPoint>>()
      .innerRadius(radius * 0.6)
      .outerRadius(radius * 0.9)
      .cornerRadius(4);

    const arcs = g.selectAll(".arc")
      .data(pie(data))
      .enter()
      .append("g")
      .attr("class", "arc");

    arcs.append("path")
      .attr("d", arc)
      .attr("fill", d => d.data.color)
      .attr("stroke", "#0f1117")
      .style("stroke-width", "2px")
      .style("opacity", 0.8)
      .transition()
      .duration(1000)
      .attrTween("d", function(d) {
        const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return function(t) {
          return arc(interpolate(t)) as string;
        };
      });

    // Center text
    const total = d3.sum(data, d => d.value);
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-0.2em")
      .attr("fill", "#6366f1")
      .style("font-size", "14px")
      .style("font-weight", "900")
      .text(`$${total.toFixed(0)}`);

    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "1.2em")
      .attr("fill", "#94a3b8")
      .style("font-size", "8px")
      .style("font-weight", "bold")
      .style("text-transform", "uppercase")
      .style("letter-spacing", "0.1em")
      .text("Total Est.");

  }, [data, width, height]);

  return (
    <div className="flex flex-col items-center">
      <svg ref={svgRef} width={width} height={height}></svg>
      <div className="grid grid-cols-2 gap-3 mt-4 w-full px-4">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase text-slate-500 leading-none">{d.label}</span>
              <span className="text-[11px] font-bold text-white">${d.value.toFixed(0)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
