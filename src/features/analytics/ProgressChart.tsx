import { useEffect, useRef } from "react";
import { progressSeries } from "./chartSeries";
import type { Solve } from "../sessions/types";

type ProgressChartProps = {
  solves: Solve[];
};

export function ProgressChart({ solves }: ProgressChartProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const scale = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * scale));
    canvas.height = Math.max(1, Math.floor(rect.height * scale));
    context.scale(scale, scale);
    context.clearRect(0, 0, rect.width, rect.height);

    const series = progressSeries(solves).filter((point) => point.single != null);
    context.strokeStyle = "rgba(255,255,255,0.07)";
    context.lineWidth = 1;
    for (let index = 0; index < 4; index += 1) {
      const y = (rect.height / 4) * index + 8;
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(rect.width, y);
      context.stroke();
    }

    if (series.length < 2) {
      context.fillStyle = "rgba(244,244,240,0.35)";
      context.font = "12px ui-monospace, monospace";
      context.fillText("Need more solves", 12, 24);
      return;
    }

    const values = series
      .flatMap((point) => [point.single, point.ao5, point.ao12])
      .filter((value): value is number => value != null);
    const min = Math.min(...values) - 0.8;
    const max = Math.max(...values) + 0.8;
    const x = (index: number) => (index / Math.max(1, series.length - 1)) * (rect.width - 16) + 8;
    const y = (value: number) =>
      rect.height - 10 - ((value - min) / Math.max(1, max - min)) * (rect.height - 22);

    const drawingContext = context;

    function drawLine(key: "single" | "ao5" | "ao12", color: string, width: number) {
      drawingContext.strokeStyle = color;
      drawingContext.lineWidth = width;
      drawingContext.beginPath();
      let started = false;
      series.forEach((point, index) => {
        const value = point[key];
        if (value == null) {
          return;
        }

        if (!started) {
          drawingContext.moveTo(x(index), y(value));
          started = true;
        } else {
          drawingContext.lineTo(x(index), y(value));
        }
      });
      drawingContext.stroke();
    }

    drawLine("single", "rgba(244,244,240,0.42)", 1);
    drawLine("ao5", "#ff6a5e", 1.5);
    drawLine("ao12", "#6e8bff", 1.5);
  }, [solves]);

  return <canvas ref={ref} className="h-[150px] w-full" />;
}
