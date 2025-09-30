

import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { 
    createChart, 
    IChartApi, 
    ISeriesApi, 
    CandlestickData as LightweightCandlestickData,
    LineData,
    AreaSeriesPartialOptions,
    LineSeriesPartialOptions,
    ColorType,
    Time,
    MouseEventParams,
    Point,
    LineStyle as LightweightLineStyle,
    Logical,
    PriceLineOptions,
    IPriceLine,
} from 'lightweight-charts';
import { CandlestickData, ChartDrawings, PointInTime, Ruler, FibRetracement, Drawing, LineStyle, TrendLine, IndicatorConfig, BollingerBandsDataPoint, StochasticRsiDataPoint } from '../types';
import TrashIcon from './icons/TrashIcon';
import ExtendLeftIcon from './icons/ExtendLeftIcon';
import ExtendRightIcon from './icons/ExtendRightIcon';

type AnySeriesApi = ISeriesApi<any>;

interface TradingViewChartProps {
  data: CandlestickData[];
  activeTool: 'pan' | 'trendline' | 'ruler' | 'fib';
  drawings: ChartDrawings;
  onDrawingsChange: (drawings: ChartDrawings) => void;
  indicators: IndicatorConfig[];
  bbData: Record<string, BollingerBandsDataPoint[]>;
  stochRsiData: Record<string, StochasticRsiDataPoint[]>;
  isCandlestickVisible: boolean;
  areIndicatorsVisible: boolean;
  areDrawingsVisible: boolean;
}

const fibLevels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
const fibLevelColors = [
    'rgba(128, 128, 128, 0.2)', // 0%
    'rgba(239, 68, 68, 0.2)',    // 23.6%
    'rgba(245, 158, 11, 0.2)',   // 38.2%
    'rgba(234, 179, 8, 0.2)',    // 50%
    'rgba(5, 150, 105, 0.2)',    // 61.8%
    'rgba(59, 130, 246, 0.2)',   // 78.6%
    'rgba(128, 128, 128, 0.2)', // 100%
];
const colors = ['#2dd4bf', '#38bdf8', '#a78bfa', '#f472b6', '#facc15', '#f87171', '#ffffff'];
const lineStyles = [ { id: LineStyle.Solid }, { id: LineStyle.Dashed }, { id: LineStyle.Dotted } ];
const lineWidths = [1, 2, 4];

