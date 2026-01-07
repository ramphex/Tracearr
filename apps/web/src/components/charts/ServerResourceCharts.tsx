import { useMemo } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import type { ServerResourceDataPoint } from '@tracearr/shared';
import { ChartSkeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cpu, MemoryStick, Network } from 'lucide-react';

// Colors matching Plex's style
const COLORS = {
  process: '#00b4e4', // Plex-style cyan for "Plex Media Server"
  system: '#cc7b9f', // Pink/purple for "System"
  processGradientStart: 'rgba(0, 180, 228, 0.3)',
  processGradientEnd: 'rgba(0, 180, 228, 0.05)',
  systemGradientStart: 'rgba(204, 123, 159, 0.3)',
  systemGradientEnd: 'rgba(204, 123, 159, 0.05)',
};

interface ServerResourceChartsProps {
  data: ServerResourceDataPoint[] | undefined;
  isLoading?: boolean;
  averages?: {
    hostCpu: number;
    processCpu: number;
    hostMemory: number;
    processMemory: number;
    totalBandwidth: number;
    lanBandwidth: number;
    wanBandwidth: number;
  } | null;
}

interface ResourceChartProps {
  title: string;
  icon: React.ReactNode;
  data: ServerResourceDataPoint[] | undefined;
  processKey: 'processCpuUtilization' | 'processMemoryUtilization';
  hostKey: 'hostCpuUtilization' | 'hostMemoryUtilization';
  processAvg?: number;
  hostAvg?: number;
  isLoading?: boolean;
}

interface BandwidthChartProps {
  data: ServerResourceDataPoint[] | undefined;
  isLoading?: boolean;
  lanAvg?: number;
  wanAvg?: number;
}

// Static x-axis labels (7 ticks at 20s intervals over 2 minutes)
const X_LABELS: Record<number, string> = {
  [-120]: '2m',
  [-100]: '1m 40s',
  [-80]: '1m 20s',
  [-60]: '1m',
  [-40]: '40s',
  [-20]: '20s',
  [0]: 'NOW',
};

/**
 * Single resource chart (CPU or RAM)
 */
