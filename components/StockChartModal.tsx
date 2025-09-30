

import React from 'react';
import { ApiProvider, ApiKeys, CandlestickData, ChartDrawings, IndicatorConfig, BollingerBandsSettings, StochasticRsiSettings, BollingerBandsDataPoint, StochasticRsiDataPoint } from '../types';
import { fetchStockBars } from '../services/alpacaService';
import { calculateBollingerBands, calculateStochasticRSI } from '../services/indicatorCalculator';
import TradingViewChart from './TradingViewChart';
import XIcon from './icons/XIcon';
import AlertTriangleIcon from './icons/AlertTriangleIcon';
import MousePointerIcon from './icons/MousePointerIcon';
import PencilIcon from './icons/PencilIcon';
import RulerIcon from './icons/RulerIcon';
import FibIcon from './icons/FibIcon';
import TrashIcon from './icons/TrashIcon';
import FullscreenIcon from './icons/FullscreenIcon';
import MinimizeIcon from './icons/MinimizeIcon';
import TrendingUpIcon from './icons/TrendingUpIcon';
import IndicatorSettingsModal from './IndicatorSettingsModal';
import EditIcon from './icons/EditIcon';
import EyeIcon from './icons/EyeIcon';
import EyeOffIcon from './icons/EyeOffIcon';
import LayersIcon from './icons/LayersIcon';
import ChartBarIcon from './icons/ChartBarIcon';

interface StockChartModalProps {
  ticker: string;
  apiProvider: ApiProvider;
  apiKeys: ApiKeys;
  onClose: () => void;
}

type ChartTool = 'pan' | 'trendline' | 'ruler' | 'fib';
type TimeRange = '5D' | '1M' | '3M' | '6M' | '1Y' | '2Y' | '5Y' | 'MAX';

const chartTools: { id: ChartTool, label: string, icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
    { id: 'pan', label: 'Pan', icon: MousePointerIcon },
    { id: 'trendline', label: 'Trend Line', icon: PencilIcon },
    { id: 'ruler', label: 'Measure', icon: RulerIcon },
    { id: 'fib', label: 'Fib Retracement', icon: FibIcon },
];

const timeRanges: { id: TimeRange, label: string }[] = [
    { id: '5D', label: '5D' },
    { id: '1M', label: '1M' },
    { id: '3M', label: '3M' },
    { id: '6M', label: '6M' },
    { id: '1Y', label: '1Y' },
    { id: '2Y', label: '2Y' },
    { id: '5Y', label: '5Y' },
    { id: 'MAX', label: 'All' },
];

const formatIndicatorName = (indicator: IndicatorConfig) => {
    switch (indicator.type) {
        case 'bollingerBands':
            const { period, stdDev } = indicator.settings as BollingerBandsSettings;
            return `BB (${period}, ${stdDev})`;
        case 'stochasticRSI':
            const { rsiPeriod, stochasticPeriod, kPeriod, dPeriod } = indicator.settings as StochasticRsiSettings;
            return `Stoch RSI (${rsiPeriod}, ${stochasticPeriod}, ${kPeriod}, ${dPeriod})`;
        default:
            return 'Indicator';
    }
};

