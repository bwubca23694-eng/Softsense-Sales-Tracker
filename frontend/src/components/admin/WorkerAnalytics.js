import React, { useState, useEffect } from 'react';

const WorkerAnalytics = () => {
  // Mock data - replace with actual API calls
  const [workers, setWorkers] = useState([]);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [selectedStores, setSelectedStores] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [loading, setLoading] = useState(false);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    // TODO: Replace with actual API calls
    // Mock data for demonstration
    setTimeout(() => {
      setWorkers([
        { id: 1, name: 'John Doe', email: 'john@example.com', phone: '123-456-7890' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '098-765-4321' },
        { id: 3, name: 'Mike Johnson', email: 'mike@example.com', phone: '555-123-4567' },
      ]);
      
      setStores([
        { id: 1, name: 'Downtown Store', location: 'Main Street' },
        { id: 2, name: 'Mall Location', location: 'Shopping Mall' },
        { id: 3, name: 'Outlet Center', location: 'West End' },
      ]);
      
      setProducts([
        { id: 1, name: 'Product A', category: 'Electronics' },
        { id: 2, name: 'Product B', category: 'Clothing' },
        { id: 3, name: 'Product C', category: 'Home & Garden' },
        { id: 4, name: 'Product D', category: 'Electronics' },
      ]);
      
      // Mock submissions data
      setSubmissions(generateMockSubmissions());
      setLoading(false);
    }, 500);
  };

  const generateMockSubmissions = () => {
    // Generate mock submission data for demonstration
    const mockData = [];
    for (let i = 0; i < 100; i++) {
      mockData.push({
        id: i + 1,
        workerId: Math.floor(Math.random() * 3) + 1,
        storeId: Math.floor(Math.random() * 3) + 1,
        productId: Math.floor(Math.random() * 4) + 1,
        quantity: Math.floor(Math.random() * 10) + 1,
        amount: Math.floor(Math.random() * 500) + 50,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
    }
    return mockData;
  };

  // Filter submissions based on selected criteria
  const getFilteredSubmissions = () => {
    let filtered = submissions;

    if (selectedWorker) {
      filtered = filtered.filter(s => s.workerId === selectedWorker.id);
    }

    if (selectedStores.length > 0) {
      filtered = filtered.filter(s => selectedStores.includes(s.storeId));
    }

    if (selectedProducts.length > 0) {
      filtered = filtered.filter(s => selectedProducts.includes(s.productId));
    }

    if (dateRange.start) {
      filtered = filtered.filter(s => s.date >= dateRange.start);
    }

    if (dateRange.end) {
      filtered = filtered.filter(s => s.date <= dateRange.end);
    }

    return filtered;
  };

  // Calculate analytics
  const calculateAnalytics = () => {
    const filtered = getFilteredSubmissions();
    
    const totalSales = filtered.reduce((sum, s) => sum + s.amount, 0);
    const totalQuantity = filtered.reduce((sum, s) => sum + s.quantity, 0);
    const totalSubmissions = filtered.length;
    const avgSaleValue = totalSubmissions > 0 ? totalSales / totalSubmissions : 0;

    // Sales by store
    const salesByStore = {};
    stores.forEach(store => {
      const storeSales = filtered.filter(s => s.storeId === store.id);
      salesByStore[store.id] = {
        store: store,
        sales: storeSales.reduce((sum, s) => sum + s.amount, 0),
        quantity: storeSales.reduce((sum, s) => sum + s.quantity, 0),
        count: storeSales.length,
      };
    });

    // Sales by product
    const salesByProduct = {};
    products.forEach(product => {
      const productSales = filtered.filter(s => s.productId === product.id);
      salesByProduct[product.id] = {
        product: product,
        sales: productSales.reduce((sum, s) => sum + s.amount, 0),
        quantity: productSales.reduce((sum, s) => sum + s.quantity, 0),
        count: productSales.length,
      };
    });

    return {
      totalSales,
      totalQuantity,
      totalSubmissions,
      avgSaleValue,
      salesByStore: Object.values(salesByStore).filter(s => s.count > 0),
      salesByProduct: Object.values(salesByProduct).filter(s => s.count > 0),
    };
  };

  const analytics = calculateAnalytics();

  const toggleStore = (storeId) => {
    setSelectedStores(prev => 
      prev.includes(storeId) 
        ? prev.filter(id => id !== storeId)
        : [...prev, storeId]
    );
  };

  const toggleProduct = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const clearFilters = () => {
    setSelectedWorker(null);
    setSelectedStores([]);
    setSelectedProducts([]);
    setDateRange({ start: '', end: '' });
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.75rem',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          color: 'var(--text-primary)',
          marginBottom: '0.5rem',
        }}>
          Individual Worker Analytics
        </h1>
        <p style={{
          fontSize: '0.875rem',
          color: 'var(--text-tertiary)',
          lineHeight: 1.5,
        }}>
          Analyze individual worker performance across stores and products with advanced filtering
        </p>
      </div>

      {/* Filters Panel */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        marginBottom: '1.5rem',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
        }}>
          <h2 style={{
            fontSize: '1rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 4h12M2 8h8M2 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Advanced Filters
          </h2>
          {(selectedWorker || selectedStores.length > 0 || selectedProducts.length > 0 || dateRange.start || dateRange.end) && (
            <button
              onClick={clearFilters}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                background: 'rgba(255,69,58,0.1)',
                color: 'var(--danger)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'var(--transition)',
              }}
            >
              Clear All
            </button>
          )}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
        }}>
          {/* Worker Selection */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Select Worker
            </label>
            <select
              value={selectedWorker?.id || ''}
              onChange={(e) => setSelectedWorker(workers.find(w => w.id === parseInt(e.target.value)))}
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}
            >
              <option value="">All Workers</option>
              {workers.map(worker => (
                <option key={worker.id} value={worker.id}>
                  {worker.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Date Range
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                style={{
                  flex: 1,
                  padding: '0.625rem 0.875rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  fontFamily: 'var(--font-body)',
                }}
              />
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                style={{
                  flex: 1,
                  padding: '0.625rem 0.875rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  fontFamily: 'var(--font-body)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Multi-select Filters */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
          marginTop: '1rem',
        }}>
          {/* Store Filter */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Filter by Stores ({selectedStores.length} selected)
            </label>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.375rem',
              maxHeight: '150px',
              overflowY: 'auto',
              padding: '0.5rem',
              background: 'rgba(0,0,0,0.2)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
            }}>
              {stores.map(store => (
                <label
                  key={store.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    background: selectedStores.includes(store.id) ? 'rgba(10,132,255,0.1)' : 'transparent',
                    transition: 'var(--transition)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedStores.includes(store.id)}
                    onChange={() => toggleStore(store.id)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{
                    fontSize: '0.875rem',
                    color: selectedStores.includes(store.id) ? 'var(--accent)' : 'var(--text-primary)',
                    fontWeight: selectedStores.includes(store.id) ? 600 : 400,
                  }}>
                    {store.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Product Filter */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Filter by Products ({selectedProducts.length} selected)
            </label>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.375rem',
              maxHeight: '150px',
              overflowY: 'auto',
              padding: '0.5rem',
              background: 'rgba(0,0,0,0.2)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
            }}>
              {products.map(product => (
                <label
                  key={product.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    background: selectedProducts.includes(product.id) ? 'rgba(10,132,255,0.1)' : 'transparent',
                    transition: 'var(--transition)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(product.id)}
                    onChange={() => toggleProduct(product.id)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{
                    fontSize: '0.875rem',
                    color: selectedProducts.includes(product.id) ? 'var(--accent)' : 'var(--text-primary)',
                    fontWeight: selectedProducts.includes(product.id) ? 600 : 400,
                  }}>
                    {product.name}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        <StatCard
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M16 6v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6M3 6h14M8 3h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          }
          label="Total Submissions"
          value={analytics.totalSubmissions.toLocaleString()}
          color="#0a84ff"
        />
        <StatCard
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 10h4l3-6 4 12 3-6h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
          label="Total Quantity Sold"
          value={analytics.totalQuantity.toLocaleString()}
          color="#32d74b"
        />
        <StatCard
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2v16M2 10h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          }
          label="Total Sales"
          value={`$${analytics.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          color="#bf5af2"
        />
        <StatCard
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="5" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M3 9h14M7 3v4M13 3v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          }
          label="Avg Sale Value"
          value={`$${analytics.avgSaleValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          color="#ff9f0a"
        />
      </div>

      {/* Results Tables */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
        gap: '1.5rem',
      }}>
        {/* Sales by Store */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '1.25rem',
            borderBottom: '1px solid var(--border)',
          }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 6v7h12V6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                <path d="M1 4h14l-1.5 2H2.5L1 4Z" stroke="currentColor" strokeWidth="1.4"/>
              </svg>
              Sales by Store
            </h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <th style={tableHeaderStyle}>Store</th>
                  <th style={tableHeaderStyle}>Quantity</th>
                  <th style={tableHeaderStyle}>Sales</th>
                  <th style={tableHeaderStyle}>Orders</th>
                </tr>
              </thead>
              <tbody>
                {analytics.salesByStore.length > 0 ? (
                  analytics.salesByStore
                    .sort((a, b) => b.sales - a.sales)
                    .map((item, idx) => (
                      <tr key={item.store.id} style={{
                        borderTop: '1px solid var(--border)',
                        background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                      }}>
                        <td style={tableCellStyle}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {item.store.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.125rem' }}>
                            {item.store.location}
                          </div>
                        </td>
                        <td style={tableCellStyle}>{item.quantity.toLocaleString()}</td>
                        <td style={tableCellStyle}>
                          <span style={{ color: '#32d74b', fontWeight: 600 }}>
                            ${item.sales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td style={tableCellStyle}>{item.count}</td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{
                      ...tableCellStyle,
                      textAlign: 'center',
                      color: 'var(--text-tertiary)',
                      padding: '2rem',
                    }}>
                      No data available for selected filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sales by Product */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '1.25rem',
            borderBottom: '1px solid var(--border)',
          }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L13 4v6L8 13 3 10V4L8 2Z" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M8 13V8M3 4l5 4 5-4" stroke="currentColor" strokeWidth="1.4"/>
              </svg>
              Sales by Product
            </h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <th style={tableHeaderStyle}>Product</th>
                  <th style={tableHeaderStyle}>Quantity</th>
                  <th style={tableHeaderStyle}>Sales</th>
                  <th style={tableHeaderStyle}>Orders</th>
                </tr>
              </thead>
              <tbody>
                {analytics.salesByProduct.length > 0 ? (
                  analytics.salesByProduct
                    .sort((a, b) => b.quantity - a.quantity)
                    .map((item, idx) => (
                      <tr key={item.product.id} style={{
                        borderTop: '1px solid var(--border)',
                        background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                      }}>
                        <td style={tableCellStyle}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {item.product.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.125rem' }}>
                            {item.product.category}
                          </div>
                        </td>
                        <td style={tableCellStyle}>
                          <span style={{ color: '#0a84ff', fontWeight: 600 }}>
                            {item.quantity.toLocaleString()}
                          </span>
                        </td>
                        <td style={tableCellStyle}>
                          ${item.sales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td style={tableCellStyle}>{item.count}</td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{
                      ...tableCellStyle,
                      textAlign: 'center',
                      color: 'var(--text-tertiary)',
                      padding: '2rem',
                    }}>
                      No data available for selected filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon, label, value, color }) => (
  <div style={{
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.25rem',
    transition: 'var(--transition)',
  }}>
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: '0.875rem',
    }}>
      <div style={{
        width: 40,
        height: 40,
        borderRadius: 'var(--radius-sm)',
        background: `${color}15`,
        border: `1px solid ${color}30`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: color,
      }}>
        {icon}
      </div>
    </div>
    <div style={{
      fontSize: '1.75rem',
      fontWeight: 800,
      color: 'var(--text-primary)',
      marginBottom: '0.25rem',
      fontFamily: 'var(--font-display)',
      letterSpacing: '-0.02em',
    }}>
      {value}
    </div>
    <div style={{
      fontSize: '0.8rem',
      color: 'var(--text-tertiary)',
      fontWeight: 500,
    }}>
      {label}
    </div>
  </div>
);

// Table styles
const tableHeaderStyle = {
  padding: '0.875rem 1rem',
  textAlign: 'left',
  fontSize: '0.75rem',
  fontWeight: 700,
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const tableCellStyle = {
  padding: '1rem',
  fontSize: '0.875rem',
  color: 'var(--text-primary)',
};

export default WorkerAnalytics;