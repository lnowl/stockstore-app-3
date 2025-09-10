import React, { useState, useMemo } from 'react';
import { FaBoxOpen, FaWarehouse, FaExclamationTriangle, FaMoneyBillWave, FaShoppingCart, FaTrash } from 'react-icons/fa';
import { jsPDF } from 'jspdf';

const SAMPLE_PRODUCTS = [
  { id: 1, name: 'ท่อเหล็กกลม 3/4"', category: 'Steel', sku: 'ST-074', price: 420, stock: 120, unit: 'ชิ้น', supplier: 'ABC Steel Co.' },
  { id: 2, name: 'เหล็กตัวซี C100', category: 'Steel', sku: 'ST-C100', price: 980, stock: 24, unit: 'เส้น', supplier: 'Bangkok Metals' },
  { id: 3, name: 'ท่อ PVC 1" (ความยาว 4 เมตร)', category: 'PVC', sku: 'PVC-100', price: 135, stock: 400, unit: 'ท่อน', supplier: 'PVC Thailand' },
  { id: 4, name: 'ท่อ PVC 2" (ความยาว 4 เมตร)', category: 'PVC', sku: 'PVC-200', price: 240, stock: 90, unit: 'ท่อน', supplier: 'PVC Thailand' },
  { id: 5, name: 'สายไฟ THW 2.5 sq.mm (100m/ม้วน)', category: 'Wires', sku: 'W-2.5', price: 1650, stock: 30, unit: 'ม้วน', supplier: 'Electric Co.' },
  { id: 6, name: 'สายไฟ THW 4 sq.mm (100m/ม้วน)', category: 'Wires', sku: 'W-4', price: 2450, stock: 12, unit: 'ม้วน', supplier: 'Electric Co.' }
];

export default function App() {
  const [products, setProducts] = useState(SAMPLE_PRODUCTS);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({ name: '', category: '', sku: '', price: '', stock: '', unit: '', supplier: '' });
  const [showDashboard, setShowDashboard] = useState(false);

  const categories = useMemo(() => ['All', ...Array.from(new Set(products.map(p => p.category)))], [products]);

  const filtered = products.filter(p => {
    if (category !== 'All' && p.category !== category) return false;
    if (lowStockOnly && p.stock > 25) return false;
    if (query && !(`${p.name} ${p.sku} ${p.supplier}`.toLowerCase().includes(query.toLowerCase()))) return false;
    return true;
  });

  const totalStock = products.reduce((acc, p) => acc + p.stock, 0);
  const lowStockItems = products.filter(p => p.stock < 25).length;
  const totalProducts = products.length;
  const totalStockValue = products.reduce((acc, p) => acc + p.stock * p.price, 0);

  const cartTotal = cart.reduce((acc, c) => acc + c.price * c.qty, 0);

  function addToCart(product, qty = 1) {
    setCart(prev => {
      const exists = prev.find(i => i.id === product.id);
      if (exists) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + qty } : i);
      return [...prev, { ...product, qty }];
    });
  }

  function removeFromCart(id) {
    setCart(prev => prev.filter(i => i.id !== id));
  }