const DrawingToolbar: React.FC<{
  drawing: Drawing;
  onUpdate: (id: string, props: Partial<TrendLine>) => void;
  onDelete: (id: string) => void;
}> = ({ drawing, onUpdate, onDelete }) => {
  const isTrendLine = drawing.id.startsWith('trend-');

  return (
    <div
      style={{ position: 'absolute', top: '50%', left: '80px', zIndex: 20, transform: 'translateY(-50%)' }}
      className="bg-gray-950 p-2 rounded-lg border border-gray-700 shadow-xl flex items-center gap-1"
      onClick={e => e.stopPropagation()}
    >
      {colors.map(color => (
        <button
          key={color}
          onClick={() => onUpdate(drawing.id, { color })}
          className={`w-6 h-6 rounded-sm border-2 ${drawing.color === color ? 'border-white' : 'border-transparent'} hover:border-white/70`}
          style={{ backgroundColor: color }}
          aria-label={`Set color to ${color}`}
        />
      ))}
      <div className="w-px h-6 bg-gray-700 mx-1"></div>
      <select
        value={drawing.lineWidth}
        onChange={e => onUpdate(drawing.id, { lineWidth: parseInt(e.target.value, 10) })}
        className="bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm text-white focus:ring-2 focus:ring-green-500 focus:outline-none appearance-none"
      >
        {lineWidths.map(w => <option key={w} value={w}>{w}px</option>)}
      </select>
      <div className="w-px h-6 bg-gray-700 mx-1"></div>
      {lineStyles.map(style => (
        <button
          key={style.id}
          onClick={() => onUpdate(drawing.id, { lineStyle: style.id })}
          className={`p-2 rounded-md ${drawing.lineStyle === style.id ? 'bg-green-600/50' : 'hover:bg-gray-700'}`}
          title={`Line style: ${style.id}`}
        >
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" >
            {style.id === LineStyle.Solid && <path d="M3 12h18" />}
            {style.id === LineStyle.Dashed && <path d="M3 12h3m5 0h3m5 0h3" />}
            {style.id === LineStyle.Dotted && <path d="M4 12h.01M8 12h.01M12 12h.01M16 12h.01M20 12h.01" />}
          </svg>
        </button>
      ))}
      {isTrendLine && (
        <>
            <div className="w-px h-6 bg-gray-700 mx-1"></div>
            <button
            onClick={() => onUpdate(drawing.id, { extendLeft: !(drawing as TrendLine).extendLeft })}
            className={`p-2 rounded-md ${(drawing as TrendLine).extendLeft ? 'bg-green-600/50' : 'hover:bg-gray-700'}`}
            title="Extend Left"
            >
            <ExtendLeftIcon className="w-5 h-5 text-white" />
            </button>
            <button
            onClick={() => onUpdate(drawing.id, { extendRight: !(drawing as TrendLine).extendRight })}
            className={`p-2 rounded-md ${(drawing as TrendLine).extendRight ? 'bg-green-600/50' : 'hover:bg-gray-700'}`}
            title="Extend Right"
            >
            <ExtendRightIcon className="w-5 h-5 text-white" />
            </button>
        </>
      )}
      <div className="w-px h-6 bg-gray-700 mx-1"></div>
      <button onClick={() => onDelete(drawing.id)} className="p-2 rounded-md hover:bg-red-900/50 text-red-400 hover:text-red-300" title="Delete drawing">
        <TrashIcon />
      </button>
    </div>
  );
};

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const TradingViewChart: React.FC<TradingViewChartProps> = ({ data, activeTool, drawings, onDrawingsChange, indicators, bbData, stochRsiData, isCandlestickVisible, areIndicatorsVisible, areDrawingsVisible }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const indicatorSeriesRef = useRef<Record<string, AnySeriesApi[]>>({});
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const customHorzPriceLineRef = useRef<IPriceLine | null>(null);

  const isDrawingRef = useRef<boolean>(false);
  const tempLineStartRef = useRef<PointInTime | null>(null);
  const tempRulerStartRef = useRef<PointInTime | null>(null);
  const tempFibStartRef = useRef<PointInTime | null>(null);
  
  const [selectedDrawing, setSelectedDrawing] = useState<Drawing | null>(null);
  const [ephemeralRuler, setEphemeralRuler] = useState<Ruler | null>(null);

  const isDraggingRef = useRef<{ type: 'line' | 'start_handle' | 'end_handle'; drawingId: string } | null>(null);
  const lastMousePositionRef = useRef<MouseEventParams | null>(null);
  const dragStartInfoRef = useRef<{
    mousePrice: number;
    mouseLogical: Logical;
    drawing: Drawing;
    drawingStartLogical: Logical;
    drawingEndLogical: Logical;
  } | null>(null);
  
  const drawAllRef = useRef<(mousePos?: Point) => void>(() => {});

  const [stochPaneHeight, setStochPaneHeight] = useState(150);
  const [isResizingPane, setIsResizingPane] = useState(false);
  const [chartHeight, setChartHeight] = useState(0);
  const lastMouseYRef = useRef(0);
  const resizableIndicator = useMemo(() => indicators.find(ind => ind.type === 'stochasticRSI'), [indicators]);

  const getCoordinates = useCallback((time: Time, price: number): Point | null => {
      const chart = chartRef.current;
      const mainSeries = seriesRef.current;
      if (!chart || !mainSeries) {
        return null;
      }
      const timeCoord = chart.timeScale().timeToCoordinate(time);
      const priceCoord = mainSeries.priceToCoordinate(price);

      if (timeCoord === null || priceCoord === null) {
        return null;
      }
      return { x: timeCoord, y: priceCoord };
  }, []);

  const getLineDash = (style: LineStyle): number[] => {
      if (style === LineStyle.Dashed) return [8, 8];
      if (style === LineStyle.Dotted) return [2, 4];
      return [];
  };

  useEffect(() => {
    if (seriesRef.current) {
        seriesRef.current.applyOptions({ visible: isCandlestickVisible });
    }
  }, [isCandlestickVisible]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !data.length) return;
  
    Object.keys(indicatorSeriesRef.current).forEach(id => {
      if (!indicators.some(ind => ind.id === id)) {
        indicatorSeriesRef.current[id].forEach(series => chart.removeSeries(series));
        delete indicatorSeriesRef.current[id];
      }
    });
  
    indicators.forEach(ind => {
      let seriesGroup = indicatorSeriesRef.current[ind.id] || [];
      
      if (seriesGroup.length === 0) {
        if (ind.type === 'bollingerBands') {
          const bbOptions: LineSeriesPartialOptions = { priceLineVisible: false, lastValueVisible: false, lineWidth: 1, color: '#38bdf8' };
          const upper = chart.addLineSeries({ ...bbOptions, lineStyle: LightweightLineStyle.Dotted });
          const middle = chart.addLineSeries({ ...bbOptions, color: '#facc15', lineStyle: LightweightLineStyle.Dashed });
          const lower = chart.addLineSeries({ ...bbOptions, lineStyle: LightweightLineStyle.Dotted });
          seriesGroup = [upper, middle, lower];
        } else if (ind.type === 'stochasticRSI') {
            const paneId = `stoch-pane-${ind.id}`;
            chart.priceScale(paneId).applyOptions({ autoScale: true });
          const kSeries = chart.addLineSeries({ priceScaleId: paneId, color: '#38bdf8', lineWidth: 1, lastValueVisible: true, priceLineVisible: false });
          const dSeries = chart.addLineSeries({ priceScaleId: paneId, color: '#f472b6', lineWidth: 1, lastValueVisible: true, priceLineVisible: false });
          const overboughtLine: PriceLineOptions = { price: 80, color: '#f87171', lineWidth: 1, lineStyle: LightweightLineStyle.Dashed, axisLabelVisible: true, title: '80' };
          const oversoldLine: PriceLineOptions = { price: 20, color: '#4ade80', lineWidth: 1, lineStyle: LightweightLineStyle.Dashed, axisLabelVisible: true, title: '20' };
          kSeries.createPriceLine(overboughtLine);
          kSeries.createPriceLine(oversoldLine);
          seriesGroup = [kSeries, dSeries];
        }
        indicatorSeriesRef.current[ind.id] = seriesGroup;
      }
  
      const targetVisibility = areIndicatorsVisible && (ind.isVisible ?? true);
      seriesGroup.forEach(s => s.applyOptions({ visible: targetVisibility }));
      if (ind.type === 'stochasticRSI') {
        const paneId = `stoch-pane-${ind.id}`;
        chart.priceScale(paneId).applyOptions({ visible: targetVisibility });
      }
  
      if (ind.type === 'bollingerBands' && bbData[ind.id]) {
        seriesGroup[0].setData(bbData[ind.id].map(d => ({ time: d.time, value: d.upper } as LineData)));
        seriesGroup[1].setData(bbData[ind.id].map(d => ({ time: d.time, value: d.middle } as LineData)));
        seriesGroup[2].setData(bbData[ind.id].map(d => ({ time: d.time, value: d.lower } as LineData)));
      } else if (ind.type === 'stochasticRSI' && stochRsiData[ind.id]) {
        seriesGroup[0].setData(stochRsiData[ind.id].map(d => ({ time: d.time, value: d.k } as LineData)));
        seriesGroup[1].setData(stochRsiData[ind.id].map(d => ({ time: d.time, value: d.d } as LineData)));
      }
    });
  
  }, [indicators, bbData, stochRsiData, data.length, areIndicatorsVisible]);

  useEffect(() => {
    const chart = chartRef.current;
    const mainSeries = seriesRef.current;

    if (!chart || !mainSeries || !resizableIndicator || chartHeight <= 0) {
        if (mainSeries) {
            mainSeries.priceScale().applyOptions({ scaleMargins: { top: 0.05, bottom: 0.08 } });
        }
        return;
    };

    const indicatorRatio = stochPaneHeight / chartHeight;
    const mainPaneRatio = 1 - indicatorRatio;

    mainSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.05, bottom: indicatorRatio + (0.02) },
    });

    const paneId = `stoch-pane-${resizableIndicator.id}`;
    chart.priceScale(paneId).applyOptions({
        scaleMargins: { top: mainPaneRatio, bottom: 0.05 }
    });

  }, [stochPaneHeight, chartHeight, resizableIndicator]);


  useEffect(() => {
    drawAllRef.current = (mousePos?: Point) => {
      const ctx = overlayCtxRef.current;
      const canvas = overlayCanvasRef.current;
      const chart = chartRef.current;
      const series = seriesRef.current;
      if (!ctx || !canvas || !chart || !series || !data || data.length === 0) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (!areDrawingsVisible) {
        return;
      }

      const drawTrendLine = (line: TrendLine) => {
        const p1 = getCoordinates(line.start.time, line.start.price);
        const p2 = getCoordinates(line.end.time, line.end.price);
        if (!p1 || !p2) return;
      
        let p1Draw = { ...p1 };
        let p2Draw = { ...p2 };
      
        // Draw the potentially extended line
        if (line.extendLeft || line.extendRight) {
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
      
          if (Math.abs(dx) > 1e-6) { // Avoid division by zero for vertical lines
            const slope = dy / dx;
            if (line.extendLeft) {
              p1Draw.y = p1.y - slope * p1.x;
              p1Draw.x = 0;
            }
            if (line.extendRight) {
              p2Draw.y = p2.y + slope * (canvas.width - p2.x);
              p2Draw.x = canvas.width;
            }
          } else if (line.extendLeft || line.extendRight) { // Handle vertical line extension
            p1Draw.y = 0;
            p2Draw.y = canvas.height;
          }
          ctx.strokeStyle = line.color;
          ctx.lineWidth = line.lineWidth;
          ctx.setLineDash(getLineDash(line.lineStyle));
          ctx.beginPath();
          ctx.moveTo(p1Draw.x, p1Draw.y);
          ctx.lineTo(p2Draw.x, p2Draw.y);
          ctx.stroke();
        }
      
        // Always draw the original segment on top
        ctx.strokeStyle = line.color;
        ctx.lineWidth = line.lineWidth;
        ctx.setLineDash(getLineDash(line.lineStyle));
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      
        if (selectedDrawing?.id === line.id) {
          // Draw selection highlight on original segment
          ctx.lineWidth = line.lineWidth + 2;
          ctx.stroke();
      
          // Draw handles
          ctx.fillStyle = '#ffffff';
          ctx.beginPath(); ctx.arc(p1.x, p1.y, 5, 0, 2 * Math.PI); ctx.fill();
          ctx.beginPath(); ctx.arc(p2.x, p2.y, 5, 0, 2 * Math.PI); ctx.fill();
        }
      };

      drawings.trendLines.forEach(drawTrendLine);
      
      const drawRuler = (ruler: Ruler) => {
          const startPoint = getCoordinates(ruler.start.time, ruler.start.price);
          const endPoint = getCoordinates(ruler.end.time, ruler.end.price);
          if(!startPoint || !endPoint) return;
          
          const timeScale = chart.timeScale();
          const logicalStart = timeScale.coordinateToLogical(startPoint.x);
          const logicalEnd = timeScale.coordinateToLogical(endPoint.x);
          if (logicalStart === null || logicalEnd === null) return;
          
          const priceChange = ruler.end.price - ruler.start.price;
          const pricePercent = ruler.start.price !== 0 ? (priceChange / ruler.start.price) * 100 : 0;
          
          const startIndex = Math.max(0, Math.floor(Math.min(logicalStart, logicalEnd)));
          const endIndex = Math.min(data.length - 1, Math.ceil(Math.max(logicalStart, logicalEnd)));
          const barDiff = Math.abs(endIndex - startIndex);

          const startTimeStr = data[startIndex]?.time;
          const endTimeStr = data[endIndex]?.time;
          let timeDiffInDays = 0;
          if (startTimeStr && endTimeStr) {
              const timeDiffMs = Math.abs(new Date(endTimeStr).getTime() - new Date(startTimeStr).getTime());
              timeDiffInDays = Math.ceil(timeDiffMs / (1000 * 60 * 60 * 24));
          }

          let totalVolume = 0;
          for (let i = startIndex; i <= endIndex; i++) {
              totalVolume += data[i]?.volume || 0;
          }

          const formatVolume = (vol: number) => {
              if (vol >= 1e6) return `${(vol / 1e6).toFixed(2)}M`;
              if (vol >= 1e3) return `${(vol / 1e3).toFixed(2)}K`;
              return vol.toString();
          };

          const color = priceChange >= 0 ? 'rgba(34, 197, 94, 1)' : 'rgba(239, 68, 68, 1)';
          const bgColor = priceChange >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)';
          
          ctx.fillStyle = bgColor;
          ctx.fillRect(startPoint.x, startPoint.y, endPoint.x - startPoint.x, endPoint.y - startPoint.y);

          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 4]);
          ctx.beginPath();
          ctx.moveTo(startPoint.x, startPoint.y);
          ctx.lineTo(endPoint.x, startPoint.y);
          ctx.lineTo(endPoint.x, endPoint.y);
          ctx.stroke();

          const textLines = [
            `${formatCurrency(priceChange)} (${pricePercent.toFixed(2)}%)`,
            `${barDiff} bars, ${timeDiffInDays}d`,
            `Vol ${formatVolume(totalVolume)}`
          ];

          const boxWidth = 160;
          const boxHeight = 10 + textLines.length * 18;
          let boxX = endPoint.x + 15;
          if (boxX + boxWidth > canvas.width) boxX = endPoint.x - boxWidth - 15;
          let boxY = endPoint.y - (boxHeight / 2);
          if (boxY < 10) boxY = 10;
          if (boxY + boxHeight > canvas.height - 10) boxY = canvas.height - 10 - boxHeight;

          ctx.fillStyle = 'rgba(3, 7, 18, 0.8)';
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.rect(boxX, boxY, boxWidth, boxHeight);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = color;
          ctx.font = '12px sans-serif';
          textLines.forEach((line, index) => {
              ctx.fillText(line, boxX + 10, boxY + 20 + (index * 18));
          });
      }
      
      if (ephemeralRuler) {
          drawRuler(ephemeralRuler);
      }

      const drawFib = (fib: FibRetracement) => {
          const startY = series.priceToCoordinate(fib.start.price);
          const endPoint = getCoordinates(fib.end.time, fib.end.price);
          if (startY === null || endPoint === null) return;

          const endY = endPoint.y;
          const endPrice = series.coordinateToPrice(endY);
          if (endPrice === null) return;

          const priceDiff = endPrice - fib.start.price;
          const chartWidth = chart.timeScale().width();
          
          for (let i = 0; i < fibLevels.length - 1; i++) {
              const level1 = fibLevels[i];
              const level2 = fibLevels[i + 1];
              
              const levelPrice1 = fib.start.price + (priceDiff * level1);
              const levelPrice2 = fib.start.price + (priceDiff * level2);
              
              const y1 = series.priceToCoordinate(levelPrice1);
              const y2 = series.priceToCoordinate(levelPrice2);
              
              if (y1 !== null && y2 !== null) {
                  ctx.fillStyle = fibLevelColors[i + 1];
                  ctx.fillRect(0, Math.min(y1, y2), chartWidth, Math.abs(y1 - y2));
              }
          }
          
          ctx.lineWidth = fib.lineWidth;
          ctx.setLineDash(getLineDash(fib.lineStyle));

          fibLevels.forEach((level) => {
              const levelPrice = fib.start.price + (priceDiff * level);
              const y = series.priceToCoordinate(levelPrice);
              if (y === null) return;
              
              ctx.strokeStyle = fib.color;
              ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(chartWidth, y); ctx.stroke();
              
              ctx.fillStyle = 'rgba(3, 7, 18, 0.8)'; ctx.fillRect(5, y - 14, 150, 18);
              ctx.fillStyle = fib.color; ctx.font = '12px sans-serif';
              ctx.fillText(`${(level * 100).toFixed(1)}% (${formatCurrency(levelPrice)})`, 10, y - 2);
          });

           if (selectedDrawing?.id === fib.id) {
              const startPoint = getCoordinates(fib.start.time, fib.start.price);
              if (!startPoint) return;
              ctx.fillStyle = '#ffffff';
              ctx.beginPath(); ctx.arc(startPoint.x, startY, 5, 0, 2 * Math.PI); ctx.fill();
              ctx.beginPath(); ctx.arc(endPoint.x, endPoint.y, 5, 0, 2 * Math.PI); ctx.fill();
           }
      }
      drawings.fibs.forEach(drawFib);

      if (tempLineStartRef.current && mousePos) {
          const start = getCoordinates(tempLineStartRef.current.time, tempLineStartRef.current.price);
          if (start) {
              ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
              ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.lineTo(mousePos.x, mousePos.y); ctx.stroke();
          }
      }
      if (tempRulerStartRef.current && mousePos) {
          const endPrice = series.coordinateToPrice(mousePos.y);
          const endTime = chart.timeScale().coordinateToTime(mousePos.x);
          if (endPrice !== null && endTime !== null) {
            const tempRulerObject: Ruler = {
              id: 'temp-ruler',
              start: tempRulerStartRef.current,
              end: { time: endTime, price: endPrice },
              color: '', lineWidth: 0, lineStyle: LineStyle.Solid
            };
            drawRuler(tempRulerObject);
          }
      }
       if (tempFibStartRef.current && mousePos) {
          const endPrice = series.coordinateToPrice(mousePos.y);
          const endTime = chart.timeScale().coordinateToTime(mousePos.x);
          if (endPrice !== null && endTime !== null) {
            const tempFibObject: FibRetracement = {
                id: 'temp-fib',
                start: tempFibStartRef.current,
                end: {time: endTime, price: endPrice},
                color: '#38bdf8', lineWidth: 1, lineStyle: LineStyle.Solid
            };
            drawFib(tempFibObject);
          }
      }
    };
    drawAllRef.current();
  }, [getCoordinates, drawings, selectedDrawing, data, areDrawingsVisible, ephemeralRuler]);
  
  useEffect(() => {
    if (seriesRef.current && data) {
      seriesRef.current.setData(data as LightweightCandlestickData[]);
      chartRef.current?.timeScale().fitContent();
      drawAllRef.current();
    }
  }, [data]);
  
  const findDrawingAtPoint = useCallback((point: Point): Drawing | null => {
      const allDrawings = [...drawings.trendLines, ...drawings.fibs];
      const HIT_THRESHOLD = 10;
      for (const drawing of allDrawings) {
          const p1 = getCoordinates(drawing.start.time, drawing.start.price);
          const p2 = getCoordinates(drawing.end.time, drawing.end.price);
          if (!p1 || !p2) continue;
          
          const dx = p2.x - p1.x, dy = p2.y - p1.y, lenSq = dx * dx + dy * dy;
          if (lenSq === 0) continue;
          const t = ((point.x - p1.x) * dx + (point.y - p1.y) * dy) / lenSq;
          
          let closestX, closestY;
          if (t < 0) { closestX = p1.x; closestY = p1.y; }
          else if (t > 1) { closestX = p2.x; closestY = p2.y; }
          else { closestX = p1.x + t * dx; closestY = p1.y + t * dy; }
          
          const dist = Math.sqrt(Math.pow(point.x - closestX, 2) + Math.pow(point.y - closestY, 2));
          if (dist <= HIT_THRESHOLD) return drawing;
      }
      return null;
  }, [drawings, getCoordinates]);

  const findHandleAtPoint = useCallback((point: Point, drawing: Drawing): { handleType: 'start' | 'end' } | null => {
      const HANDLE_RADIUS = 8;
      const startHandlePos = getCoordinates(drawing.start.time, drawing.start.price);
      if (startHandlePos) {
          const dist = Math.sqrt(Math.pow(point.x - startHandlePos.x, 2) + Math.pow(point.y - startHandlePos.y, 2));
          if (dist <= HANDLE_RADIUS) return { handleType: 'start' };
      }
      const endHandlePos = getCoordinates(drawing.end.time, drawing.end.price);
      if (endHandlePos) {
          const dist = Math.sqrt(Math.pow(point.x - endHandlePos.x, 2) + Math.pow(point.y - endHandlePos.y, 2));
          if (dist <= HANDLE_RADIUS) return { handleType: 'end' };
      }
      return null;
  }, [getCoordinates]);
  
  const findDrawingType = useCallback((id: string): keyof ChartDrawings | null => {
      if (drawings.trendLines.some(d => d.id === id)) return 'trendLines';
      if (drawings.fibs.some(d => d.id === id)) return 'fibs';
      return null;
  }, [drawings]);

  const handleUpdateDrawing = useCallback((id: string, props: Partial<TrendLine>) => {
      const type = findDrawingType(id);
      if (!type) return;
      const updatedDrawings = { ...drawings, [type]: drawings[type].map(d => d.id === id ? { ...d, ...props } : d) as any };
      onDrawingsChange(updatedDrawings);
      if (selectedDrawing && selectedDrawing.id === id) {
        const newSelected = { ...selectedDrawing, ...props };
        setSelectedDrawing(newSelected);
      }
  }, [drawings, findDrawingType, onDrawingsChange, selectedDrawing]);

  const handleDeleteDrawing = useCallback((id: string) => {
      const type = findDrawingType(id);
      if (!type) return;
      const updatedDrawings = { ...drawings, [type]: drawings[type].filter(d => d.id !== id) as any };
      onDrawingsChange(updatedDrawings);
      setSelectedDrawing(null);
  }, [drawings, findDrawingType, onDrawingsChange]);

  const handleMouseMove = useCallback((param: MouseEventParams) => {
    lastMousePositionRef.current = param;
    const chart = chartRef.current;
    const series = seriesRef.current;
    const container = chartContainerRef.current;
    const customHorzLine = customHorzPriceLineRef.current;

    if (!param.point || !param.time || !series || !customHorzLine || !container) {
        customHorzLine?.applyOptions({ lineVisible: false, axisLabelVisible: false });
        if(isDrawingRef.current) {
            drawAllRef.current();
        }
        return;
    }
    
    const isInteracting = isDrawingRef.current || isDraggingRef.current;

    if (isInteracting) {
        customHorzLine.applyOptions({ lineVisible: false, axisLabelVisible: false });
    } else {
        const price = series.coordinateToPrice(param.point.y);
        if (price !== null) {
            customHorzLine.applyOptions({
                price: price,
                title: formatCurrency(price),
                lineVisible: true,
                axisLabelVisible: true,
            });
        } else {
            customHorzLine.applyOptions({ lineVisible: false, axisLabelVisible: false });
        }
    }

    if (isDraggingRef.current && dragStartInfoRef.current && param.logical && param.time && chart) {
        const currentPrice = series.coordinateToPrice(param.point.y);
        if (currentPrice === undefined || currentPrice === null) return;
        
        const { type, drawingId } = isDraggingRef.current;
        const originalDrawing = dragStartInfoRef.current.drawing;
        let newDrawing = { ...originalDrawing };
        const drawingType = findDrawingType(drawingId);
        if (!drawingType) return;

        if (type === 'line') {
            const priceDelta = currentPrice - dragStartInfoRef.current.mousePrice;
            const logicalDelta = (param.logical - dragStartInfoRef.current.mouseLogical) as Logical;
            
            const newStartLogical = (dragStartInfoRef.current.drawingStartLogical + logicalDelta) as Logical;
            const newEndLogical = (dragStartInfoRef.current.drawingEndLogical + logicalDelta) as Logical;

            const newStartCoord = chart.timeScale().logicalToCoordinate(newStartLogical);
            const newStartTime = newStartCoord !== null ? chart.timeScale().coordinateToTime(newStartCoord) : null;
            
            const newEndCoord = chart.timeScale().logicalToCoordinate(newEndLogical);
            const newEndTime = newEndCoord !== null ? chart.timeScale().coordinateToTime(newEndCoord) : null;

            if (newStartTime !== null && newEndTime !== null) {
                newDrawing.start = { time: newStartTime, price: originalDrawing.start.price + priceDelta };
                newDrawing.end = { time: newEndTime, price: originalDrawing.end.price + priceDelta };
            }
        } else {
            if (type === 'start_handle') {
                newDrawing.start = { time: param.time, price: currentPrice };
            } else if (type === 'end_handle') {
                newDrawing.end = { time: param.time, price: currentPrice };
            }
        }
        
        const updatedDrawings = { ...drawings, [drawingType]: drawings[drawingType].map(d => d.id === drawingId ? newDrawing : d) as any };
        onDrawingsChange(updatedDrawings);
        if (selectedDrawing?.id === drawingId) {
          setSelectedDrawing(newDrawing);
        }
        return;
    }

    if (activeTool === 'pan' && areDrawingsVisible) {
        let cursor = 'default';
        if (selectedDrawing) {
            const handle = findHandleAtPoint(param.point, selectedDrawing);
            if (handle) {
                cursor = 'pointer';
            } else if (findDrawingAtPoint(param.point)) {
                cursor = 'move';
            }
        } else if (findDrawingAtPoint(param.point)) {
            cursor = 'move';
        }
        container.style.cursor = cursor;
    } else if (['trendline', 'ruler', 'fib'].includes(activeTool) && areDrawingsVisible) {
        container.style.cursor = 'crosshair';
    } else {
        container.style.cursor = 'default';
    }
    
    if (isDrawingRef.current) {
        drawAllRef.current(param.point);
    }
  }, [activeTool, areDrawingsVisible, findDrawingAtPoint, findHandleAtPoint, onDrawingsChange, drawings, selectedDrawing, data, findDrawingType]);

  const handleMouseDown = useCallback((param: MouseEventParams) => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    
    // Any click clears the ephemeral ruler
    setEphemeralRuler(null);

    if (!param.point || !param.time || !series) {
        if (selectedDrawing) setSelectedDrawing(null);
        return;
    }

    const price = series.coordinateToPrice(param.point.y);
    if (price === null) {
        const clickedDrawing = findDrawingAtPoint(param.point);
        if (!clickedDrawing) {
            setSelectedDrawing(null);
        }
        return;
    }

    if (!areDrawingsVisible) return;

    if (activeTool === 'pan') {
        let hitDrawing: Drawing | null = null;
        let hitType: 'line' | 'start_handle' | 'end_handle' | null = null;
        
        if (selectedDrawing) {
            const handleHit = findHandleAtPoint(param.point, selectedDrawing);
            if (handleHit) {
                hitDrawing = selectedDrawing;
                hitType = handleHit.handleType === 'start' ? 'start_handle' : 'end_handle';
            }
        }

        if (!hitDrawing) {
            const bodyHit = findDrawingAtPoint(param.point);
            if (bodyHit) {
                hitDrawing = bodyHit;
                hitType = 'line';
            }
        }

        if (hitDrawing && hitType) {
            if (selectedDrawing?.id !== hitDrawing.id) {
                setSelectedDrawing(hitDrawing);
            }
            isDraggingRef.current = { type: hitType, drawingId: hitDrawing.id };

            const startCoordinate = chart.timeScale().timeToCoordinate(hitDrawing.start.time);
            const endCoordinate = chart.timeScale().timeToCoordinate(hitDrawing.end.time);
            const startLogical = startCoordinate !== null ? chart.timeScale().coordinateToLogical(startCoordinate) : null;
            const endLogical = endCoordinate !== null ? chart.timeScale().coordinateToLogical(endCoordinate) : null;

            if (startLogical !== null && endLogical !== null && param.logical) {
                dragStartInfoRef.current = { mousePrice: price, mouseLogical: param.logical, drawing: hitDrawing, drawingStartLogical: startLogical, drawingEndLogical: endLogical };
                chart.applyOptions({ handleScroll: false, handleScale: false });
            }
            if (param.sourceEvent && typeof param.sourceEvent.preventDefault === 'function') {
                param.sourceEvent.preventDefault();
            }
        } else {
            setSelectedDrawing(null);
        }
    } else {
        if (param.sourceEvent && typeof param.sourceEvent.preventDefault === 'function') {
            param.sourceEvent.preventDefault();
        }
        setSelectedDrawing(null);
        chart.applyOptions({ handleScroll: false, handleScale: false });
        isDrawingRef.current = true;
        const startPoint = { time: param.time, price };

        switch (activeTool) {
            case 'trendline': tempLineStartRef.current = startPoint; break;
            case 'ruler': tempRulerStartRef.current = startPoint; break;
            case 'fib': tempFibStartRef.current = startPoint; break;
        }
    }
  }, [activeTool, areDrawingsVisible, findDrawingAtPoint, findHandleAtPoint, selectedDrawing, chartRef, seriesRef]);

  const handleMouseUp = useCallback((param?: MouseEventParams) => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    
    if (isDraggingRef.current) {
        isDraggingRef.current = null;
        dragStartInfoRef.current = null;
        chart?.applyOptions({ handleScroll: true, handleScale: true });
    }

    const lastMousePos = param || lastMousePositionRef.current;
    
    if (isDrawingRef.current && lastMousePos && series) {
        const { time, point } = lastMousePos;
        
        if (!point) {
            isDrawingRef.current = false;
            tempLineStartRef.current = null;
            tempRulerStartRef.current = null;
            tempFibStartRef.current = null;
            chart?.applyOptions({ handleScroll: true, handleScale: true });
            drawAllRef.current();
            return;
        }
        
        const price = series.coordinateToPrice(point.y);

        if (price !== null && time) {
            const endPoint = { time, price };
            if (tempLineStartRef.current) {
                const newDrawing: TrendLine = { id: `trend-${Date.now()}`, start: tempLineStartRef.current, end: endPoint, color: '#ffffff', lineWidth: 2, lineStyle: LineStyle.Solid };
                onDrawingsChange({ ...drawings, trendLines: [...drawings.trendLines, newDrawing] });
            }
            if (tempRulerStartRef.current) {
                const newDrawing: Ruler = { id: `ruler-${Date.now()}`, start: tempRulerStartRef.current, end: endPoint, color: '', lineWidth: 0, lineStyle: LineStyle.Solid };
                setEphemeralRuler(newDrawing);
            }
            if (tempFibStartRef.current) {
                const newDrawing: FibRetracement = { id: `fib-${Date.now()}`, start: tempFibStartRef.current, end: endPoint, color: '#38bdf8', lineWidth: 1, lineStyle: LineStyle.Solid };
                onDrawingsChange({ ...drawings, fibs: [...drawings.fibs, newDrawing] });
            }
        }
        
        isDrawingRef.current = false;
        tempLineStartRef.current = null;
        tempRulerStartRef.current = null;
        tempFibStartRef.current = null;
        chart?.applyOptions({ handleScroll: true, handleScale: true });
        drawAllRef.current();
    }
  }, [drawings, onDrawingsChange]);

  const redrawOnPanZoom = useCallback(() => {
    drawAllRef.current();
  }, []);

  const handleMouseDownOnResizer = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizingPane(true);
      lastMouseYRef.current = e.clientY;
      document.body.style.cursor = 'ns-resize';
  }, []);

  useEffect(() => {
    const handleMouseMoveOnResize = (e: MouseEvent) => {
      if (!isResizingPane) return;
      const deltaY = e.clientY - lastMouseYRef.current;
      lastMouseYRef.current = e.clientY;
      setStochPaneHeight(prev => {
          const newHeight = prev - deltaY;
          return Math.max(50, Math.min(newHeight, chartHeight - 100));
      });
    };
    const handleMouseUpOnResize = () => {
        setIsResizingPane(false);
        document.body.style.cursor = 'default';
    };

    if (isResizingPane) {
      window.addEventListener('mousemove', handleMouseMoveOnResize);
      window.addEventListener('mouseup', handleMouseUpOnResize);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMoveOnResize);
      window.removeEventListener('mouseup', handleMouseUpOnResize);
    };
  }, [isResizingPane, chartHeight]);

  useEffect(() => {
    const chartContainer = chartContainerRef.current;
    if (!chartContainer) return;

    const chart = createChart(chartContainer, {
        layout: { background: { type: ColorType.Solid, color: '#030712' }, textColor: '#9CA3AF' },
        grid: { vertLines: { color: '#1F2937' }, horzLines: { color: '#1F2937' } },
        timeScale: { borderColor: '#374151', timeVisible: true },
        rightPriceScale: { borderColor: '#374151' },
        crosshair: {
            horzLine: {
                visible: false,
                labelVisible: false,
            },
        },
    });
    chartRef.current = chart;
    
    const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#4ade80', downColor: '#f87171', borderDownColor: '#f87171',
        borderUpColor: '#4ade80', wickDownColor: '#f87171', wickUpColor: '#4ade80',
    });
    seriesRef.current = candlestickSeries;

    customHorzPriceLineRef.current = candlestickSeries.createPriceLine({
        price: 0,
        color: '#9CA3AF',
        lineWidth: 1,
        lineStyle: LightweightLineStyle.Dashed,
        axisLabelVisible: false,
        lineVisible: false,
        title: '',
    });

    const overlayCanvas = document.createElement('canvas');
    overlayCanvas.style.position = 'absolute';
    overlayCanvas.style.top = '0';
    overlayCanvas.style.left = '0';
    overlayCanvas.style.pointerEvents = 'none';
    chartContainer.appendChild(overlayCanvas);
    overlayCanvasRef.current = overlayCanvas;
    overlayCtxRef.current = overlayCanvas.getContext('2d');

    const handleResize = () => {
      if (chartContainer && chartRef.current && overlayCanvasRef.current) {
        const height = chartContainer.clientHeight;
        chartRef.current.resize(chartContainer.clientWidth, height);
        overlayCanvasRef.current.width = chartContainer.clientWidth;
        overlayCanvasRef.current.height = height;
        setChartHeight(height);
        drawAllRef.current();
      }
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainer);
    handleResize();

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    
    chart.subscribeCrosshairMove(handleMouseMove);
    chart.subscribeClick(handleMouseDown);
    
    const handleMouseUpGlobal = (event: MouseEvent) => {
        // Find the series that was clicked
        const series = seriesRef.current;
        if (!series || !chart || !chartContainerRef.current) {
            handleMouseUp();
            return;
        }

        const rect = chartContainerRef.current.getBoundingClientRect();

        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const logical = chart.timeScale().coordinateToLogical(x);
        if (logical === null) {
            handleMouseUp();
            return;
        }

        const time = chart.timeScale().coordinateToTime(x);
        const price = series.coordinateToPrice(y);

        if (price === null || time === null) {
            handleMouseUp();
            return;
        }

        const param: MouseEventParams = {
            time: time,
            point: { x, y },
            logical: logical,
            sourceEvent: event as unknown as TouchEvent | MouseEvent,
            seriesPrices: new Map(),
        };
        handleMouseUp(param);
    };

    window.addEventListener('mouseup', handleMouseUpGlobal);
    
    return () => {
        chart.unsubscribeCrosshairMove(handleMouseMove);
        chart.unsubscribeClick(handleMouseDown);
        window.removeEventListener('mouseup', handleMouseUpGlobal);
    };
  }, [handleMouseMove, handleMouseDown, handleMouseUp]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    
    chart.timeScale().subscribeVisibleLogicalRangeChange(redrawOnPanZoom);
    return () => chart.timeScale().unsubscribeVisibleLogicalRangeChange(redrawOnPanZoom);
  }, [redrawOnPanZoom]);

  return (
    <div className="absolute inset-0">
        <div ref={chartContainerRef} className="absolute inset-0" />
        {resizableIndicator && chartHeight > 0 && (
            <div
                onMouseDown={handleMouseDownOnResizer}
                className="absolute left-0 w-full h-2.5 -translate-y-1/2 cursor-ns-resize z-20 group"
                style={{ top: chartHeight - stochPaneHeight }}
            >
                <div className="w-full h-0.5 bg-gray-600 group-hover:bg-green-400 transition-colors"></div>
            </div>
        )}
        {selectedDrawing && areDrawingsVisible && (
            <DrawingToolbar
              drawing={selectedDrawing}
              onUpdate={handleUpdateDrawing}
              onDelete={handleDeleteDrawing}
            />
        )}
    </div>
  );
};

export default TradingViewChart;