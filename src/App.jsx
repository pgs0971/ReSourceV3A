import { useEffect, useState, useMemo } from "react";
import { 
  LayoutDashboard, 
  Globe, 
  Calendar, 
  RotateCcw, 
  ArrowUpDown, 
  TrendingDown, 
  Building2, 
  RefreshCw,
  Search,
  ExternalLink,
  Filter,
  Map as MapIcon
} from "lucide-react";

// --- Components ---

const Badge = ({ children, colorClass, icon: Icon }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-sm ${colorClass}`}>
    {Icon && <Icon size={10} />}
    {children}
  </span>
);

const ArticleCard = ({ article }) => {
  const isLoss = article.category === "Major Loss";
  
  return (
    <div className="bg-white border border-gray-200 p-4 rounded-md shadow-sm mb-3 hover:shadow-md transition-all duration-200 group relative h-[160px] flex flex-col">
      <div className="flex items-start gap-3 h-full">
        <div className="pt-1 shrink-0">
           <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
        </div>
        <div className="flex-1 min-w-0 flex flex-col h-full">
          
          {/* Title - Fixed height container for consistent alignment */}
          <div className="mb-2 h-[40px] overflow-hidden">
            <h3 
              className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors"
              title={article.title}
            >
              {article.title}
            </h3>
          </div>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-2">
            {isLoss ? (
               <Badge colorClass="bg-[#1e3a8a] text-white">MAJOR LOSS</Badge>
            ) : (
               <Badge colorClass="bg-[#2563eb] text-white">M&A DEAL</Badge>
            )}
            
            {article.title.toLowerCase().includes('reinsurance') && (
                <Badge colorClass="bg-gray-100 text-gray-600 border border-gray-200">Reinsurance</Badge>
            )}
            {article.title.toLowerCase().includes('flood') && (
                <Badge colorClass="bg-teal-50 text-teal-700 border border-teal-200">Flood</Badge>
            )}
          </div>

          {/* Footer - Pushed to bottom */}
          <div className="mt-auto pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
            <span className="flex items-center gap-1 font-medium truncate max-w-[140px]">
              by <span className="text-gray-700 truncate">{article.source}</span>
            </span>
            <div className="flex items-center gap-3 shrink-0">
              <span>{new Date(article.pubDate).toLocaleDateString('en-GB')}</span>
              <a 
                href={article.link} 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center gap-1 text-blue-600 hover:underline font-medium opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Source <ExternalLink size={10} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ColumnHeader = ({ title, count, icon: Icon, colorClass }) => (
  <div className="flex items-center justify-between mb-4 sticky top-0 bg-[#f0f2f5] z-10 py-2">
    <div className="flex items-center gap-2">
      <div className={`p-1.5 rounded ${colorClass} text-white shadow-sm`}>
        <Icon size={18} />
      </div>
      <h2 className={`text-lg font-black uppercase tracking-tight ${colorClass.replace("bg-", "text-")}`}>{title}</h2>
      <span className="bg-white border border-gray-200 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">{count}</span>
    </div>
    <button className="text-gray-400 hover:text-blue-600 transition-colors bg-white p-1.5 rounded-full shadow-sm border border-transparent hover:border-gray-200">
      <RefreshCw size={14} />
    </button>
  </div>
);

const FilterBar = ({ placeholder }) => (
  <div className="bg-white p-2 rounded border border-gray-200 mb-4 space-y-2 shadow-sm">
    <div className="flex gap-2">
      <div className="relative flex-1">
        <select className="w-full pl-2 pr-6 py-1.5 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors appearance-none cursor-pointer">
          <option>All Sectors</option>
          <option>P&C</option>
          <option>Life & Health</option>
          <option>Specialty</option>
        </select>
        <Filter className="absolute right-2 top-1.5 text-gray-400 pointer-events-none" size={12} />
      </div>
      <div className="relative flex-[2]">
        <input 
          type="text" 
          placeholder={placeholder} 
          className="w-full pl-8 pr-2 py-1.5 bg-gray-50 border border-gray-200 rounded text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
        />
        <Search className="absolute left-2.5 top-1.5 text-gray-400" size={12} />
      </div>
    </div>
    <div className="relative">
         <select className="w-full pl-2 pr-6 py-1.5 bg-white border border-gray-200 rounded text-xs text-gray-400 focus:outline-none appearance-none cursor-pointer hover:border-gray-300">
          <option>Filter by Article Source...</option>
        </select>
        <div className="absolute right-2.5 top-2.5 pointer-events-none border-t-4 border-t-gray-400 border-x-4 border-x-transparent w-0 h-0"></div>
    </div>
  </div>
);

// --- Main Application ---

export default function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("dashboard"); // 'dashboard' | 'map'
  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock for the ticker bar
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      // In a real scenario, this connects to your backend
      const res = await fetch("/api/get-news");
      if (!res.ok) throw new Error("API unavailable");
      const data = await res.json();
      setItems(data.articles || []);
    } catch (err) {
      console.warn("API Error, using fallback data");
      // Fallback data for preview so the UI looks populated
      setItems([
         { id: 1, title: "Christopher Burgess | Upgrading insurance and infrastructure | Commentary", category: "Major Loss", source: "Jamaica Gleaner", pubDate: new Date().toISOString(), link: "#", location: { lat: 18.1096, lng: -77.2975, name: "Jamaica" } },
         { id: 2, title: "Amynta Group completes acquisition of broker International Sureties", category: "Mergers & Acquisitions", source: "Reinsurance News", pubDate: new Date().toISOString(), link: "#", location: { lat: 40.7128, lng: -74.0060, name: "New York" } },
         { id: 3, title: "Insurance changes could make access to weight loss drugs easier", category: "Major Loss", source: "Cville Right Now", pubDate: new Date().toISOString(), link: "#", location: { lat: 38.0293, lng: -78.4767, name: "Charlottesville" } },
         { id: 4, title: "Helvetia And Baloise Merger Brings Complex Changes For Investors", category: "Mergers & Acquisitions", source: "Finimize", pubDate: new Date().toISOString(), link: "#", location: { lat: 47.5596, lng: 7.5886, name: "Basel" } },
         { id: 5, title: "What to know about insurance if your house flooded", category: "Major Loss", source: "The Seattle Times", pubDate: new Date().toISOString(), link: "#", location: { lat: 47.6062, lng: -122.3321, name: "Seattle" } },
         { id: 6, title: "Chubb-AIG: The unthinkable becomes thinkable", category: "Mergers & Acquisitions", source: "Insurance Insider US", pubDate: new Date().toISOString(), link: "#", location: { lat: 32.3078, lng: -64.7505, name: "Bermuda" } },
         { id: 7, title: "Typhoon Yagi claims rise to $2bn across Southeast Asia", category: "Major Loss", source: "Asia Insurance Review", pubDate: new Date().toISOString(), link: "#", location: { lat: 14.0583, lng: 108.2772, name: "Vietnam" } },
         { id: 8, title: "Gallagher acquires another UK broker in regional push", category: "Mergers & Acquisitions", source: "Insurance Age", pubDate: new Date().toISOString(), link: "#", location: { lat: 51.5074, lng: -0.1278, name: "London" } },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
    const interval = setInterval(fetchArticles, 300000);
    return () => clearInterval(interval);
  }, []);

  // Split content
  const majorLosses = useMemo(() => items.filter(i => i.category === "Major Loss"), [items]);
  const mergers = useMemo(() => items.filter(i => i.category === "Mergers & Acquisitions"), [items]);

  // Map Logic Helpers
  const mapItems = useMemo(() => items.filter(i => i.location), [items]);
  const getPinStyle = (lat, lng) => {
    // Equirectangular projection mapping
    const top = (90 - lat) / 1.8; 
    const left = (lng + 180) / 3.6; 
    return { top: `${top}%`, left: `${left}%` };
  };

  return (
    <div className="flex flex-col h-screen bg-[#f0f2f5] font-sans text-slate-800 overflow-hidden">
      
      {/* HEADER */}
      <header className="bg-[#0f172a] text-white px-4 py-2.5 shadow-md flex items-center justify-between z-50 shrink-0 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-1.5 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.5)]">
            <Globe size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight leading-none text-white">Re:Source Live</h1>
            <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Global Market Intelligence</p>
          </div>
        </div>

        {/* Center Navigation Toggle */}
        <div className="hidden md:flex bg-[#1e293b] p-1 rounded-lg border border-gray-700">
          <button 
            onClick={() => setView("dashboard")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wide transition-all ${view === 'dashboard' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
          >
            <LayoutDashboard size={14} /> Dashboard
          </button>
          <button 
            onClick={() => setView("map")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wide transition-all ${view === 'map' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
          >
            <MapIcon size={14} /> Global Map
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex bg-[#1e293b] rounded-md border border-gray-700 overflow-hidden">
              <button className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700 border-r border-gray-700">
                <Calendar size={12} /> Year
              </button>
              <button className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700">
                Month
              </button>
          </div>
          
          <button className="flex items-center gap-1 bg-white text-gray-900 px-3 py-1.5 rounded text-xs font-bold hover:bg-gray-100 shadow-sm">
            <ArrowUpDown size={12} /> Newest
          </button>
          <button onClick={fetchArticles} className="flex items-center gap-1 bg-[#1e293b] border border-gray-700 px-3 py-1.5 rounded text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
            <RotateCcw size={12} /> Reset
          </button>
        </div>
      </header>

      {/* TICKER BAR */}
      <div className="bg-black border-b-2 border-blue-600 h-8 flex items-center overflow-hidden relative z-40 shrink-0">
         <div className="absolute left-0 top-0 bottom-0 bg-[#0f172a] px-4 z-10 flex items-center gap-2 border-r border-gray-800">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="font-mono text-xs text-blue-400 font-bold tracking-wider">
                {currentTime.toLocaleDateString('en-GB')} {currentTime.toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit'})}
            </span>
         </div>
         <div className="ticker-wrap ml-40">
            <div className="ticker-move text-xs font-mono font-bold tracking-wide flex items-center">
              {items.concat(items).map((item, i) => ( 
                 <span key={i} className="inline-flex items-center mx-6">
                    <span className="text-yellow-500 mr-2">LATEST:</span> 
                    <span className="text-gray-200">{item.title.toUpperCase()}</span> 
                 </span>
              ))}
            </div>
         </div>
      </div>

      {/* CONTENT AREA */}
      <main className="flex-1 overflow-hidden relative">
        {view === 'dashboard' ? (
           <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
              
              {/* Left Column: MAJOR LOSSES */}
              <div className="flex flex-col h-full border-r border-gray-200 bg-[#f0f2f5] p-6 overflow-hidden">
                <ColumnHeader title="Major Losses" count={majorLosses.length} icon={TrendingDown} colorClass="bg-[#1e3a8a]" />
                <FilterBar placeholder="Search losses..." />
                
                <div className="flex-1 overflow-y-auto pr-2 pb-10 space-y-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                    {loading && <div className="text-center py-10 text-gray-500 italic text-sm">Synchronizing live feeds...</div>}
                    {!loading && majorLosses.length === 0 && <div className="text-center py-10 text-gray-500 italic text-sm">No major losses reported in the selected timeframe.</div>}
                    {majorLosses.map(article => (
                        <ArticleCard key={article.id} article={article} />
                    ))}
                </div>
              </div>

              {/* Right Column: M&A */}
              <div className="flex flex-col h-full bg-[#f0f2f5] p-6 overflow-hidden">
                <ColumnHeader title="Mergers & Acquisitions" count={mergers.length} icon={Building2} colorClass="bg-[#2563eb]" />
                 <FilterBar placeholder="Search M&A..." />
                
                 <div className="flex-1 overflow-y-auto pr-2 pb-10 space-y-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                    {loading && <div className="text-center py-10 text-gray-500 italic text-sm">Synchronizing live feeds...</div>}
                    {!loading && mergers.length === 0 && <div className="text-center py-10 text-gray-500 italic text-sm">No deals reported in the selected timeframe.</div>}
                    {mergers.map(article => (
                        <ArticleCard key={article.id} article={article} />
                    ))}
                </div>
              </div>

           </div>
        ) : (
          /* MAP VIEW */
          <div className="w-full h-full bg-[#020617] relative overflow-hidden flex items-center justify-center p-4">
             <div className="absolute top-6 left-6 z-20 bg-black/40 backdrop-blur-md text-green-400 p-3 rounded border border-green-500/30 text-xs font-mono shadow-2xl">
                <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <strong className="text-green-400">LIVE GEO-INTEL FEED</strong>
                </div>
                <div className="text-gray-400">Active Nodes: {mapItems.length}</div>
             </div>
             
             {/* Map Container */}
             <div className="relative w-full max-w-6xl aspect-[2/1] bg-[#0f172a] rounded-xl overflow-hidden shadow-2xl border border-gray-800">
                {/* Simplified World Map Image */}
                <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/8/83/Equirectangular_projection_SW.jpg" 
                    alt="World Map" 
                    className="w-full h-full object-cover opacity-40 mix-blend-screen"
                    style={{ filter: 'grayscale(100%) contrast(1.2) brightness(0.7)' }} 
                />
                
                {/* Map Grid Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

                 {mapItems.map((article) => {
                    const style = getPinStyle(article.location.lat, article.location.lng);
                    const isLoss = article.category === "Major Loss";
                    return (
                        <div 
                            key={article.id}
                            className="absolute -ml-1.5 -mt-1.5 cursor-pointer group z-20 hover:z-50"
                            style={style}
                        >
                            {/* Pulse Effect */}
                            <div className={`absolute -inset-2 rounded-full opacity-75 animate-ping ${isLoss ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                            
                            {/* Pin Point */}
                            <div className={`relative w-3 h-3 rounded-full border border-white/50 shadow-lg ${isLoss ? 'bg-red-600' : 'bg-blue-600'}`}></div>
                            
                            {/* Hover Tooltip */}
                             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-72 bg-gray-900/90 backdrop-blur text-white p-3 text-xs rounded-md shadow-2xl border border-gray-700 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 transform translate-y-2 group-hover:translate-y-0">
                                 <div className="flex items-center justify-between mb-1 border-b border-gray-700 pb-1">
                                    <strong className={`${isLoss ? 'text-red-400' : 'text-blue-400'} uppercase font-bold tracking-wider`}>{article.location.name}</strong>
                                    <span className="text-gray-500 text-[10px]">{new Date(article.pubDate).toLocaleDateString()}</span>
                                 </div>
                                 <p className="leading-relaxed text-gray-300 mb-2">{article.title}</p>
                                 <div className="text-[10px] text-gray-500 uppercase">{article.source}</div>
                            </div>
                        </div>
                    );
                })}
             </div>
          </div>
        )}
      </main>
    </div>
  );
}