unction exportQuotationPDF() {
  const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // --- ใส่โลโก้ด้านบน (ใช้ URL ของรูป) ---
  const logoUrl = "https://yourdomain.com/logo.png"; // เปลี่ยนเป็น URL โลโก้จริง
  const imgWidth = 40;
  const imgHeight = 20;
  doc.addImage(logoUrl, "PNG", 10, 10, imgWidth, imgHeight);

  // --- หัวเรื่องใบเสนอราคา ---
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("ใบเสนอราคา / Quotation", pageWidth / 2, 20, { align: "center" });

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`วันที่: ${new Date().toLocaleDateString()}`, pageWidth - 60, 30);

  // --- ตารางสินค้า ---
  const tableColumn = ["สินค้า", "SKU", "จำนวน", "หน่วย", "ราคา/หน่วย", "รวม"];
  const startX = 10;
  let startY = 40;
  const rowHeight = 8;

  // หัวตาราง
  doc.setFillColor(41, 128, 185); // สีน้ำเงินเข้ม
  doc.setTextColor(255, 255, 255);
  tableColumn.forEach((col, i) => {
    const x = startX + [0, 50, 90, 110, 140, 170][i];
    doc.rect(x - 1, startY - 6, i === 5 ? 30 : [50, 40, 20, 30, 30, 30][i], rowHeight, "F");
    doc.text(col, x + 1, startY);
  });

  // --- เนื้อหาตาราง ---
  startY += rowHeight;
  doc.setTextColor(0, 0, 0);
  cart.forEach(item => {
    const colData = [
      item.name,
      item.sku,
      item.qty.toString(),
      item.unit,
      item.price.toLocaleString(),
      (item.price * item.qty).toLocaleString(),
    ];

    colData.forEach((text, i) => {
      const x = startX + [0, 50, 90, 110, 140, 170][i];
      doc.text(text, x + 1, startY);
    });

    startY += rowHeight;
  });

  // --- รวมทั้งหมด ---
  startY += 4;
  doc.setFont("helvetica", "bold");
  doc.text(`รวมทั้งหมด: ${cartTotal.toLocaleString()} บาท`, startX, startY);

  // --- หมายเหตุ ---
  startY += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    "หมายเหตุ: ราคานี้ไม่รวมภาษีมูลค่าเพิ่ม 7%. ราคาสินค้าอาจเปลี่ยนแปลงตามสต๊อกและโปรโมชั่น.",
    startX,
    startY
  );

  // --- เซฟ PDF ---
  doc.save("quotation.pdf");
}

  
  function resetAdminForm() {
    setNewProduct({ name: '', category: '', sku: '', price: '', stock: '', unit: '', supplier: '' });
    setEditingProduct(null);
  }

  function handleAddOrUpdateProduct(e) {
    e.preventDefault();
    const parsed = {
      name: (newProduct.name || '').trim(),
      category: (newProduct.category || '').trim(),
      sku: (newProduct.sku || '').trim(),
      price: Number(newProduct.price) || 0,
      stock: Number(newProduct.stock) || 0,
      unit: (newProduct.unit || '').trim(),
      supplier: (newProduct.supplier || '').trim()
    };
    if (editingProduct) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...parsed } : p));
    } else {
      const newId = products.length ? Math.max(...products.map(p => p.id)) + 1 : 1;
      setProducts(prev => [...prev, { ...parsed, id: newId }]);
    }
    resetAdminForm();
    setShowAdmin(false);
  }

  function handleEditProduct(product) {
    setEditingProduct(product);
    setNewProduct({
      name: product.name || '',
      category: product.category || '',
      sku: product.sku || '',
      price: product.price != null ? String(product.price) : '',
      stock: product.stock != null ? String(product.stock) : '',
      unit: product.unit || '',
      supplier: product.supplier || ''
    });
    setShowAdmin(true);
  }

  function handleDeleteProduct(id) {
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบสินค้านี้?')) {
      setProducts(prev => prev.filter(p => p.id !== id));
      if (editingProduct && editingProduct.id === id) {
        resetAdminForm();
        setShowAdmin(false);
      }
    }
  }

  function handleCancelAdmin() {
    resetAdminForm();
    setShowAdmin(false);
  }

  return (
    <div className="min-h-screen text-gray-200 font-sans bg-[#0D1117]">
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1">StockStore</h1>
            <p className="text-gray-400 text-sm">จัดการสต๊อก เหล็ก · ท่อ PVC · สายไฟ</p>
          </div>
          <div className="flex items-center gap-3 mt-3 md:mt-0">
            <button onClick={() => setShowCart(true)} className="px-3 py-2 bg-purple-600 text-white rounded shadow-sm text-sm hover:bg-purple-500 transition flex items-center gap-2">
              <FaShoppingCart /> ใบเสนอราคา ({cart.length})
            </button>
            <button onClick={() => { resetAdminForm(); setShowAdmin(true); }} className="px-3 py-2 bg-blue-600 text-white rounded shadow-sm text-sm hover:bg-blue-500 transition">เพิ่มสินค้า</button>
            <button onClick={() => setShowDashboard(!showDashboard)} className="px-3 py-2 bg-green-600 text-white rounded shadow-sm text-sm hover:bg-green-500 transition">Dashboard</button>
          </div>
        </header>

        {/* Dashboard */}
        {showDashboard && (
          <div className="bg-gray-900 p-4 rounded shadow mb-6" style={{ backgroundColor: '#151B23' }}>
            <h2 className="text-xl font-bold mb-3 text-white">Dashboard สรุปสต๊อก</h2>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-3 rounded flex items-center gap-2 bg-[#262C36]">
                <FaBoxOpen className="text-white text-2xl" />
                <div>
                  <h3 className="font-semibold text-white">สินค้าทั้งหมด</h3>
                  <p className="text-green-400 font-bold text-2xl">{totalProducts}</p>
                </div>
              </div>
              <div className="p-3 rounded flex items-center gap-2 bg-[#262C36]">
                <FaWarehouse className="text-white text-2xl" />
                <div>
                  <h3 className="font-semibold text-white">รวมสต๊อกทั้งหมด</h3>
                  <p className="text-green-400 font-bold text-2xl">{totalStock}</p>
                </div>
              </div>
              <div className="p-3 rounded flex items-center gap-2 bg-[#262C36]">
                <FaExclamationTriangle className="text-white text-2xl" />
                <div>
                  <h3 className="font-semibold text-white">สินค้าน้อยกว่า 25 ชิ้น</h3>
                  <p className="text-red-500 font-bold text-2xl">{lowStockItems}</p>
                </div>
              </div>
              <div className="p-3 rounded flex items-center gap-2 bg-[#262C36]">
                <FaMoneyBillWave className="text-white text-2xl" />
                <div>
                  <h3 className="font-semibold text-white">มูลค่าสต๊อกทั้งหมด</h3>
                  <p className="text-yellow-400 font-bold text-2xl">{totalStockValue.toLocaleString()} บาท</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Section */}
        <div className="flex flex-wrap gap-3 mb-4">
          <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="ค้นหาสินค้า" className="p-2 rounded text-white flex-1 bg-[#151B23]" />
          <select value={category} onChange={e => setCategory(e.target.value)} className="p-2 rounded bg-[#151B23] text-white">
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={lowStockOnly} onChange={e => setLowStockOnly(e.target.checked)} /> สินค้าน้อยกว่า 25 ชิ้น
          </label>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map(p => (
            <div key={p.id} className="p-4 rounded shadow hover:shadow-lg transition cursor-pointer bg-[#151B23]">
              <h2 className="font-semibold text-lg text-white">{p.name}</h2>
              <p className="text-gray-400 text-sm">SKU: {p.sku}</p>
              <p className="text-gray-400 text-sm">หมวดหมู่: {p.category}</p>
              <p className="text-gray-200">ราคา: {p.price} บาท / {p.unit}</p>
              <p className={`font-semibold ${p.stock < 25 ? 'text-red-500' : 'text-green-400'}`}>คงเหลือ: {p.stock}</p>
              <p className="text-gray-400 text-sm">ผู้จัดหา: {p.supplier}</p>

              <div className="flex gap-2 mt-2">
                <button onClick={() => addToCart(p)} className="px-2 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-500 transition">เพิ่มใบเสนอราคา</button>
                <button onClick={() => handleEditProduct(p)} className="px-2 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-blue-500 transition">แก้ไข</button>
                <button onClick={() => handleDeleteProduct(p.id)} className="px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-500 transition">ลบ</button>
              </div>
            </div>
          ))}
        </div>

        {/* Cart & Admin Modal */}
        {showCart && <CartModal cart={cart} removeFromCart={removeFromCart} setShowCart={setShowCart} exportQuotationPDF={exportQuotationPDF} cartTotal={cartTotal} />}
        {showAdmin && <AdminModal newProduct={newProduct} setNewProduct={setNewProduct} handleAddOrUpdateProduct={handleAddOrUpdateProduct} handleCancelAdmin={handleCancelAdmin} editingProduct={editingProduct} />}
      </div>
    </div>
  );
}