function ResourceChart({
  title,
  icon,
  data,
  processKey,
  hostKey,
  processAvg,
  hostAvg,
  isLoading,
}: ResourceChartProps) {
  const chartOptions = useMemo<Highcharts.Options>(() => {
    if (!data || data.length === 0) {
      return {};
    }

    // Map data points to x positions in -120 to 0 range
    // Data is sorted oldest first, spread across the 2-minute window
    const processData: [number, number][] = [];
    const hostData: [number, number][] = [];

    const n = data.length;
    for (let i = 0; i < n; i++) {
      const point = data[i];
      if (!point) continue;
      // Spread points from -120 (oldest) to 0 (newest)
      const x = n === 1 ? 0 : -120 + (i * 120) / (n - 1);
      processData.push([x, point[processKey]]);
      hostData.push([x, point[hostKey]]);
    }

    // Calculate dynamic Y-axis max (round up to nearest 10, min 20)
    const allValues = [...processData, ...hostData].map(([, y]) => y);
    const maxValue = Math.max(...allValues, 0);
    const yMax = Math.max(20, Math.ceil(maxValue / 10) * 10);

    return {
      chart: {
        type: 'area',
        height: 180,
        backgroundColor: 'transparent',
        style: {
          fontFamily: 'inherit',
        },
        spacing: [10, 10, 15, 10],
        reflow: true,
      },
      title: {
        text: undefined,
      },
      credits: {
        enabled: false,
      },
      legend: {
        enabled: true,
        align: 'left',
        verticalAlign: 'top',
        floating: false,
        itemStyle: {
          color: 'hsl(var(--muted-foreground))',
          fontWeight: 'normal',
          fontSize: '11px',
        },
        itemHoverStyle: {
          color: 'hsl(var(--foreground))',
        },
      },
      xAxis: {
        type: 'linear',
        min: -120,
        max: 0,
        tickInterval: 20,
        labels: {
          style: {
            color: 'hsl(var(--muted-foreground))',
            fontSize: '10px',
          },
          formatter: function () {
            return X_LABELS[this.value as number] || '';
          },
        },
        lineColor: 'hsl(var(--border))',
        tickColor: 'hsl(var(--border))',
      },
      yAxis: {
        title: {
          text: undefined,
        },
        labels: {
          style: {
            color: 'hsl(var(--muted-foreground))',
            fontSize: '10px',
          },
          format: '{value}%',
        },
        gridLineColor: 'hsl(var(--border) / 0.5)',
        min: 0,
        max: yMax,
        tickInterval: yMax <= 20 ? 5 : 10,
      },
      plotOptions: {
        area: {
          marker: {
            enabled: false,
            states: {
              hover: {
                enabled: true,
                radius: 3,
              },
            },
          },
          lineWidth: 2,
          states: {
            hover: {
              lineWidth: 2,
            },
          },
          threshold: null,
          connectNulls: false, // Don't connect across null values
        },
      },
      tooltip: {
        shared: true,
        backgroundColor: 'hsl(var(--popover))',
        borderColor: 'hsl(var(--border))',
        style: {
          color: 'hsl(var(--popover-foreground))',
          fontSize: '11px',
        },
        formatter: function () {
          const points = this.points || [];
          let html = '';
          for (const point of points) {
            if (point.y !== null) {
              const color = point.series.color;
              html += `<span style="color:${color}">●</span> ${point.series.name}: <b>${Math.round(point.y as number)}%</b><br/>`;
            }
          }
          return html;
        },
      },
      series: [
        {
          type: 'area',
          name: 'Plex Media Server',
          data: processData,
          color: COLORS.process,
          fillColor: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [
              [0, COLORS.processGradientStart],
              [1, COLORS.processGradientEnd],
            ],
          },
        },
        {
          type: 'area',
          name: 'System',
          data: hostData,
          color: COLORS.system,
          fillColor: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [
              [0, COLORS.systemGradientStart],
              [1, COLORS.systemGradientEnd],
            ],
          },
        },
      ],
      responsive: {
        rules: [
          {
            condition: {
              maxWidth: 400,
            },
            chartOptions: {
              legend: {
                align: 'center',
                layout: 'horizontal',
                itemStyle: {
                  fontSize: '10px',
                },
              },
              xAxis: {
                tickInterval: 40,
                labels: {
                  style: {
                    fontSize: '9px',
                  },
                },
              },
            },
          },
        ],
      },
    };
  }, [data, processKey, hostKey]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartSkeleton height={180} />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="text-muted-foreground flex items-center justify-center rounded-lg border border-dashed text-sm"
            style={{ height: 180 }}
          >
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <span className="flex items-center gap-2">
            {icon}
            {title}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-2">
        <HighchartsReact
          highcharts={Highcharts}
          options={chartOptions}
          containerProps={{ style: { width: '100%', height: '100%' } }}
        />
        {/* Averages row */}
        <div className="text-muted-foreground mt-1 flex justify-end gap-4 pr-2 text-xs">
          <span>
            <span style={{ color: COLORS.process }}>●</span> Avg:{' '}
            <span className="text-foreground font-medium">{processAvg ?? '—'}%</span>
          </span>
          <span>
            <span style={{ color: COLORS.system }}>●</span> Avg:{' '}
            <span className="text-foreground font-medium">{hostAvg ?? '—'}%</span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Network bandwidth chart (LAN vs WAN)
 * Mirrors ResourceChart styling but formats Mbps values
 */
