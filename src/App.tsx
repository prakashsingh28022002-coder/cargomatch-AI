import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Package, 
  MapPin, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  BrainCircuit,
  Navigation,
  Fuel,
  Leaf
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getMatchingRecommendation, type Truck as TruckType, type Shipment as ShipmentType } from './services/aiService';

export default function App() {
  const [trucks, setTrucks] = useState<TruckType[]>([]);
  const [shipments, setShipments] = useState<ShipmentType[]>([]);
  const [selectedTruck, setSelectedTruck] = useState<TruckType | null>(null);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'fleet' | 'shipments'>('dashboard');
  const [userRole, setUserRole] = useState<'logistics' | 'vendor'>('logistics');
  const [newShipment, setNewShipment] = useState({ origin: '', destination: '', weight: '', price: '' });
  const [newTruck, setNewTruck] = useState({ driver: '', location: '', destination: '', capacity: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [trucksRes, shipmentsRes] = await Promise.all([
        fetch('/api/trucks'),
        fetch('/api/shipments')
      ]);
      const trucksData = await trucksRes.json();
      const shipmentsData = await shipmentsRes.json();
      setTrucks(trucksData);
      setShipments(shipmentsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleGetRecommendation = async (truck: TruckType) => {
    setLoading(true);
    setSelectedTruck(truck);
    const availableShipments = shipments.filter(s => s.status === 'available');
    const rec = await getMatchingRecommendation(truck, availableShipments);
    setRecommendation(rec);
    setLoading(false);
  };

  const handleAcceptMatch = async () => {
    if (!selectedTruck || !recommendation) return;
    
    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          truckId: selectedTruck.id,
          shipmentId: recommendation.recommendedShipmentId
        })
      });
      if (res.ok) {
        fetchData();
        setRecommendation(null);
        setSelectedTruck(null);
      }
    } catch (error) {
      console.error("Error matching:", error);
    }
  };

  const handleSimulateDelivery = async (truckId: string) => {
    // In a real app, this would be a PATCH request
    setTrucks(prev => prev.map(t => t.id === truckId ? { ...t, status: 'empty' } : t));
  };

  const handlePostShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newShipment)
      });
      if (res.ok) {
        fetchData();
        setNewShipment({ origin: '', destination: '', weight: '', price: '' });
        setActiveTab('shipments');
      }
    } catch (error) {
      console.error("Error posting shipment:", error);
    }
  };

  const handleRegisterTruck = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/trucks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTruck)
      });
      if (res.ok) {
        fetchData();
        setNewTruck({ driver: '', location: '', destination: '', capacity: '' });
        setActiveTab('fleet');
      }
    } catch (error) {
      console.error("Error registering truck:", error);
    }
  };

  const renderContent = () => {
    if (activeTab === 'dashboard' || activeTab === 'fleet') {
      return (
        <section className="xl:col-span-2">
          <div className="flex items-center justify-between mb-6 border-b border-[#141414] pb-4">
            <h3 className="font-serif italic text-xl">Active Fleet</h3>
            <div className="flex gap-4">
              <button 
                onClick={() => setActiveTab('fleet')} 
                className="text-[10px] font-bold uppercase border border-[#141414] px-4 py-2 rounded-full hover:bg-[#141414] hover:text-[#E4E3E0]"
              >
                + Register Truck
              </button>
            </div>
          </div>

          {/* Register Truck Form */}
          {activeTab === 'fleet' && (
            <motion.form 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              onSubmit={handleRegisterTruck}
              className="mb-12 bg-white p-8 rounded-3xl border border-[#141414]/10 grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase opacity-50">Driver Name</label>
                <input required value={newTruck.driver} onChange={e => setNewTruck({...newTruck, driver: e.target.value})} className="w-full p-3 bg-[#E4E3E0]/30 rounded-xl border-none text-sm" placeholder="e.g. John Doe" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase opacity-50">Current Location</label>
                <input required value={newTruck.location} onChange={e => setNewTruck({...newTruck, location: e.target.value})} className="w-full p-3 bg-[#E4E3E0]/30 rounded-xl border-none text-sm" placeholder="e.g. Jaipur" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase opacity-50">Home Base</label>
                <input required value={newTruck.destination} onChange={e => setNewTruck({...newTruck, destination: e.target.value})} className="w-full p-3 bg-[#E4E3E0]/30 rounded-xl border-none text-sm" placeholder="e.g. Delhi" />
              </div>
              <div className="flex items-end">
                <button type="submit" className="w-full p-3 bg-[#141414] text-[#E4E3E0] rounded-xl font-bold uppercase text-xs tracking-widest">Add Truck</button>
              </div>
            </motion.form>
          )}

          <div className="space-y-px">
            <div className="grid grid-cols-5 p-4 text-[10px] font-bold uppercase opacity-40 tracking-widest">
              <span>Truck ID</span>
              <span>Driver</span>
              <span>Location</span>
              <span>Status</span>
              <span className="text-right">Action</span>
            </div>
            {trucks.map((truck) => (
              <motion.div 
                key={truck.id}
                layout
                className="grid grid-cols-5 p-4 border-b border-[#141414]/10 items-center hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors group cursor-pointer"
                onClick={() => truck.status === 'empty' || truck.status === 'unloading' ? handleGetRecommendation(truck) : null}
              >
                <span className="font-mono text-sm font-bold">{truck.id}</span>
                <span className="text-sm">{truck.driver}</span>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin size={14} className="opacity-50" />
                  {truck.location}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    truck.status === 'empty' ? 'bg-red-500 animate-pulse' : 
                    truck.status === 'matched' ? 'bg-blue-500' : 'bg-green-500'
                  }`} />
                  <span className="text-[10px] font-bold uppercase tracking-tighter">{truck.status}</span>
                </div>
                <div className="text-right flex justify-end gap-2">
                  {truck.status === 'en-route' && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleSimulateDelivery(truck.id); }}
                      className="text-[10px] font-bold uppercase border border-current px-3 py-1 rounded-full opacity-40 hover:opacity-100"
                    >
                      Finish
                    </button>
                  )}
                  {(truck.status === 'empty' || truck.status === 'unloading') && (
                    <button className="text-[10px] font-bold uppercase border border-current px-3 py-1 rounded-full group-hover:border-[#E4E3E0]">
                      Match AI
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      );
    }

    if (activeTab === 'shipments') {
      return (
        <section className="xl:col-span-2">
          <div className="flex items-center justify-between mb-6 border-b border-[#141414] pb-4">
            <h3 className="font-serif italic text-xl">Available Shipments</h3>
            <button 
              onClick={() => setActiveTab('shipments')} 
              className="text-[10px] font-bold uppercase border border-[#141414] px-4 py-2 rounded-full hover:bg-[#141414] hover:text-[#E4E3E0]"
            >
              + Post Load
            </button>
          </div>

          {/* Post Shipment Form */}
          <motion.form 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            onSubmit={handlePostShipment}
            className="mb-12 bg-white p-8 rounded-3xl border border-[#141414]/10 grid grid-cols-2 lg:grid-cols-5 gap-4"
          >
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase opacity-50">Origin</label>
              <input required value={newShipment.origin} onChange={e => setNewShipment({...newShipment, origin: e.target.value})} className="w-full p-3 bg-[#E4E3E0]/30 rounded-xl border-none text-sm" placeholder="e.g. Jaipur" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase opacity-50">Destination</label>
              <input required value={newShipment.destination} onChange={e => setNewShipment({...newShipment, destination: e.target.value})} className="w-full p-3 bg-[#E4E3E0]/30 rounded-xl border-none text-sm" placeholder="e.g. Delhi" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase opacity-50">Weight (Tons)</label>
              <input required type="number" value={newShipment.weight} onChange={e => setNewShipment({...newShipment, weight: e.target.value})} className="w-full p-3 bg-[#E4E3E0]/30 rounded-xl border-none text-sm" placeholder="e.g. 8" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase opacity-50">Price (₹)</label>
              <input required type="number" value={newShipment.price} onChange={e => setNewShipment({...newShipment, price: e.target.value})} className="w-full p-3 bg-[#E4E3E0]/30 rounded-xl border-none text-sm" placeholder="e.g. 15000" />
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full p-3 bg-[#141414] text-[#E4E3E0] rounded-xl font-bold uppercase text-xs tracking-widest">Post Load</button>
            </div>
          </motion.form>

          <div className="space-y-px">
            <div className="grid grid-cols-5 p-4 text-[10px] font-bold uppercase opacity-40 tracking-widest">
              <span>ID</span>
              <span>Route</span>
              <span>Weight</span>
              <span>Price</span>
              <span className="text-right">Status</span>
            </div>
            {shipments.map((shipment) => (
              <div key={shipment.id} className="grid grid-cols-5 p-4 border-b border-[#141414]/10 items-center">
                <span className="font-mono text-sm font-bold">{shipment.id}</span>
                <span className="text-sm flex items-center gap-2">
                  {shipment.origin} <ArrowRight size={12} /> {shipment.destination}
                </span>
                <span className="text-sm">{shipment.weight}t</span>
                <span className="text-sm font-bold">₹{shipment.price.toLocaleString()}</span>
                <div className="text-right">
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${
                    shipment.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {shipment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Sidebar / Navigation */}
      <nav className="fixed left-0 top-0 h-full w-64 border-r border-[#141414] p-8 hidden lg:flex flex-col">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-[#141414] rounded-full flex items-center justify-center">
            <BrainCircuit className="text-[#E4E3E0] w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tighter uppercase italic">Backhaul AI</h1>
        </div>

        <div className="space-y-6 flex-1">
          <div className="mb-8 p-4 bg-[#141414]/5 rounded-2xl border border-[#141414]/10">
            <p className="text-[10px] font-bold uppercase opacity-40 mb-3 tracking-widest">Switch Perspective</p>
            <div className="flex gap-2">
              <button 
                onClick={() => setUserRole('logistics')}
                className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all ${userRole === 'logistics' ? 'bg-[#141414] text-[#E4E3E0]' : 'bg-transparent border border-[#141414]/20 opacity-50'}`}
              >
                Logistics
              </button>
              <button 
                onClick={() => setUserRole('vendor')}
                className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all ${userRole === 'vendor' ? 'bg-[#141414] text-[#E4E3E0]' : 'bg-transparent border border-[#141414]/20 opacity-50'}`}
              >
                Vendor
              </button>
            </div>
          </div>

          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-3 w-full text-left uppercase text-xs font-bold tracking-widest transition-all ${activeTab === 'dashboard' ? 'opacity-100' : 'opacity-40 hover:opacity-100'}`}
          >
            <TrendingUp size={16} /> Overview
          </button>
          <button 
            onClick={() => setActiveTab('fleet')}
            className={`flex items-center gap-3 w-full text-left uppercase text-xs font-bold tracking-widest transition-all ${activeTab === 'fleet' ? 'opacity-100' : 'opacity-40 hover:opacity-100'}`}
          >
            <Truck size={16} /> Fleet Status
          </button>
          <button 
            onClick={() => setActiveTab('shipments')}
            className={`flex items-center gap-3 w-full text-left uppercase text-xs font-bold tracking-widest transition-all ${activeTab === 'shipments' ? 'opacity-100' : 'opacity-40 hover:opacity-100'}`}
          >
            <Package size={16} /> Shipments
          </button>
        </div>

        <div className="pt-8 border-t border-[#141414]/20 space-y-4">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase opacity-50">
            <span>Efficiency</span>
            <span>84%</span>
          </div>
          <div className="h-1 bg-[#141414]/10 w-full">
            <div className="h-full bg-[#141414] w-[84%]"></div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="lg:ml-64 p-8 lg:p-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <p className="font-serif italic text-sm opacity-50 mb-1 uppercase tracking-widest">Logistics Control Center</p>
            <h2 className="text-5xl font-bold tracking-tighter uppercase">Fleet Intelligence</h2>
          </div>
          <div className="flex gap-4">
            <div className="px-6 py-3 border border-[#141414] rounded-full flex items-center gap-3">
              <Fuel size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">₹4.2L Saved</span>
            </div>
            <div className="px-6 py-3 bg-[#141414] text-[#E4E3E0] rounded-full flex items-center gap-3">
              <Leaf size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">12.4t CO2 Red.</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
          {renderContent()}

          {/* AI Recommendation Panel */}
          <aside className="relative">
            <div className="sticky top-8 space-y-8">
              <AnimatePresence mode="wait">
                {selectedTruck ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-[#141414] text-[#E4E3E0] p-8 rounded-3xl"
                  >
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <BrainCircuit className="text-blue-400" />
                        <h3 className="font-bold uppercase tracking-widest text-xs">AI Matcher</h3>
                      </div>
                      <button onClick={() => setSelectedTruck(null)} className="opacity-50 hover:opacity-100">✕</button>
                    </div>

                    <div className="mb-8">
                      <p className="text-[10px] uppercase opacity-50 font-bold mb-2">Analyzing Truck</p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">{selectedTruck.id}</span>
                        <span className="text-sm opacity-70">{selectedTruck.location} → {selectedTruck.destination}</span>
                      </div>
                    </div>

                    {loading ? (
                      <div className="py-12 flex flex-col items-center justify-center gap-4">
                        <div className="w-12 h-12 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        <p className="text-[10px] font-bold uppercase tracking-widest animate-pulse">Scanning Shipments...</p>
                      </div>
                    ) : recommendation ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="bg-white/5 p-6 rounded-2xl mb-8 border border-white/10">
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-bold uppercase text-blue-400">Best Match Found</span>
                            <span className="text-[10px] font-bold uppercase bg-blue-400 text-[#141414] px-2 py-0.5 rounded">
                              {Math.round(recommendation.efficiencyScore * 100)}% Match
                            </span>
                          </div>
                          <h4 className="text-xl font-bold mb-1">Shipment {recommendation.recommendedShipmentId}</h4>
                          <p className="text-sm opacity-60 mb-4">{recommendation.reasoning}</p>
                          
                          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                            <div>
                              <p className="text-[10px] uppercase opacity-40 font-bold">Est. Profit</p>
                              <p className="text-lg font-bold">₹{recommendation.estimatedProfit.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase opacity-40 font-bold">Route</p>
                              <p className="text-lg font-bold flex items-center gap-2">
                                {selectedTruck.location.substring(0,3).toUpperCase()} <ArrowRight size={14} /> {recommendation.recommendedShipmentId === 'S1' ? 'DEL' : 'GUR'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <button 
                          onClick={handleAcceptMatch}
                          className="w-full bg-blue-400 text-[#141414] py-4 rounded-2xl font-bold uppercase tracking-widest text-sm hover:scale-[1.02] transition-transform flex items-center justify-center gap-3"
                        >
                          <CheckCircle2 size={18} /> Assign Shipment
                        </button>
                      </motion.div>
                    ) : (
                      <div className="py-12 text-center opacity-50">
                        <AlertCircle className="mx-auto mb-4" />
                        <p className="text-xs font-bold uppercase">No optimal matches found in radius</p>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <div className="border-2 border-dashed border-[#141414]/20 p-12 rounded-3xl text-center">
                    <Navigation className="mx-auto mb-4 opacity-20" size={48} />
                    <p className="font-serif italic text-lg opacity-40">Select an empty truck to begin AI matching</p>
                  </div>
                )}
              </AnimatePresence>

              {/* Stats Card */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#141414]/5">
                <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-6">Network Health</h4>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">Empty Miles</span>
                    <span className="text-sm font-mono text-red-500">-32%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">Truck Utilization</span>
                    <span className="text-sm font-mono text-green-500">92.4%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">Avg. Match Time</span>
                    <span className="text-sm font-mono">1.2s</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Mobile Nav Overlay */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full bg-[#141414] text-[#E4E3E0] p-4 flex justify-around items-center z-50">
        <TrendingUp size={20} />
        <Truck size={20} />
        <Package size={20} />
        <BrainCircuit size={20} className="text-blue-400" />
      </div>
    </div>
  );
}
