import React, { useState, useEffect } from 'react';

const BaristaApp = () => {
  // --- INITIAL DATA ---
  const initialFlavorList = ['Vanilla', 'Caramel', 'Mocha', 'Matcha', 'Seasonal'];
  const initialMilkList = ['Whole', 'Oat', 'Almond', 'Skim', 'Creamer'];

  // --- STATE ---
  const [orders, setOrders] = useState(() => JSON.parse(localStorage.getItem('coffee-orders')) || []);
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('coffee-history')) || []);
  const [outOfStock, setOutOfStock] = useState(() => JSON.parse(localStorage.getItem('coffee-stock')) || []);
  
  const [view, setView] = useState('queue'); // 'queue', 'stats', or 'stock'
  const [customerName, setCustomerName] = useState('');
  const [pendingOrder, setPendingOrder] = useState(null);
  const [now, setNow] = useState(Date.now());

  // --- PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem('coffee-orders', JSON.stringify(orders));
    localStorage.setItem('coffee-history', JSON.stringify(history));
    localStorage.setItem('coffee-stock', JSON.stringify(outOfStock));
  }, [orders, history, outOfStock]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // --- STOCK LOGIC ---
  const toggleStock = (item) => {
    if (outOfStock.includes(item)) {
      setOutOfStock(outOfStock.filter(i => i !== item));
    } else {
      setOutOfStock([...outOfStock, item]);
    }
  };

  // --- ORDER HANDLERS ---
  const initiateOrder = (flavor, temp) => {
    if (outOfStock.includes(flavor)) return;
    if (!customerName.trim()) return alert("Enter Customer Name!");
    
    let finalFlavor = flavor === 'Custom' ? prompt("Enter Custom Flavor:") : flavor;
    if (!finalFlavor) return;
    setPendingOrder({ flavor: finalFlavor, temp, customer: customerName });
  };

  const finalizeOrder = (milk) => {
    if (outOfStock.includes(milk)) return;
    let finalMilk = milk === 'Custom' ? prompt("Enter Custom Milk:") : milk;
    if (!finalMilk) return;

    const newOrder = { 
        ...pendingOrder, 
        id: Date.now(),
        startTime: Date.now(),
        milk: finalMilk, 
        timeString: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    };
    setOrders([newOrder, ...orders]);
    setPendingOrder(null);
    setCustomerName('');
  };

  const completeOrder = (id) => {
    const order = orders.find(o => o.id === id);
    if (order) {
      const waitTimeSeconds = Math.floor((Date.now() - order.startTime) / 1000);
      setHistory([{ ...order, waitTimeSeconds }, ...history]);
      setOrders(orders.filter(o => o.id !== id));
    }
  };

  return (
    <div className="p-4 md:p-8 bg-slate-100 min-h-screen font-sans text-slate-900">
      <div className="max-w-5xl mx-auto">
        
        {/* NAVIGATION BAR */}
        <nav className="flex gap-2 mb-6 bg-white p-2 rounded-3xl shadow-sm border border-slate-200">
          <button onClick={() => setView('queue')} className={`flex-1 py-4 rounded-2xl font-black transition ${view === 'queue' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400'}`}>QUEUE</button>
          <button onClick={() => setView('stock')} className={`flex-1 py-4 rounded-2xl font-black transition ${view === 'stock' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400'}`}>STOCK</button>
          <button onClick={() => setView('stats')} className={`flex-1 py-4 rounded-2xl font-black transition ${view === 'stats' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>STATS</button>
        </nav>

        {view === 'queue' && (
          <>
            <input type="text" placeholder="Customer Name..." className="w-full p-6 text-3xl rounded-[30px] shadow-xl mb-6 border-none outline-none focus:ring-4 focus:ring-orange-200" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
              {initialFlavorList.map((flavor) => {
                const isOut = outOfStock.includes(flavor);
                return (
                  <div key={flavor} className={`bg-white p-4 rounded-[30px] shadow-sm flex flex-col items-center ${isOut ? 'opacity-30 grayscale' : ''}`}>
                    <p className="font-black text-lg mb-3">{flavor}</p>
                    <div className="flex gap-2 w-full">
                      <button disabled={isOut} onClick={() => initiateOrder(flavor, 'Hot')} className="flex-1 bg-orange-100 text-orange-700 py-3 rounded-xl font-black text-xs">HOT</button>
                      <button disabled={isOut} onClick={() => initiateOrder(flavor, 'Iced')} className="flex-1 bg-blue-100 text-blue-700 py-3 rounded-xl font-black text-xs">ICED</button>
                    </div>
                  </div>
                );
              })}
              <button onClick={() => initiateOrder('Custom', 'Hot/Iced')} className="bg-slate-800 text-white rounded-[30px] font-black">+ CUSTOM</button>
            </div>

            <div className="space-y-4">
              {orders.map(order => {
                const seconds = Math.floor((now - order.startTime) / 1000);
                return (
                  <div key={order.id} className={`flex justify-between items-center p-6 rounded-[35px] bg-white shadow-lg border-l-[16px] ${order.temp === 'Hot' ? 'border-orange-500' : 'border-blue-500'}`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-2xl font-black">{order.customer}</h3>
                        <span className={`px-3 py-1 rounded-full font-mono font-bold text-sm ${seconds > 180 ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100'}`}>
                          {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                      <p className="text-slate-500 font-bold uppercase text-xs">{order.temp} {order.flavor} w/ {order.milk}</p>
                    </div>
                    <button onClick={() => completeOrder(order.id)} className="bg-emerald-500 text-white w-20 h-20 rounded-[25px] font-black text-3xl shadow-lg">✓</button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {view === 'stock' && (
          <div className="bg-white p-8 rounded-[40px] shadow-lg animate-in fade-in">
            <h2 className="text-3xl font-black mb-6">Inventory Manager</h2>
            <p className="text-slate-400 mb-8 font-medium">Tap an item to mark it as "Out of Stock." It will be hidden from the order menu.</p>
            
            <div className="grid grid-cols-2 gap-4">
              {[...initialFlavorList, ...initialMilkList].map(item => {
                const isOut = outOfStock.includes(item);
                return (
                  <button 
                    key={item} 
                    onClick={() => toggleStock(item)}
                    className={`p-6 rounded-2xl font-black text-xl transition-all border-4 ${isOut ? 'bg-red-50 border-red-500 text-red-600' : 'bg-slate-50 border-transparent text-slate-800'}`}
                  >
                    {item} {isOut ? '(OUT)' : '(IN)'}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {view === 'stats' && (
           <div className="animate-in fade-in">
              <h2 className="text-3xl font-black mb-8">Shift Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white p-8 rounded-[40px] shadow-sm">
                      <h3 className="text-slate-400 font-bold uppercase text-xs mb-2">Avg Speed</h3>
                      <p className="text-6xl font-black">{history.length > 0 ? Math.floor(history.reduce((a, b) => a + b.waitTimeSeconds, 0) / history.length) : 0}s</p>
                  </div>
                  <div className="bg-white p-8 rounded-[40px] shadow-sm">
                      <h3 className="text-slate-400 font-bold uppercase text-xs mb-2">Total Sold</h3>
                      <p className="text-6xl font-black">{history.length}</p>
                  </div>
              </div>
           </div>
        )}
      </div>

      {/* MILK MODAL */}
      {pendingOrder && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-sm rounded-[50px] p-8 shadow-2xl">
            <h2 className="text-center text-xl font-black mb-6 italic uppercase tracking-widest">Select Milk</h2>
            <div className="grid grid-cols-1 gap-3">
              {initialMilkList.map(m => {
                const isOut = outOfStock.includes(m);
                return (
                  <button 
                    key={m} 
                    disabled={isOut}
                    onClick={() => finalizeOrder(m)} 
                    className={`p-5 rounded-2xl font-bold transition text-xl ${isOut ? 'opacity-20 bg-slate-200' : 'bg-slate-50 hover:bg-orange-50 border border-slate-100'}`}
                  >
                    {m}
                  </button>
                );
              })}
              <button onClick={() => finalizeOrder('Custom')} className="bg-slate-800 text-white p-5 rounded-2xl font-bold text-xl mt-2">OTHER</button>
            </div>
            <button onClick={() => setPendingOrder(null)} className="w-full mt-6 text-slate-400 font-bold">CANCEL</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BaristaApp;