function BandwidthChart({ data, isLoading, lanAvg, wanAvg }: BandwidthChartProps) {
  const chartOptions = useMemo<Highcharts.Options>(() => {
    if (!data || data.length === 0) {
      return {};
    }

    const lanData: [number, number][] = [];
    const wanData: [number, number][] = [];

    const n = data.length;
    for (let i = 0; i < n; i++) {
      const point = data[i];
      if (!point) continue;
      const x = n === 1 ? 0 : -120 + (i * 120) / (n - 1);
      lanData.push([x, point.lanBandwidthMbps]);
      wanData.push([x, point.wanBandwidthMbps]);
    }

    const allValues = [...lanData, ...wanData].map(([, y]) => y);
    const maxValue = Math.max(...allValues, 0);
    const yMax = Math.max(5, Math.ceil(maxValue / 5) * 5);

    return {
      chart: {
        type: 'area',
        height: 180,
        backgroundColor: 'transparent',
        style: {
          fontFamily: 'inherit',
        },
        spacing: [10, 10, 15, 10],
        reflow: true,
      },
      title: { text: undefined },
      credits: { enabled: false },
      legend: {
        enabled: true,
        align: 'left',
        verticalAlign: 'top',
        itemStyle: {
          color: 'hsl(var(--muted-foreground))',
          fontWeight: 'normal',
          fontSize: '11px',
        },
        itemHoverStyle: {
          color: 'hsl(var(--foreground))',
        },
      },
      xAxis: {
        type: 'linear',
        min: -120,
        max: 0,
        tickInterval: 20,
        labels: {
          style: { color: 'hsl(var(--muted-foreground))', fontSize: '10px' },
          formatter: function () {
            return X_LABELS[this.value as number] || '';
          },
        },
        lineColor: 'hsl(var(--border))',
        tickColor: 'hsl(var(--border))',
      },
      yAxis: {
        title: { text: undefined },
        labels: {
          style: { color: 'hsl(var(--muted-foreground))', fontSize: '10px' },
          formatter: function () {
            return `${(this.value as number).toFixed(1)} Mbps`;
          },
        },
        gridLineColor: 'hsl(var(--border) / 0.5)',
        min: 0,
        max: yMax,
        tickInterval: yMax <= 10 ? 1 : 5,
      },
      plotOptions: {
        area: {
          marker: {
            enabled: false,
            states: {
              hover: { enabled: true, radius: 3 },
            },
          },
          lineWidth: 2,
          states: { hover: { lineWidth: 2 } },
          threshold: null,
          connectNulls: false,
        },
      },
      tooltip: {
        shared: true,
        backgroundColor: 'hsl(var(--popover))',
        borderColor: 'hsl(var(--border))',
        style: { color: 'hsl(var(--popover-foreground))', fontSize: '11px' },
        formatter: function () {
          const points = this.points || [];
          let html = '';
          for (const point of points) {
            if (point.y !== null) {
              const color = point.series.color;
              html += `<span style="color:${color}">●</span> ${point.series.name}: <b>${(point.y as number).toFixed(1)} Mbps</b><br/>`;
            }
          }
          return html;
        },
      },
      series: [
        {
          type: 'area',
          name: 'LAN',
          data: lanData,
          color: COLORS.process,
          fillColor: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [
              [0, COLORS.processGradientStart],
              [1, COLORS.processGradientEnd],
            ],
          },
        },
        {
          type: 'area',
          name: 'WAN',
          data: wanData,
          color: COLORS.system,
          fillColor: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [
              [0, COLORS.systemGradientStart],
              [1, COLORS.systemGradientEnd],
            ],
          },
        },
      ],
    };
  }, [data]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            <span className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              Network
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartSkeleton height={180} />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            <span className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              Network
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="text-muted-foreground flex items-center justify-center rounded-lg border border-dashed text-sm"
            style={{ height: 180 }}
          >
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <span className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            Network
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-2">
        <HighchartsReact
          highcharts={Highcharts}
          options={chartOptions}
          containerProps={{ style: { width: '100%', height: '100%' } }}
        />
        <div className="text-muted-foreground mt-1 flex justify-end gap-4 pr-2 text-xs">
          <span>
            <span style={{ color: COLORS.process }}>●</span> Avg:{' '}
            <span className="text-foreground font-medium">
              {lanAvg != null ? `${lanAvg.toFixed(1)} Mbps` : '—'}
            </span>
          </span>
          <span>
            <span style={{ color: COLORS.system }}>●</span> Avg:{' '}
            <span className="text-foreground font-medium">
              {wanAvg != null ? `${wanAvg.toFixed(1)} Mbps` : '—'}
            </span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Server resource monitoring charts (CPU + RAM + Network)
 * Displays real-time server resource utilization matching Plex's dashboard style
 */
export function ServerResourceCharts({ data, isLoading, averages }: ServerResourceChartsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <ResourceChart
        title="CPU"
        icon={<Cpu className="h-4 w-4" />}
        data={data}
        processKey="processCpuUtilization"
        hostKey="hostCpuUtilization"
        processAvg={averages?.processCpu}
        hostAvg={averages?.hostCpu}
        isLoading={isLoading}
      />
      <ResourceChart
        title="RAM"
        icon={<MemoryStick className="h-4 w-4" />}
        data={data}
        processKey="processMemoryUtilization"
        hostKey="hostMemoryUtilization"
        processAvg={averages?.processMemory}
        hostAvg={averages?.hostMemory}
        isLoading={isLoading}
      />
      <BandwidthChart
        data={data}
        lanAvg={averages?.lanBandwidth}
        wanAvg={averages?.wanBandwidth}
        isLoading={isLoading}
      />
    </div>
  );
}
