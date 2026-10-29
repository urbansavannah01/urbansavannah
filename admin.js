import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-analytics.js";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot 
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);

const DEFAULT_SETTINGS = {
  storeName: "Urban Savannah Collection",
  logoUrl: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=200&q=80",
  currency: "Ksh",
  phone: "+254 00000000",
  whatsapp: "254700000000",
  instagram: "Urban Savannah Collection",
  tiktok: "@Urban Savannah Collection",
  facebook: "Urban Savannah Collection",
  paymentMethods: "M-Pesa Till / Cash on Delivery / Card",
  location: "Nairobi, Kenya",
  mapsUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15955.292672314545!2d36.817223!3d-1.286389!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f1172d84d49a7%3A0xf7cf0254b297924c!2sNairobi!5e0!3m2!1sen!2ske!4v1650000000000!5m2!1sen!2ske",
  deliveryFee: 5.00,
  bgUrl: "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1600&q=80",
  adminPassword: "admin123",
  terms: "Welcome to Urban Savannah Collection. Purchases are governed by local delivery guidelines in Nairobi, Kenya.",
  privacy: "Information collected during checkout is strictly used for order processing and delivery."
};

let settings = JSON.parse(localStorage.getItem('Urban Savannah Collection_settings')) || DEFAULT_SETTINGS;
if (!settings.adminPassword) settings.adminPassword = DEFAULT_SETTINGS.adminPassword;

let products = [];
let orders = [];

function formatMoney(amount) {
  return `${settings.currency || '$'}${parseFloat(amount).toFixed(2)}`;
}

window.onload = function() {
  const isAuth = localStorage.getItem('Urban Savannah Collection_admin_auth');
  const loginScreen = document.getElementById('admin-login-screen');
  
  if (isAuth === 'true') {
    if (loginScreen) loginScreen.classList.add('hidden');
  } else {
    if (loginScreen) loginScreen.classList.remove('hidden');
  }
  
  syncAdminData();
  loadPoliciesForm();

  // Real-time Firestore listener for products
  onSnapshot(collection(db, "products"), (snapshot) => {
    products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    renderAdminProducts();
  });

  // Real-time Firestore listener for orders
  onSnapshot(collection(db, "orders"), (snapshot) => {
    orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    renderAdminOrders();
  });
};

function saveAdminState() {
  localStorage.setItem('Urban Savannah Collection_settings', JSON.stringify(settings));
  syncAdminData();
}

window.logoutAdmin = function() {
  localStorage.removeItem('Urban Savannah Collection_admin_auth');
  window.location.href = 'index.html';
};

function syncAdminData() {
  const bgBody = document.getElementById('admin-body-bg');
  if (bgBody && settings.bgUrl) {
    bgBody.style.backgroundImage = `url('${settings.bgUrl}')`;
  }
  
  const fields = {
    'setting-logo-url': settings.logoUrl,
    'setting-store-name': settings.storeName,
    'setting-store-currency': settings.currency,
    'setting-store-phone': settings.phone,
    'setting-store-whatsapp': settings.whatsapp,
    'setting-store-instagram': settings.instagram,
    'setting-store-tiktok': settings.tiktok,
    'setting-store-facebook': settings.facebook,
    'setting-payment-methods': settings.paymentMethods,
    'setting-store-location': settings.location,
    'setting-maps-url': settings.mapsUrl,
    'setting-bg-url': settings.bgUrl
  };

  for (const [id, val] of Object.entries(fields)) {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  }
}

window.handleAdminLogin = function(e) {
  e.preventDefault();
  const passwordInput = document.getElementById('admin-password-input');
  const inputPass = passwordInput ? passwordInput.value : '';
  
  if (inputPass === settings.adminPassword) {
    localStorage.setItem('Urban Savannah Collection_admin_auth', 'true');
    const loginScreen = document.getElementById('admin-login-screen');
    if (loginScreen) loginScreen.classList.add('hidden');
    if (passwordInput) passwordInput.value = '';
  } else {
    alert("Incorrect Admin Password!");
  }
};

