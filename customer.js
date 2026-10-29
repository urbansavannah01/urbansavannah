import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);

const DEFAULT_SETTINGS = {
  storeName: "Urban Savannah Collection",
  currency: "Ksh",
  logoUrl: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=200&q=80",
  phone: "+254 700 000000",
  whatsapp: "254700000000",
  instagram: "Urban Savannah Collection",
  tiktok: "@Urban Savannah Collection",
  facebook: "Urban Savannah Collection",
  location: "Nairobi, Kenya",
  mapsUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15955.292672314545!2d36.817223!3d-1.286389!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f1172d84d49a7%3A0xf7cf0254b297924c!2sNairobi!5e0!3m2!1sen!2ske!4v1650000000000!5m2!1sen!2ske",
  deliveryFee: 5.00,
  terms: "Welcome to Urban Savannah Collection. Purchases are governed by local delivery and return guidelines in Nairobi, Kenya.",
  privacy: "Information collected during checkout is strictly used for order processing and delivery."
};

let settings = JSON.parse(localStorage.getItem('Urban Savannah Collection_settings')) || DEFAULT_SETTINGS;
let products = JSON.parse(localStorage.getItem('Urban Savannah Collection_products')) || [];
let orders = JSON.parse(localStorage.getItem('Urban Savannah Collection_orders')) || [];
let cart = JSON.parse(localStorage.getItem('Urban Savannah Collection_cart')) || [];
let selectedCategory = 'All';

function formatMoney(amount) {
  return `${settings.currency || '$'}${parseFloat(amount).toFixed(2)}`;
}

function getNairobiDateTime() {
  const options = {
    timeZone: 'Africa/Nairobi',
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
  };
  return new Intl.DateTimeFormat('en-US', options).format(new Date());
}

window.onload = function() {
  const yearCopy = document.getElementById('year-copy');
  if (yearCopy) {
    yearCopy.textContent = new Date().getFullYear();
  }
  syncCustomerStoreData();
  renderCustomerProducts();
  updateCartUI();
};

function syncCustomerStoreData() {
  const logoImg = document.getElementById('store-logo-img');
  if (logoImg) logoImg.src = settings.logoUrl || 'https://placehold.co/100x100';
  
  const navTitle = document.getElementById('store-nav-title');
  if (navTitle) navTitle.textContent = settings.storeName;
  
  const heroTitle = document.getElementById('hero-store-title');
  if (heroTitle) heroTitle.textContent = `Welcome to ${settings.storeName}`;
  
  const heroLoc = document.getElementById('hero-store-location');
  if (heroLoc) heroLoc.innerHTML = `<i class="fa-solid fa-location-dot text-sky-500 mr-1.5"></i> ${settings.location}`;
  
  const footName = document.getElementById('footer-store-name');
  if (footName) footName.textContent = settings.storeName;
  
  const footAddr = document.getElementById('footer-address');
  if (footAddr) footAddr.textContent = settings.location;
  
  const footPhone = document.getElementById('footer-phone');
  if (footPhone) footPhone.textContent = `Phone: ${settings.phone}`;
  
  const footWa = document.getElementById('footer-whatsapp');
  if (footWa) footWa.textContent = `WhatsApp: ${settings.whatsapp}`;
  
  const mapsIframe = document.getElementById('footer-maps-iframe');
  if (mapsIframe && settings.mapsUrl) mapsIframe.src = settings.mapsUrl;
  
  const navWa = document.getElementById('nav-whatsapp-link');
  if (navWa) navWa.href = `https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}`;
  
  const navPhone = document.getElementById('nav-phone-link');
  if (navPhone) navPhone.href = `tel:${settings.phone}`;
  
  const cleanIg = settings.instagram ? settings.instagram.replace('@','').split('/').pop() : '';
  const navIg = document.getElementById('nav-instagram-link');
  if (navIg) navIg.href = `https://ig.me/m/${cleanIg}`;
}