function CartModal({ cart, removeFromCart, setShowCart, exportQuotationPDF, cartTotal }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-6 rounded shadow-lg w-full max-w-2xl" style={{ backgroundColor: '#0D1117' }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">ใบเสนอราคา</h2>
          <button onClick={() => setShowCart(false)} className="text-gray-400 hover:text-white">✕</button>
        </div>

        {cart.length === 0 ? (
          <p className="text-gray-400">ยังไม่มีสินค้าในใบเสนอราคา</p>
        ) : (
          <table className="w-full text-sm text-gray-300 mb-4">
            <thead>
              <tr className="text-left border-b border-gray-700">
                <th className="py-2">สินค้า</th>
                <th className="py-2">จำนวน</th>
                <th className="py-2">ราคา/หน่วย</th>
                <th className="py-2">รวม</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cart.map(item => (
                <tr key={item.id} className="border-b border-gray-700">
                  <td className="py-2">{item.name}</td>
                  <td>{item.qty} {item.unit}</td>
                  <td>{item.price.toLocaleString()} บาท</td>
                  <td>{(item.price * item.qty).toLocaleString()} บาท</td>
                  <td>
                    <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-400">
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="flex justify-between items-center" mt-4>
          <p className="text-white font-bold">รวมทั้งหมด: {cartTotal.toLocaleString()} บาท</p>
          <button onClick={exportQuotationPDF} className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-500 transition">
            Export ใบเสนอราคา
          </button>
        </div>
      </div>
    </div>
  );
}



function AdminModal({ newProduct, setNewProduct, handleAddOrUpdateProduct, handleCancelAdmin, editingProduct }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <form onSubmit={handleAddOrUpdateProduct} className="bg-gray-900 p-6 rounded shadow-lg w-full max-w-md space-y-3 text-white">
        <h2 className="text-xl font-bold">{editingProduct ? 'แก้ไขสินค้า' : 'เพิ่มสินค้า'}</h2>
        <input type="text" placeholder="ชื่อสินค้า" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full p-2 rounded bg-gray-800" required />
        <input type="text" placeholder="หมวดหมู่" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="w-full p-2 rounded bg-gray-800" required />
        <input type="text" placeholder="SKU" value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} className="w-full p-2 rounded bg-gray-800" required />
        <input type="number" placeholder="ราคา" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="w-full p-2 rounded bg-gray-800" required />
        <input type="number" placeholder="สต๊อก" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} className="w-full p-2 rounded bg-gray-800" required />
        <input type="text" placeholder="หน่วย" value={newProduct.unit} onChange={e => setNewProduct({...newProduct, unit: e.target.value})} className="w-full p-2 rounded bg-gray-800" required />
        <input type="text" placeholder="ผู้จัดหา" value={newProduct.supplier} onChange={e => setNewProduct({...newProduct, supplier: e.target.value})} className="w-full p-2 rounded bg-gray-800" required />
        <div className="flex justify-end gap-2 mt-2">
          <button type="submit" className="px-3 py-2 bg-blue-600 rounded hover:bg-blue-500">{editingProduct ? 'บันทึก' : 'เพิ่ม'}</button>
          <button type="button" onClick={handleCancelAdmin} className="px-3 py-2 bg-gray-700 rounded hover:bg-gray-600">ยกเลิก</button>
        </div>
      </form>
    </div>
  );
}