window.switchAdminTab = function(tab) {
  ['orders', 'products', 'settings', 'policies'].forEach(t => {
    const tabEl = document.getElementById(`admin-tab-${t}`);
    const btnEl = document.getElementById(`tab-btn-${t}`);
    if (tabEl) tabEl.classList.add('hidden');
    if (btnEl) {
      btnEl.classList.remove('bg-sky-600', 'text-white');
      btnEl.classList.add('text-slate-400');
    }
  });
  
  const activeTab = document.getElementById(`admin-tab-${tab}`);
  const activeBtn = document.getElementById(`tab-btn-${tab}`);
  if (activeTab) activeTab.classList.remove('hidden');
  if (activeBtn) {
    activeBtn.classList.add('bg-sky-600', 'text-white');
    activeBtn.classList.remove('text-slate-400');
  }
};

window.renderAdminOrders = function() {
  const tbody = document.getElementById('admin-orders-table-body');
  if (!tbody) return;
  
  tbody.innerHTML = orders.map(order => `
    <tr class="hover:bg-slate-800/40 border-b border-slate-800/60">
      <td class="py-3.5 px-4 font-mono"><span class="font-bold text-white block">${order.id}</span><span class="text-[11px] text-slate-400">${order.dateTime}</span></td>
      <td class="py-3.5 px-4"><div class="font-semibold text-slate-200">${order.customerName}</div><div class="text-xs text-slate-400">${order.customerPhone}</div></td>
      <td class="py-3.5 px-4 text-xs">${order.items ? order.items.map(i => `${i.qty}x ${i.title}`).join(', ') : ''}</td>
      <td class="py-3.5 px-4 text-xs uppercase font-bold text-sky-400">${order.contactChannel || 'WhatsApp'}</td>
      <td class="py-3.5 px-4 text-xs text-slate-300">${settings.paymentMethods || 'Standard'}</td>
      <td class="py-3.5 px-4 font-bold text-white">${formatMoney(order.total || 0)}</td>
      <td class="py-3.5 px-4"><span class="px-2.5 py-1 rounded-full text-xs font-semibold ${order.status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}">${order.status}</span></td>
      <td class="py-3.5 px-4 text-right space-x-1">
        <button onclick="toggleOrderStatus('${order.id}')" class="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs" title="Toggle Status"><i class="fa-solid fa-rotate"></i></button>
        <button onclick="deleteOrder('${order.id}')" class="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs" title="Delete Order"><i class="fa-solid fa-trash"></i></button>
        <button onclick="printOrderReceipt('${order.id}')" class="px-2.5 py-1.5 bg-sky-600/20 text-sky-300 rounded-lg text-xs font-semibold"><i class="fa-solid fa-print mr-1"></i> Receipt</button>
      </td>
    </tr>
  `).join('');
};

window.toggleOrderStatus = async function(id) {
  const o = orders.find(ord => ord.id === id);
  if (o) {
    o.status = o.status === 'Pending Delivery' ? 'Delivered' : 'Pending Delivery';
    try {
      await setDoc(doc(db, "orders", id), o, { merge: true });
    } catch (err) {
      console.error("Error updating order status in Firestore:", err);
    }
  }
};

window.deleteOrder = async function(id) {
  if (confirm("Are you sure you want to permanently delete this order?")) {
    try {
      await deleteDoc(doc(db, "orders", id));
    } catch (err) {
      console.error("Error deleting order from Firestore:", err);
    }
  }
};

window.exportOrdersToExcel = function() {
  let template = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
  <head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Orders</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
  <body><table border="1">
  <tr style="background-color:#0284c7; color:#ffffff; font-weight:bold;">
  <th>Order ID</th><th>Nairobi Date & Time</th><th>Customer Name</th><th>Phone</th><th>Delivery Address</th><th>Checkout Method</th><th>Total</th><th>Status</th>
  </tr>`;
  
  orders.forEach(o => {
    template += `<tr><td>${o.id}</td><td>${o.dateTime}</td><td>${o.customerName}</td><td>${o.customerPhone}</td><td>${o.customerAddress}</td><td>${o.contactChannel || 'WhatsApp'}</td><td>${o.total}</td><td>${o.status}</td></tr>`;
  });
  
  template += `</table></body></html>`;
  const blob = new Blob([template], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Urban Savannah Collection_orders_${Date.now()}.xls`;
  a.click();
};

