import React from 'react'
import { Group } from '@visx/group'
import { scaleTime, scaleBand } from '@visx/scale'
import { AxisBottom, AxisLeft } from '@visx/axis'
import { Bar } from '@visx/shape'
import { timeFormat } from 'd3-time-format'

const GanttChart = ({ data, width, height }) => {
    const margin = { top: 20, right: 30, bottom: 50, left: 120 };
    const xMax = width - margin.left - margin.right;
    const yMax = height - margin.top - margin.bottom;

    const apps = Array.from(new Set(data.map(d => d.App)));

    const xScale = scaleTime({
        domain: [new Date(Math.min(...data.map(d => new Date(d.session_start).getTime()))), new Date(Math.max(...data.map(d => new Date(d.session_end).getTime())))],
        range: [0, xMax],
    });

    const yScale = scaleBand({
        domain: apps,
        range: [0, yMax],
        padding: 0.2,
    });

    return (
        <svg width={width} height={height}>
            <Group left={margin.left} top={margin.top}>
                {data.map((d, i) => {
                    const barWidth = xScale(new Date(d.session_end)) - xScale(new Date(d.session_start));
                    const barX = xScale(new Date(d.session_start));
                    const barY = yScale(d.App) ?? 0;

                    return (
                        <Bar
                            key={`bar-${i}`}
                            x={barX}
                            y={barY}
                            width={barWidth}
                            height={yScale.bandwidth()}
                            fill="#8D33FF"
                            rx={4}
                            ry={4}
                        />
                    );
                })}
                <AxisBottom
                    top={yMax}
                    scale={xScale}
                    
                    tickFormat={timeFormat('%H:%M:%S')}
                    numTicks={width > 520 ? 10 : 5}
                />
                <AxisLeft
                    left={0}
                    hideAxisLine={true}
                    hideTicks={true}
                    
                    scale={yScale}
                    tickFormat={app => app} // Format the ticks as the app names
                    />
            </Group>
        </svg>
    );
};

export default GanttChart