const StockChartModal: React.FC<StockChartModalProps> = ({ ticker, apiProvider, apiKeys, onClose }) => {
  const [data, setData] = React.useState<CandlestickData[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTool, setActiveTool] = React.useState<ChartTool>('pan');
  const [timeRange, setTimeRange] = React.useState<TimeRange>('1Y');
  const [drawings, setDrawings] = React.useState<ChartDrawings>({ trendLines: [], fibs: [] });
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [isIndicatorModalOpen, setIsIndicatorModalOpen] = React.useState(false);
  const [editingIndicator, setEditingIndicator] = React.useState<IndicatorConfig | null>(null);
  const [indicators, setIndicators] = React.useState<IndicatorConfig[]>([]);
  const [bbData, setBbData] = React.useState<Record<string, BollingerBandsDataPoint[]>>({});
  const [stochRsiData, setStochRsiData] = React.useState<Record<string, StochasticRsiDataPoint[]>>({});
  
  const [isLayersMenuOpen, setIsLayersMenuOpen] = React.useState(false);
  const [isCandlestickVisible, setIsCandlestickVisible] = React.useState(true);
  const [areIndicatorsVisible, setAreIndicatorsVisible] = React.useState(true);
  const [areDrawingsVisible, setAreDrawingsVisible] = React.useState(true);

  const layersMenuRef = React.useRef<HTMLDivElement>(null);
  const layersButtonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    const savedDrawingsJSON = localStorage.getItem(`chartDrawings_${ticker}`);
    const savedIndicatorsJSON = localStorage.getItem(`chartIndicators_${ticker}`);
    
    if (savedDrawingsJSON) {
        try {
            const savedDrawings = JSON.parse(savedDrawingsJSON);
            // Check for new structure, and handle old one gracefully
            if (savedDrawings && Array.isArray(savedDrawings.trendLines) && Array.isArray(savedDrawings.fibs)) {
                // Rulers are no longer persistent, so we ignore them from storage
                setDrawings({ trendLines: savedDrawings.trendLines, fibs: savedDrawings.fibs });
            } else { setDrawings({ trendLines: [], fibs: [] }); }
        } catch (e) {
            console.error("Failed to parse drawings from localStorage", e);
            localStorage.removeItem(`chartDrawings_${ticker}`);
            setDrawings({ trendLines: [], fibs: [] });
        }
    } else {
        setDrawings({ trendLines: [], fibs: [] });
    }

    if (savedIndicatorsJSON) {
        try {
            const savedIndicators = JSON.parse(savedIndicatorsJSON);
            if (Array.isArray(savedIndicators)) setIndicators(savedIndicators);
        } catch (e) {
            console.error("Failed to parse indicators from localStorage", e);
            localStorage.removeItem(`chartIndicators_${ticker}`);
            setIndicators([]);
        }
    } else {
        setIndicators([]);
    }
  }, [ticker]);

  React.useEffect(() => {
    if (apiProvider !== 'alpaca') {
      setIsLoading(false);
      setError(null);
      setData([]);
      return;
    }

    const loadChartData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { alpacaKey, alpacaSecret } = apiKeys;
        if (!alpacaKey || !alpacaSecret) {
          throw new Error('Alpaca API keys are not configured.');
        }
        const bars = await fetchStockBars(ticker, timeRange, alpacaKey, alpacaSecret);
        if (bars.length === 0) {
            throw new Error(`No historical data found for ${ticker} in the selected time range.`);
        }
        setData(bars);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(errorMessage);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadChartData();
  }, [ticker, apiProvider, apiKeys, timeRange]);

  React.useEffect(() => {
    if (data.length > 0 && indicators.length > 0) {
        const newBbData: Record<string, BollingerBandsDataPoint[]> = {};
        const newStochRsiData: Record<string, StochasticRsiDataPoint[]> = {};

        indicators.forEach(ind => {
            if (ind.type === 'bollingerBands') {
                newBbData[ind.id] = calculateBollingerBands(data, ind.settings as any);
            } else if (ind.type === 'stochasticRSI') {
                newStochRsiData[ind.id] = calculateStochasticRSI(data, ind.settings as any);
            }
        });

        setBbData(newBbData);
        setStochRsiData(newStochRsiData);
    } else {
        setBbData({});
        setStochRsiData({});
    }
  }, [data, indicators]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isLayersMenuOpen &&
        layersMenuRef.current &&
        !layersMenuRef.current.contains(event.target as Node) &&
        layersButtonRef.current &&
        !layersButtonRef.current.contains(event.target as Node)
      ) {
        setIsLayersMenuOpen(false);
      }
    };
  
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLayersMenuOpen]);

  const handleDrawingsChange = (newDrawings: ChartDrawings) => {
    setDrawings(newDrawings);
    localStorage.setItem(`chartDrawings_${ticker}`, JSON.stringify(newDrawings));
  };

  const handleClearDrawings = () => {
    handleDrawingsChange({ trendLines: [], fibs: [] });
  };
  
  const handleSaveIndicator = (config: IndicatorConfig) => {
    let newIndicators;
    const isUpdating = indicators.some(i => i.id === config.id);

    if (isUpdating) {
        newIndicators = indicators.map(i => i.id === config.id ? { ...i, ...config } : i);
    } else {
        newIndicators = [...indicators, { ...config, isVisible: true }];
    }

    setIndicators(newIndicators);
    localStorage.setItem(`chartIndicators_${ticker}`, JSON.stringify(newIndicators));
    setIsIndicatorModalOpen(false);
    setEditingIndicator(null);
  };

  const handleDeleteIndicator = (id: string) => {
    const newIndicators = indicators.filter(i => i.id !== id);
    setIndicators(newIndicators);
    localStorage.setItem(`chartIndicators_${ticker}`, JSON.stringify(newIndicators));
  };

  const handleToggleIndicatorVisibility = (id: string) => {
    const newIndicators = indicators.map(ind => 
        ind.id === id ? { ...ind, isVisible: !(ind.isVisible ?? true) } : ind
    );
    setIndicators(newIndicators);
    localStorage.setItem(`chartIndicators_${ticker}`, JSON.stringify(newIndicators));
  };

  const handleToolClick = (toolId: ChartTool) => {
    setActiveTool(toolId);
    if (['trendline', 'ruler', 'fib'].includes(toolId)) {
        setAreDrawingsVisible(true);
    }
  };

  const modalContainerClasses = isFullscreen
    ? "bg-gray-900 w-screen h-screen max-w-none max-h-none rounded-none border-none p-4 flex flex-col"
    : "bg-gray-900 p-4 rounded-xl shadow-2xl border border-gray-700 w-full max-w-4xl h-[80vh] mx-4 flex flex-col";

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div 
        className={modalContainerClasses}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 px-2 flex-wrap gap-2">
          <div className="flex items-center gap-4 flex-wrap">
            <h2 className="text-2xl font-bold text-gray-100">
              <span className="text-green-400">{ticker}</span>
            </h2>
             {indicators.map(ind => (
                <div key={ind.id} className="flex items-center gap-2 text-sm bg-gray-800 px-2 py-1 rounded-md">
                    <button onClick={() => handleToggleIndicatorVisibility(ind.id)} title={ind.isVisible ?? true ? 'Hide Indicator' : 'Show Indicator'}>
                        {(ind.isVisible ?? true) ? <EyeIcon className="w-4 h-4 text-gray-400 hover:text-white" /> : <EyeOffIcon className="w-4 h-4 text-gray-500 hover:text-gray-300" />}
                    </button>
                    <span className="text-gray-300">{formatIndicatorName(ind)}</span>
                    <button onClick={() => { setEditingIndicator(ind); setIsIndicatorModalOpen(true); }} className="text-gray-400 hover:text-white" title="Edit Indicator Settings"><EditIcon className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteIndicator(ind.id)} className="text-gray-400 hover:text-red-400" title="Remove Indicator"><XIcon className="w-4 h-4" /></button>
                </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <MinimizeIcon /> : <FullscreenIcon />}
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label="Close chart">
              <XIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
        
        <div className="flex-grow relative">
          {apiProvider === 'alpaca' ? (
            <>
              <TradingViewChart 
                data={data} 
                activeTool={activeTool} 
                drawings={drawings} 
                onDrawingsChange={handleDrawingsChange}
                indicators={indicators}
                bbData={bbData}
                stochRsiData={stochRsiData}
                isCandlestickVisible={isCandlestickVisible}
                areIndicatorsVisible={areIndicatorsVisible}
                areDrawingsVisible={areDrawingsVisible}
              />
              
              {!isLoading && !error && data.length > 0 && (
                <>
                  <div className="absolute top-1/2 left-2 -translate-y-1/2 z-10 flex flex-col items-center gap-1 bg-gray-950/80 backdrop-blur-sm p-2 rounded-lg border border-gray-700/50 shadow-lg">
                    {chartTools.map(tool => (
                      <button
                        key={tool.id}
                        onClick={() => handleToolClick(tool.id)}
                        title={tool.label}
                        className={`p-2 rounded-md transition-colors ${
                          activeTool === tool.id
                            ? 'bg-green-600/50 text-white'
                            : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                        }`}
                      >
                        <tool.icon className="w-5 h-5" />
                      </button>
                    ))}
                    <div className="w-6 h-px bg-gray-700 my-1"></div>
                     <button
                        ref={layersButtonRef}
                        onClick={() => setIsLayersMenuOpen(prev => !prev)}
                        title="Visibility Layers"
                        className={`p-2 rounded-md transition-colors ${
                            isLayersMenuOpen ? 'bg-green-600/50 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                        }`}
                     >
                        <LayersIcon className="w-5 h-5" />
                     </button>
                    <div className="w-6 h-px bg-gray-700 my-1"></div>
                     <button
                        onClick={() => { setEditingIndicator(null); setIsIndicatorModalOpen(true); }}
                        title="Add Indicator"
                        className="p-2 rounded-md transition-colors text-gray-400 hover:bg-gray-700 hover:text-white"
                     >
                        <TrendingUpIcon className="w-5 h-5" />
                     </button>
                    <button
                      onClick={handleClearDrawings}
                      title="Clear all drawings"
                      className="p-2 rounded-md transition-colors text-red-400 hover:bg-red-900/50 hover:text-red-300"
                      aria-label="Clear all drawings"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>

                  {isLayersMenuOpen && (
                    <div ref={layersMenuRef} className="absolute top-1/2 left-14 z-20 w-48 -translate-y-1/2 bg-gray-950/90 backdrop-blur-sm p-2 rounded-lg border border-gray-700/50 shadow-lg flex flex-col gap-1">
                       <button onClick={() => setIsCandlestickVisible(v => !v)} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-800 w-full text-left">
                           {isCandlestickVisible ? <EyeIcon className="w-5 h-5 text-green-400"/> : <EyeOffIcon className="w-5 h-5 text-gray-500"/>}
                           <ChartBarIcon className="w-5 h-5 text-gray-300"/>
                           <span className="font-semibold text-gray-200">Chart</span>
                       </button>
                       <button onClick={() => setAreIndicatorsVisible(v => !v)} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-800 w-full text-left">
                           {areIndicatorsVisible ? <EyeIcon className="w-5 h-5 text-green-400"/> : <EyeOffIcon className="w-5 h-5 text-gray-500"/>}
                           <TrendingUpIcon className="w-5 h-5 text-gray-300"/>
                           <span className="font-semibold text-gray-200">Indicators</span>
                       </button>
                       <button onClick={() => setAreDrawingsVisible(v => !v)} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-800 w-full text-left">
                           {areDrawingsVisible ? <EyeIcon className="w-5 h-5 text-green-400"/> : <EyeOffIcon className="w-5 h-5 text-gray-500"/>}
                           <PencilIcon className="w-5 h-5 text-gray-300"/>
                           <span className="font-semibold text-gray-200">Drawings</span>
                       </button>
                    </div>
                  )}

                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-gray-950 p-1 rounded-md border border-gray-700">
                    {timeRanges.map(range => (
                      <button
                        key={range.id}
                        onClick={() => setTimeRange(range.id)}
                        className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${
                          timeRange === range.id
                            ? 'bg-green-600 text-white'
                            : 'bg-transparent text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
              
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
                </div>
              )}
              
              {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 p-8 text-center">
                  <AlertTriangleIcon className="w-12 h-12 text-red-400 mb-4" />
                  <h3 className="text-xl font-semibold text-red-300">Failed to Load Chart</h3>
                  <p className="text-gray-300 mt-2 max-w-sm">{error}</p>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <AlertTriangleIcon className="w-12 h-12 text-yellow-400 mb-4" />
              <h3 className="text-xl font-semibold text-yellow-300">Feature Not Available</h3>
              <p className="text-gray-300 mt-2 max-w-sm">
                Live candlestick charts require historical data from Alpaca. Please configure your Alpaca API keys in the settings to use this feature.
              </p>
            </div>
          )}
        </div>
        <div className="bg-black/50 -mx-4 -mb-4 mt-4 px-4 py-3 rounded-b-xl text-center text-gray-500 h-20 flex items-center justify-center shrink-0">
            No active alerts.
        </div>
      </div>
       {isIndicatorModalOpen && (
          <IndicatorSettingsModal
              onSave={handleSaveIndicator}
              onCancel={() => { setIsIndicatorModalOpen(false); setEditingIndicator(null); }}
              existingIndicator={editingIndicator}
          />
       )}
    </div>
  );
};

export default StockChartModal;