window.exportOrdersToSpreadsheet = function() {
  let csv = 'Order ID, Nairobi Date & Time, Customer Name, Phone, Address, Checkout Method, Total Amount, Status\n';
  orders.forEach(o => {
    csv += `"${o.id}","${o.dateTime}","${o.customerName}","${o.customerPhone}","${o.customerAddress}","${o.contactChannel || 'WhatsApp'}",${o.total},"${o.status}"\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Urban Savannah Collection_orders_${Date.now()}.csv`;
  a.click();
};

window.addImageUrlInput = function(value = '') {
  const container = document.getElementById('image-urls-container');
  if (!container) return;
  const div = document.createElement('div');
  div.className = 'flex items-center gap-2';
  div.innerHTML = `
    <input type="text" value="${value}" placeholder="https://image-url.jpg or .png" class="prod-img-input w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white" required>
    <button type="button" onclick="this.parentElement.remove()" class="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20"><i class="fa-solid fa-trash"></i></button>
  `;
  container.appendChild(div);
};

window.renderAdminProducts = function() {
  const grid = document.getElementById('admin-products-grid');
  if (!grid) return;
  
  grid.innerHTML = products.map(product => `
    <div class="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden p-4 flex flex-col justify-between">
      <div>
        <img src="${product.images && product.images.length > 0 ? product.images[0] : 'https://placehold.co/600x400'}" class="w-full h-36 object-cover rounded-xl mb-3 bg-slate-950">
        <h4 class="font-bold text-white text-sm">${product.title}</h4>
        <p class="text-xs text-sky-400 font-bold mt-1">${formatMoney(product.price)} (${product.images ? product.images.length : 0} photos)</p>
      </div>
      <div class="mt-4 pt-3 border-t border-slate-800 flex justify-end gap-2">
        <button onclick="openProductModal('${product.id}')" class="px-3 py-1.5 bg-slate-800 text-xs text-slate-200 rounded-lg">Edit</button>
        <button onclick="deleteProduct('${product.id}')" class="px-3 py-1.5 bg-red-500/10 text-red-400 text-xs rounded-lg">Delete</button>
      </div>
    </div>
  `).join('');
};

window.openProductModal = function(id = null) {
  const container = document.getElementById('image-urls-container');
  if (container) container.innerHTML = '';
  
  if (id) {
    const p = products.find(prod => prod.id === id);
    if (p) {
      document.getElementById('prod-id').value = p.id;
      document.getElementById('prod-title').value = p.title;
      document.getElementById('prod-price').value = p.price;
      document.getElementById('prod-category').value = p.category;
      document.getElementById('prod-desc').value = p.description;
      document.getElementById('product-modal-title').textContent = "Edit Product Details";
      if (p.images) {
        p.images.forEach(img => addImageUrlInput(img));
      }
    }
  } else {
    const prodForm = document.getElementById('product-form');
    if (prodForm) prodForm.reset();
    document.getElementById('prod-id').value = '';
    document.getElementById('product-modal-title').textContent = "Add Product";
    addImageUrlInput();
  }
  document.getElementById('product-modal').classList.remove('hidden');
};

window.closeProductModal = function() {
  document.getElementById('product-modal').classList.add('hidden');
};

window.saveProduct = async function(e) {
  e.preventDefault();
  const id = document.getElementById('prod-id').value;
  const title = document.getElementById('prod-title').value;
  const price = parseFloat(document.getElementById('prod-price').value);
  const category = document.getElementById('prod-category').value;
  const description = document.getElementById('prod-desc').value;
  const imgInputs = document.querySelectorAll('.prod-img-input');
  const images = Array.from(imgInputs).map(i => i.value.trim()).filter(Boolean);
  
  if (images.length === 0) {
    alert("Please add at least one product image URL.");
    return;
  }
  
  const productId = id ? id : ('prod_' + Date.now());
  const productData = { title, price, category, images, description };
  
  try {
    await setDoc(doc(db, "products", productId), productData);
  } catch (err) {
    console.error("Error saving product to Firestore:", err);
  }
  
  closeProductModal();
};

window.deleteProduct = async function(id) {
  if (confirm("Are you sure you want to delete this product?")) {
    try {
      await deleteDoc(doc(db, "products", id));
    } catch (err) {
      console.error("Error deleting product from Firestore:", err);
    }
  }
};

window.saveAdminSettings = function(e) {
  e.preventDefault();
  settings.storeName = document.getElementById('setting-store-name').value;
  settings.logoUrl = document.getElementById('setting-logo-url').value.trim();
  settings.currency = document.getElementById('setting-store-currency').value;
  settings.phone = document.getElementById('setting-store-phone').value;
  settings.whatsapp = document.getElementById('setting-store-whatsapp').value;
  settings.instagram = document.getElementById('setting-store-instagram').value;
  settings.tiktok = document.getElementById('setting-store-tiktok').value;
  settings.facebook = document.getElementById('setting-store-facebook').value;
  settings.paymentMethods = document.getElementById('setting-payment-methods').value;
  settings.location = document.getElementById('setting-store-location').value;
  settings.mapsUrl = document.getElementById('setting-maps-url').value;
  
  const bgInput = document.getElementById('setting-bg-url').value.trim();
  if (bgInput) {
    settings.bgUrl = bgInput;
  }
  
  saveAdminState();
  alert("Store settings saved successfully!");
};

window.openChangePassModal = function() {
  document.getElementById('change-pass-modal').classList.remove('hidden');
};

window.toggleChangePassModal = function(open) {
  document.getElementById('change-pass-modal').classList.toggle('hidden', !open);
};

window.handleChangePassword = function(e) {
  e.preventDefault();
  const oldP = document.getElementById('old-pass').value;
  const newP = document.getElementById('new-pass').value;
  
  if (oldP !== settings.adminPassword) {
    alert("Current password is incorrect.");
    return;
  }
  
  settings.adminPassword = newP;
  saveAdminState();
  toggleChangePassModal(false);
  alert("Password updated successfully!");
};

function loadPoliciesForm() {
  const pTerms = document.getElementById('policy-terms');
  const pPrivacy = document.getElementById('policy-privacy');
  if (pTerms) pTerms.value = settings.terms;
  if (pPrivacy) pPrivacy.value = settings.privacy;
}

window.savePolicies = function(e) {
  e.preventDefault();
  settings.terms = document.getElementById('policy-terms').value;
  settings.privacy = document.getElementById('policy-privacy').value;
  saveAdminState();
  alert("Policies updated successfully!");
};

window.printOrderReceipt = function(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  
  document.getElementById('print-store-name').textContent = settings.storeName;
  document.getElementById('print-store-address').textContent = settings.location;
  document.getElementById('print-order-id').textContent = order.id;
  document.getElementById('print-order-date').textContent = order.dateTime;
  document.getElementById('print-cust-name').textContent = order.customerName;
  document.getElementById('print-cust-phone').textContent = order.customerPhone;
  document.getElementById('print-cust-address').textContent = order.customerAddress;
  document.getElementById('print-checkout-channel').textContent = order.contactChannel || 'WhatsApp';
  document.getElementById('print-payment-methods').textContent = settings.paymentMethods || 'M-Pesa / Cash / Card';
  
  document.getElementById('print-items-body').innerHTML = order.items ? order.items.map(i => `
    <tr style="border-bottom: 1px solid #cbd5e1;">
      <td style="padding: 6px 0;"><img src="${i.image}" style="width: 36px; height: 36px; object-fit: cover; border-radius: 4px;" onerror="this.src='https://placehold.co/100x100'"></td>
      <td style="padding: 6px 0; font-weight: bold;">${i.title}</td>
      <td style="padding: 6px 0; text-align: center;">${i.qty}</td>
      <td style="padding: 6px 0; text-align: right;">${formatMoney(i.price * i.qty)}</td>
    </tr>
  `).join('') : '';
  
  document.getElementById('print-total').textContent = formatMoney(order.total || 0);
  window.print();
};