window.renderCustomerProducts = function() {
  const grid = document.getElementById('customer-products-grid');
  const searchInput = document.getElementById('customer-search-input');
  const searchVal = searchInput ? searchInput.value.toLowerCase() : '';
  const emptyState = document.getElementById('no-products-state');
  const categories = ['All', ...new Set(products.map(p => p.category))];
  const catContainer = document.getElementById('category-filter-container');
  
  if (catContainer) {
    catContainer.innerHTML = categories.map(cat => `
      <button onclick="filterCategory('${cat}')" class="px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${selectedCategory === cat ? 'bg-sky-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'}">${cat}</button>
    `).join('');
  }

  const filtered = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchVal) || p.description.toLowerCase().includes(searchVal);
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  if (!grid) return;

  if (filtered.length === 0) {
    grid.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');
  grid.innerHTML = filtered.map(product => `
    <div class="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-md flex flex-col">
      <div class="h-48 overflow-hidden bg-slate-950 cursor-pointer" onclick="openProductDetailModal('${product.id}')">
        <img src="${product.images && product.images.length > 0 ? product.images[0] : 'https://placehold.co/600x400'}" class="w-full h-full object-cover hover:scale-105 transition duration-300">
      </div>
      <div class="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 class="font-bold text-white text-base cursor-pointer" onclick="openProductDetailModal('${product.id}')">${product.title}</h3>
          <p class="text-xs text-slate-400 mt-1 line-clamp-2">${product.description}</p>
        </div>
        <div class="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
          <span class="text-lg font-extrabold text-white">${formatMoney(product.price)}</span>
          <button onclick="addToCart('${product.id}')" class="bg-sky-600 hover:bg-sky-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-md"><i class="fa-solid fa-plus mr-1"></i> Add</button>
        </div>
      </div>
    </div>
  `).join('');
};

window.filterCategory = function(cat) {
  selectedCategory = cat;
  renderCustomerProducts();
};

window.openProductDetailModal = function(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;
  
  document.getElementById('modal-prod-title').textContent = product.title;
  document.getElementById('modal-main-img').src = product.images[0];
  document.getElementById('modal-prod-category').textContent = product.category;
  document.getElementById('modal-prod-price').textContent = formatMoney(product.price);
  document.getElementById('modal-prod-desc').textContent = product.description;
  
  const thumbs = document.getElementById('modal-thumbs-container');
  thumbs.innerHTML = product.images.map(img => `
    <img src="${img}" onclick="document.getElementById('modal-main-img').src='${img}'" class="w-14 h-14 object-cover rounded-lg cursor-pointer border border-slate-800 hover:border-sky-500">
  `).join('');
  
  document.getElementById('modal-add-cart-btn').onclick = () => {
    addToCart(product.id);
    closeProductDetailModal();
  };
  
  document.getElementById('product-detail-modal').classList.remove('hidden');
};

window.closeProductDetailModal = function() {
  document.getElementById('product-detail-modal').classList.add('hidden');
};

window.addToCart = function(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  
  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id: product.id, title: product.title, price: product.price, image: product.images[0], qty: 1 });
  }
  
  localStorage.setItem('Urban Savannah Collection_cart', JSON.stringify(cart));
  updateCartUI();
  showToast(`Added "${product.title}" to cart`);
};

window.updateCartQty = function(productId, change) {
  const item = cart.find(i => i.id === productId);
  if (item) {
    item.qty += change;
    if (item.qty <= 0) {
      cart = cart.filter(i => i.id !== productId);
    }
    localStorage.setItem('Urban Savannah Collection_cart', JSON.stringify(cart));
    updateCartUI();
  }
};

window.updateCartUI = function() {
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const badgeCount = document.getElementById('cart-badge-count');
  if (badgeCount) badgeCount.textContent = totalItems;
  
  const container = document.getElementById('cart-items-container');
  if (!container) return;
  
  if (cart.length === 0) {
    container.innerHTML = `<p class="text-center text-slate-500 py-12 text-xs">Cart is currently empty</p>`;
    document.getElementById('cart-subtotal').textContent = formatMoney(0);
    document.getElementById('cart-delivery-fee').textContent = formatMoney(0);
    document.getElementById('cart-total-price').textContent = formatMoney(0);
    return;
  }
  
  container.innerHTML = cart.map(item => `
    <div class="flex items-center gap-3 pt-3">
      <img src="${item.image}" class="w-12 h-12 object-cover rounded-lg bg-slate-950">
      <div class="flex-1"><h4 class="text-xs font-bold text-white">${item.title}</h4><p class="text-xs text-sky-400 font-bold">${formatMoney(item.price)}</p></div>
      <div class="flex items-center gap-2">
        <button onclick="updateCartQty('${item.id}', -1)" class="w-5 h-5 bg-slate-800 text-slate-300 rounded">-</button>
        <span class="text-xs font-bold text-white">${item.qty}</span>
        <button onclick="updateCartQty('${item.id}', 1)" class="w-5 h-5 bg-slate-800 text-slate-300 rounded">+</button>
      </div>
    </div>
  `).join('');
  
  const subtotal = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
  const deliveryFee = parseFloat(settings.deliveryFee) || 0;
  const total = subtotal + deliveryFee;
  
  document.getElementById('cart-subtotal').textContent = formatMoney(subtotal);
  document.getElementById('cart-delivery-fee').textContent = formatMoney(deliveryFee);
  document.getElementById('cart-total-price').textContent = formatMoney(total);
};

