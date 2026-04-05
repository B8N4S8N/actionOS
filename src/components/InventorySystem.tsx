import React, { useState, useEffect, useRef } from 'react';
import { Camera, QrCode, Plus, Minus, Search, AlertTriangle, Check, X, Loader2, Package, History, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Html5Qrcode } from 'html5-qrcode';
import { useUser } from '@clerk/clerk-react';

export default function InventorySystem() {
  const { user } = useUser();
  const [items, setItems] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'stock' | 'scan' | 'history' | 'reorder'>('stock');
  
  // Modals & States
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutItem, setCheckoutItem] = useState<any>(null);
  const [checkoutQty, setCheckoutQty] = useState(1);
  const [checkoutType, setCheckoutType] = useState<'Resident' | 'Facility'>('Resident');
  const [selectedClient, setSelectedClient] = useState('');
  const [useCase, setUseCase] = useState('');
  
  // Vision & QR
  const [isScanningQR, setIsScanningQR] = useState(false);
  const [isPileScanning, setIsPileScanning] = useState(false);
  const [visionResult, setVisionResult] = useState<any>(null);
  const [isProcessingVision, setIsProcessingVision] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Reorder Intelligence
  const [reorderAlerts, setReorderAlerts] = useState<any[]>([]);
  const [isAnalyzingReorder, setIsAnalyzingReorder] = useState(false);

  // Add Inventory
  const [showAddInventory, setShowAddInventory] = useState(false);
  const [newInventory, setNewInventory] = useState({ item_name: "", category: "Facility", quantity: 0, unit: "pcs", location_id: "loc1", brought_by: "", low_stock_limit: 10, qr_data: "" });

  useEffect(() => {
    fetchData();
    fetchClients();
  }, []);

  const fetchData = async () => {
    const [invRes, txRes] = await Promise.all([
      fetch('/api/inventory'),
      fetch('/api/inventory/transactions')
    ]);
    setItems(await invRes.json());
    setTransactions(await txRes.json());
  };

  const fetchClients = async () => {
    const res = await fetch('/api/clients');
    setClients(await res.json());
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const capturePileScan = async () => {
    if (!videoRef.current) return;
    
    setIsProcessingVision(true);
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const base64Image = canvas.toDataURL('image/jpeg', 0.8);
      
      try {
        const res = await fetch('/api/inventory/vision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_base64: base64Image, location_id: 'loc1' })
        });
        const data = await res.json();
        setVisionResult(data);
        stopCamera();
        setIsPileScanning(false);
      } catch (err) {
        console.error(err);
        alert("Failed to process image.");
      }
    }
    setIsProcessingVision(false);
  };

  const handleQRScan = () => {
    setIsScanningQR(true);
    setTimeout(() => {
      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          html5QrCode.stop();
          setIsScanningQR(false);
          // Find item by QR data or ID
          const item = items.find(i => i.qr_data === decodedText || i.id === decodedText);
          if (item) {
            setCheckoutItem(item);
            setCheckoutQty(1);
            setShowCheckout(true);
          } else {
            alert("Item not found in inventory.");
          }
        },
        (errorMessage) => {
          // parse error, ignore
        }
      ).catch(err => {
        console.error(err);
        setIsScanningQR(false);
        alert("Failed to start QR scanner.");
      });
    }, 100);
  };

  const submitTransaction = async (itemsList: any[]) => {
    if (checkoutType === 'Resident' && !selectedClient) {
      alert("Please select a resident.");
      return;
    }
    if (checkoutType === 'Facility' && !useCase) {
      alert("Please enter a facility use case.");
      return;
    }

    const payload = {
      staff_id: user?.id || 'unknown',
      client_id: checkoutType === 'Resident' ? selectedClient : null,
      use_case: checkoutType === 'Facility' ? useCase : null,
      type: 'OUT',
      items: itemsList.map(i => ({ id: i.id, quantity_change: i.qty }))
    };

    try {
      const res = await fetch('/api/inventory/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowCheckout(false);
        setVisionResult(null);
        fetchData();
      } else {
        alert("Transaction failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting transaction.");
    }
  };

  const analyzeReorder = async () => {
    setIsAnalyzingReorder(true);
    try {
      const res = await fetch('/api/inventory/reorder-intelligence', { method: 'POST' });
      const data = await res.json();
      setReorderAlerts(data);
    } catch (err) {
      console.error(err);
    }
    setIsAnalyzingReorder(false);
  };

  const handleAddInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newInventory)
    });
    if (res.ok) {
      setShowAddInventory(false);
      setNewInventory({ item_name: "", category: "Facility", quantity: 0, unit: "pcs", location_id: "loc1", brought_by: "", low_stock_limit: 10, qr_data: "" });
      fetchData();
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col h-[800px] max-h-[85vh]">
      {/* Header & Tabs */}
      <div className="p-6 border-b border-zinc-100 bg-zinc-50">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            Inventory System
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowAddInventory(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus size={18} /> Add Item
            </button>
            <button 
              onClick={() => { setIsPileScanning(true); startCamera(); }}
              className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-purple-700 transition-colors shadow-sm"
            >
              <Camera size={18} /> Pile Scan
            </button>
            <button 
              onClick={handleQRScan}
              className="bg-zinc-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-zinc-800 transition-colors shadow-sm"
            >
              <QrCode size={18} /> Scan QR
            </button>
          </div>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['stock', 'history', 'reorder'].map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab as any);
                if (tab === 'reorder' && reorderAlerts.length === 0) analyzeReorder();
              }}
              className={`px-4 py-2 rounded-lg text-sm font-bold capitalize whitespace-nowrap transition-colors ${
                activeTab === tab ? 'bg-blue-100 text-blue-700' : 'text-zinc-500 hover:bg-zinc-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-zinc-50/30">
        
        {/* Stock Tab */}
        {activeTab === 'stock' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(item => {
              const isLow = item.quantity <= (item.low_stock_limit || 10);
              return (
                <div key={item.id} className={`p-4 rounded-2xl border ${isLow ? 'bg-red-50 border-red-200' : 'bg-white border-zinc-200'} shadow-sm flex flex-col justify-between`}>
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-zinc-900 text-lg">{item.item_name}</h3>
                      {isLow && <AlertTriangle className="w-5 h-5 text-red-500" />}
                    </div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">{item.category}</p>
                  </div>
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <span className={`text-3xl font-black ${isLow ? 'text-red-600' : 'text-zinc-900'}`}>{item.quantity}</span>
                      <span className="text-sm text-zinc-500 ml-1">{item.unit}</span>
                    </div>
                    <button 
                      onClick={() => { setCheckoutItem(item); setCheckoutQty(1); setShowCheckout(true); }}
                      className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-700 flex items-center justify-center hover:bg-zinc-200 transition-colors"
                    >
                      <Minus size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            {transactions.map(tx => (
              <div key={tx.id} className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${tx.type === 'IN' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {tx.type}
                    </span>
                    <span className="text-sm font-bold text-zinc-900">
                      {tx.client_id ? 'Resident Checkout' : 'Facility Use'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">
                    {new Date(tx.created_at).toLocaleString()} • Staff: {tx.staff_id.substring(0,8)}...
                  </p>
                </div>
                <div className="text-right">
                  {JSON.parse(tx.items_json || '[]').map((item: any, i: number) => (
                    <div key={i} className="text-sm font-medium text-zinc-700">
                      {item.qty || item.quantity_change}x {items.find(inv => inv.id === item.id)?.item_name || 'Item'}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reorder Intelligence Tab */}
        {activeTab === 'reorder' && (
          <div className="space-y-4">
            {isAnalyzingReorder ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-600" />
                <p>Gemini is analyzing 30-day usage patterns...</p>
              </div>
            ) : (
              <>
                {reorderAlerts.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500">No reorder alerts at this time.</div>
                ) : (
                  reorderAlerts.map((alert, i) => (
                    <div key={i} className="bg-red-50 border border-red-200 p-5 rounded-2xl flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-red-900 text-lg mb-1">{alert.item_name}</h4>
                        <p className="text-red-700 text-sm leading-relaxed mb-3">{alert.message}</p>
                        <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors">
                          Generate Order Sheet
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Pile Scan Camera Modal */}
      {isPileScanning && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10">
            <h3 className="text-white font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" /> AI Pile Scan
            </h3>
            <button onClick={() => { setIsPileScanning(false); stopCamera(); }} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-md">
              <X size={20} />
            </button>
          </div>
          <video ref={videoRef} autoPlay playsInline className="flex-1 object-cover w-full h-full" />
          <div className="absolute bottom-8 left-0 right-0 flex justify-center pb-safe">
            <button 
              onClick={capturePileScan}
              disabled={isProcessingVision}
              className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1"
            >
              <div className={`w-full h-full bg-white rounded-full ${isProcessingVision ? 'animate-pulse' : ''}`}></div>
            </button>
          </div>
          {isProcessingVision && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white">
              <Loader2 className="w-12 h-12 animate-spin mb-4 text-purple-400" />
              <p className="font-bold text-lg">Gemini is counting items...</p>
            </div>
          )}
        </div>
      )}

      {/* QR Scanner Modal */}
      {isScanningQR && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10">
            <h3 className="text-white font-bold">Scan QR Code</h3>
            <button onClick={() => { setIsScanningQR(false); }} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-md">
              <X size={20} />
            </button>
          </div>
          <div id="qr-reader" className="flex-1 w-full bg-black flex items-center justify-center"></div>
        </div>
      )}

      {/* Vision Result / Pile Checkout Modal */}
      {visionResult && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6">Pile Scan Results</h3>
            
            <div className="space-y-4 mb-6">
              <h4 className="font-bold text-zinc-500 text-xs uppercase tracking-wider">Recognized Items</h4>
              {visionResult.recognized?.map((item: any, i: number) => {
                const dbItem = items.find(inv => inv.item_name.toLowerCase() === item.name.toLowerCase());
                return (
                  <div key={i} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                    <span className="font-bold text-zinc-900">{item.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-zinc-500">Qty:</span>
                      <input 
                        type="number" 
                        className="w-16 text-center bg-white border border-zinc-200 rounded-lg py-1 font-bold"
                        defaultValue={item.qty}
                        onChange={(e) => { item.qty = parseInt(e.target.value) || 0; }}
                      />
                    </div>
                  </div>
                );
              })}

              {visionResult.unknown?.length > 0 && (
                <>
                  <h4 className="font-bold text-amber-600 text-xs uppercase tracking-wider mt-6">Unknown Items</h4>
                  {visionResult.unknown.map((item: any, i: number) => (
                    <div key={i} className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-sm">
                      {item.description}
                    </div>
                  ))}
                  <button className="w-full py-2 bg-amber-100 text-amber-800 rounded-lg text-sm font-bold mt-2">
                    Add to Inventory or Look Up?
                  </button>
                </>
              )}
            </div>

            <div className="space-y-4 border-t border-zinc-100 pt-6">
              <h4 className="font-bold text-zinc-900">Log Transaction</h4>
              <div className="flex gap-2 p-1 bg-zinc-100 rounded-xl">
                <button 
                  onClick={() => setCheckoutType('Resident')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${checkoutType === 'Resident' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500'}`}
                >
                  Resident
                </button>
                <button 
                  onClick={() => setCheckoutType('Facility')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${checkoutType === 'Facility' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500'}`}
                >
                  Facility Use
                </button>
              </div>

              {checkoutType === 'Resident' ? (
                <select 
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 font-medium"
                  value={selectedClient}
                  onChange={e => setSelectedClient(e.target.value)}
                >
                  <option value="">Select Resident...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                  ))}
                </select>
              ) : (
                <input 
                  type="text"
                  placeholder="Describe facility use (e.g., Restocking bathroom)"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 font-medium"
                  value={useCase}
                  onChange={e => setUseCase(e.target.value)}
                />
              )}

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setVisionResult(null)}
                  className="flex-1 py-3 bg-zinc-100 text-zinc-700 rounded-xl font-bold hover:bg-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    const validItems = visionResult.recognized.map((r: any) => {
                      const dbItem = items.find(inv => inv.item_name.toLowerCase() === r.name.toLowerCase());
                      return dbItem ? { id: dbItem.id, qty: r.qty } : null;
                    }).filter(Boolean);
                    submitTransaction(validItems);
                  }}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                >
                  Log Items
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Single Item Checkout Modal */}
      {showCheckout && checkoutItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-zinc-900">{checkoutItem.item_name}</h3>
                <p className="text-sm text-zinc-500">Current Stock: {checkoutItem.quantity} {checkoutItem.unit}</p>
              </div>
              <button onClick={() => setShowCheckout(false)} className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-500 hover:bg-zinc-200">
                <X size={16} />
              </button>
            </div>

            <div className="flex items-center justify-center gap-6 mb-8">
              <button 
                onClick={() => setCheckoutQty(Math.max(1, checkoutQty - 1))}
                className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-700 hover:bg-zinc-200 transition-colors"
              >
                <Minus size={20} />
              </button>
              <span className="text-4xl font-black text-zinc-900 w-16 text-center">{checkoutQty}</span>
              <button 
                onClick={() => setCheckoutQty(checkoutQty + 1)}
                className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-700 hover:bg-zinc-200 transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2 p-1 bg-zinc-100 rounded-xl">
                <button 
                  onClick={() => setCheckoutType('Resident')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${checkoutType === 'Resident' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500'}`}
                >
                  Resident
                </button>
                <button 
                  onClick={() => setCheckoutType('Facility')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${checkoutType === 'Facility' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500'}`}
                >
                  Facility Use
                </button>
              </div>

              {checkoutType === 'Resident' ? (
                <select 
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 font-medium"
                  value={selectedClient}
                  onChange={e => setSelectedClient(e.target.value)}
                >
                  <option value="">Select Resident...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                  ))}
                </select>
              ) : (
                <input 
                  type="text"
                  placeholder="Describe facility use"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 font-medium"
                  value={useCase}
                  onChange={e => setUseCase(e.target.value)}
                />
              )}

                <button 
                onClick={() => submitTransaction([{ id: checkoutItem.id, qty: checkoutQty }])}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors mt-2"
              >
                Confirm Checkout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Inventory Modal */}
      {showAddInventory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold mb-6">Add Inventory Item</h2>
            <form onSubmit={handleAddInventory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Item Name</label>
                <input 
                  type="text" required
                  className="w-full bg-zinc-100 border-none rounded-xl px-4 py-3"
                  value={newInventory.item_name}
                  onChange={e => setNewInventory({...newInventory, item_name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Quantity</label>
                  <input 
                    type="number" required
                    className="w-full bg-zinc-100 border-none rounded-xl px-4 py-3"
                    value={newInventory.quantity}
                    onChange={e => setNewInventory({...newInventory, quantity: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Unit</label>
                  <input 
                    type="text" required
                    placeholder="e.g. pcs, boxes"
                    className="w-full bg-zinc-100 border-none rounded-xl px-4 py-3"
                    value={newInventory.unit}
                    onChange={e => setNewInventory({...newInventory, unit: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Low Stock Limit</label>
                  <input 
                    type="number" required
                    className="w-full bg-zinc-100 border-none rounded-xl px-4 py-3"
                    value={newInventory.low_stock_limit}
                    onChange={e => setNewInventory({...newInventory, low_stock_limit: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">QR Data (Optional)</label>
                  <input 
                    type="text"
                    placeholder="QR Code string"
                    className="w-full bg-zinc-100 border-none rounded-xl px-4 py-3"
                    value={newInventory.qr_data}
                    onChange={e => setNewInventory({...newInventory, qr_data: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Category</label>
                <select 
                  className="w-full bg-zinc-100 border-none rounded-xl px-4 py-3"
                  value={newInventory.category}
                  onChange={e => setNewInventory({...newInventory, category: e.target.value})}
                >
                  <option value="Facility">Facility</option>
                  <option value="Donation">Donation</option>
                  <option value="Food">Food</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Brought By (Optional)</label>
                <input 
                  type="text"
                  placeholder="e.g. Donor Name"
                  className="w-full bg-zinc-100 border-none rounded-xl px-4 py-3"
                  value={newInventory.brought_by}
                  onChange={e => setNewInventory({...newInventory, brought_by: e.target.value})}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddInventory(false)}
                  className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors"
                >
                  Add Item
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
