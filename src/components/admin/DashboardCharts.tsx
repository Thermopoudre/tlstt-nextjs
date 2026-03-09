'use client'

import { useEffect, useRef } from 'react'
import {
  Chart,
  LineElement,
  PointElement,
  LineController,
  BarElement,
  BarController,
  CategoryScale,
  LinearScale,
  Tooltip,
  Filler,
} from 'chart.js'

Chart.register(
  LineElement,
  PointElement,
  LineController,
  BarElement,
  BarController,
  CategoryScale,
  LinearScale,
  Tooltip,
  Filler,
)

interface DashboardChartsProps {
  messagesData: { label: string; count: number }[]
  membresData: { label: string; count: number }[]
}

function MiniLineChart({
  data,
  color,
}: {
  data: { label: string; count: number }[]
  color: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    if (chartRef.current) chartRef.current.destroy()

    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels: data.map((d) => d.label),
        datasets: [
          {
            data: data.map((d) => d.count),
            borderColor: color,
            backgroundColor: color + '20',
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 5,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { tooltip: { mode: 'index', intersect: false } },
        scales: {
          x: { display: false },
          y: {
            display: false,
            beginAtZero: true,
            ticks: { precision: 0 },
          },
        },
      },
    })

    return () => { chartRef.current?.destroy() }
  }, [data, color])

  return <canvas ref={canvasRef} />
}

function MiniBarChart({
  data,
  color,
}: {
  data: { label: string; count: number }[]
  color: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    if (chartRef.current) chartRef.current.destroy()

    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels: data.map((d) => d.label),
        datasets: [
          {
            data: data.map((d) => d.count),
            backgroundColor: color + '99',
            borderColor: color,
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { tooltip: { mode: 'index', intersect: false } },
        scales: {
          x: { display: false },
          y: {
            display: false,
            beginAtZero: true,
            ticks: { precision: 0 },
          },
        },
      },
    })

    return () => { chartRef.current?.destroy() }
  }, [data, color])

  return <canvas ref={canvasRef} />
}

export default function DashboardCharts({ messagesData, membresData }: DashboardChartsProps) {
  const totalMessages = messagesData.reduce((s, d) => s + d.count, 0)
  const totalMembres = membresData.reduce((s, d) => s + d.count, 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Messages 7 derniers jours */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <i className="fas fa-envelope text-red-500"></i>
            Messages reçus
          </h3>
          <span className="text-xs text-gray-400">7 derniers jours</span>
        </div>
        <p className="text-2xl font-bold text-primary mb-3">{totalMessages}</p>
        <div className="h-20">
          <MiniLineChart data={messagesData} color="#ef4444" />
        </div>
        <div className="flex justify-between mt-2">
          {messagesData.map((d) => (
            <span key={d.label} className="text-[10px] text-gray-400">{d.label}</span>
          ))}
        </div>
      </div>

      {/* Inscriptions membres 7 dernières semaines */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <i className="fas fa-user-plus text-green-500"></i>
            Nouvelles inscriptions
          </h3>
          <span className="text-xs text-gray-400">7 dernières semaines</span>
        </div>
        <p className="text-2xl font-bold text-primary mb-3">{totalMembres}</p>
        <div className="h-20">
          <MiniBarChart data={membresData} color="#22c55e" />
        </div>
        <div className="flex justify-between mt-2">
          {membresData.map((d) => (
            <span key={d.label} className="text-[10px] text-gray-400">{d.label}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