window.toggleCartDrawer = function(open) {
  document.getElementById('cart-drawer-overlay').classList.toggle('hidden', !open);
  document.getElementById('cart-drawer').classList.toggle('translate-x-full', !open);
};

window.openCheckoutModal = function() {
  if (cart.length === 0) {
    showToast("Your cart is empty!");
    return;
  }
  toggleCartDrawer(false);
  document.getElementById('checkout-modal').classList.remove('hidden');
};

window.toggleCheckoutModal = function(open) {
  document.getElementById('checkout-modal').classList.toggle('hidden', !open);
};

window.submitCustomerOrder = function(e) {
  e.preventDefault();
  if (cart.length === 0) return;
  
  const name = document.getElementById('cust-name').value;
  const phone = document.getElementById('cust-phone').value;
  const address = document.getElementById('cust-address').value;
  const timePref = document.getElementById('cust-time').value || 'ASAP';
  const channelEl = document.querySelector('input[name="contact-channel"]:checked');
  const channel = channelEl ? channelEl.value : 'whatsapp';
  
  const nairobiTime = getNairobiDateTime();
  const subtotal = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
  const total = subtotal + parseFloat(settings.deliveryFee || 0);
  
  const newOrder = {
    id: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
    dateTime: nairobiTime,
    customerName: name,
    customerPhone: phone,
    customerAddress: address,
    deliveryTime: timePref,
    items: [...cart],
    total: total,
    status: 'Pending Delivery',
    contactChannel: channel
  };
  
  orders.unshift(newOrder);
  localStorage.setItem('Urban Savannah Collection_orders', JSON.stringify(orders));
  
  cart = [];
  localStorage.setItem('Urban Savannah Collection_cart', JSON.stringify(cart));
  updateCartUI();
  toggleCheckoutModal(false);
  
  const totalQty = newOrder.items.reduce((acc, curr) => acc + curr.qty, 0);
  const greeting = totalQty === 1 ? "Hello, I wish to make the following order" : "Hello, I wish to make the following orders";
  const itemsSummary = newOrder.items.map(i => `${i.title} (Qty: ${i.qty}) - ${formatMoney(i.price * i.qty)}`).join('\n');
  const orderText = `${greeting}:\n\n*Order ID:* #${newOrder.id}\n*Nairobi Time:* ${nairobiTime}\n\n*Customer Details:*\nName: ${name}\nPhone: ${phone}\nAddress: ${address}\nPreferred Time: ${timePref}\n\n*Items Ordered:*\n${itemsSummary}\n\n*TOTAL PAYABLE:* ${formatMoney(total)}`;
  
  if (channel === 'whatsapp') {
    window.open(`https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(orderText)}`, '_blank');
  } else if (channel === 'instagram') {
    navigator.clipboard.writeText(orderText);
    const cleanIg = settings.instagram ? settings.instagram.replace('@','').split('/').pop() : '';
    alert("Order text copied to clipboard! Redirecting to Instagram Direct Messages...");
    window.open(`https://ig.me/m/${cleanIg}`, '_blank');
  } else if (channel === 'tiktok') {
    navigator.clipboard.writeText(orderText);
    const cleanTt = settings.tiktok && settings.tiktok.startsWith('http') ? settings.tiktok : `https://www.tiktok.com/${settings.tiktok}`;
    alert("Order text copied to clipboard! Redirecting to TikTok Messages...");
    window.open(cleanTt, '_blank');
  } else if (channel === 'facebook') {
    navigator.clipboard.writeText(orderText);
    const cleanFb = settings.facebook && settings.facebook.startsWith('http') ? settings.facebook : `https://m.me/${settings.facebook.replace('facebook.com/', '')}`;
    alert("Order text copied to clipboard! Redirecting to Facebook Messenger...");
    window.open(cleanFb, '_blank');
  } else if (channel === 'phone') {
    window.location.href = `tel:${settings.phone}`;
  } else if (channel === 'sms') {
    window.location.href = `sms:${settings.phone}?body=${encodeURIComponent(orderText)}`;
  }
};

window.openLegalModal = function(type) {
  document.getElementById('legal-modal-title').textContent = type === 'terms' ? 'Terms & Conditions' : 'Privacy Policy';
  document.getElementById('legal-modal-content').textContent = type === 'terms' ? settings.terms : settings.privacy;
  document.getElementById('legal-modal').classList.remove('hidden');
};

window.closeLegalModal = function() {
  document.getElementById('legal-modal').classList.add('hidden');
};

window.showToast = function(msg) {
  const toast = document.getElementById('global-toast');
  document.getElementById('toast-message').textContent = msg;
  toast.classList.remove('translate-y-[-100px]', 'opacity-0', 'pointer-events-none');
  setTimeout(() => toast.classList.add('translate-y-[-100px]', 'opacity-0', 'pointer-events-none'), 3000);
};
