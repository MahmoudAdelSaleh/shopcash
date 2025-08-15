import { db, collection, addDoc, getDocs, query, where, orderBy } from './firebase-config.js';
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const auth = getAuth();

// --- STATE MANAGEMENT ---
let currentUser = null; // To hold auth user info
let currentCustomerData = null; // To hold Firestore customer data
let allItems = []; // To cache items from Firestore
let allCategories = ["الكل"]; // To hold categories, starting with an "All" option
let cart = []; // The shopping cart

// --- DOM ELEMENTS ---
const customerNamePlaceholder = document.getElementById('customer-name-placeholder');
const categoriesBar = document.getElementById('categories-bar');
const productsGrid = document.getElementById('products-grid');
const cartCount = document.getElementById('cart-count');
const cartItemsList = document.getElementById('cart-items-list');
const cartTotal = document.getElementById('cart-total');
const placeOrderBtn = document.getElementById('place-order-btn');
const logoutBtn = document.getElementById('logout-btn');


// --- AUTHENTICATION CHECK ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // User is signed in.
        currentUser = user;
        await fetchCustomerData(user.phoneNumber);
        await fetchData(); // Fetch categories and products
    } else {
        // No user is signed in. Redirect to login.
        console.log("No user signed in. Redirecting to login.");
        window.location.href = 'login-customer.html';
    }
});


// --- DATA FETCHING FUNCTIONS ---
async function fetchCustomerData(phoneNumber) {
    const q = query(collection(db, "customers"), where("phone", "==", phoneNumber));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        currentCustomerData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
        customerNamePlaceholder.textContent = currentCustomerData.name.split(' ')[0]; // Show first name
    } else {
        // This case should ideally not happen if registration is done correctly
        console.error("Could not find customer data for this phone number!");
        signOut(auth); // Log out user if their data is missing
    }
}

async function fetchData() {
    // Fetch Categories (assuming a 'categories' collection exists)
    // For now, we will use hardcoded categories and later switch to dynamic ones
    // const categoriesSnapshot = await getDocs(collection(db, "categories"));
    // categoriesSnapshot.forEach(doc => allCategories.push(doc.data().name));
    
    // Fetch Items
    const itemsSnapshot = await getDocs(query(collection(db, "items"), orderBy("name")));
    allItems = itemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Extract categories from items as a temporary solution
    const itemCategories = new Set(allItems.map(item => item.category));
    allCategories.push(...itemCategories);

    // Initial render
    renderCategories();
    renderProducts();
}


// --- RENDER FUNCTIONS ---
function renderCategories() {
    categoriesBar.innerHTML = '';
    allCategories.forEach(category => {
        const button = document.createElement('button');
        button.textContent = category;
        button.dataset.category = category;
        if (category === "الكل") button.classList.add('active');
        button.addEventListener('click', () => {
            document.querySelector('#categories-bar button.active').classList.remove('active');
            button.classList.add('active');
            renderProducts(category);
        });
        categoriesBar.appendChild(button);
    });
}

function renderProducts(filterCategory = "الكل") {
    productsGrid.innerHTML = '';
    const filteredItems = filterCategory === "الكل" 
        ? allItems 
        : allItems.filter(item => item.category === filterCategory);
    
    filteredItems.forEach(item => {
        if (item.stock > 0) { // Only show items that are in stock
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <h3>${item.name}</h3>
                <div class="price">${item.price.toFixed(2)} ج.م</div>
                <button class="btn-small btn-success add-to-cart-btn" data-id="${item.id}">إضافة للسلة</button>
            `;
            productsGrid.appendChild(card);
        }
    });
}

function renderCart() {
    cartItemsList.innerHTML = '';
    let total = 0;
    cart.forEach(cartItem => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${cartItem.name} (x${cartItem.qty})</span>
            <span>${(cartItem.price * cartItem.qty).toFixed(2)} ج.م</span>
        `;
        cartItemsList.appendChild(li);
        total += cartItem.price * cartItem.qty;
    });
    cartTotal.textContent = total.toFixed(2);
    cartCount.textContent = cart.reduce((acc, item) => acc + item.qty, 0);
    placeOrderBtn.disabled = cart.length === 0;
}


// --- EVENT LISTENERS & LOGIC ---
productsGrid.addEventListener('click', (e) => {
    if (e.target.classList.contains('add-to-cart-btn')) {
        const itemId = e.target.dataset.id;
        addToCart(itemId);
    }
});

function addToCart(itemId) {
    const itemToAdd = allItems.find(item => item.id === itemId);
    if (!itemToAdd) return;

    const existingCartItem = cart.find(item => item.id === itemId);
    if (existingCartItem) {
        existingCartItem.qty++;
    } else {
        cart.push({
            id: itemToAdd.id,
            name: itemToAdd.name,
            price: itemToAdd.price,
            qty: 1
        });
    }
    renderCart();
}

placeOrderBtn.addEventListener('click', async () => {
    if (cart.length === 0 || !currentCustomerData) return;

    const orderData = {
        customerId: currentCustomerData.id,
        customerName: currentCustomerData.name,
        customerPhone: currentCustomerData.phone,
        items: cart,
        total: parseFloat(cartTotal.textContent),
        status: 'pending', // pending -> preparing -> completed
        createdAt: new Date()
    };

    try {
        await addDoc(collection(db, "orders"), orderData);
        alert("تم إرسال طلبك بنجاح! سيقوم المدير بمراجعته.");
        cart = []; // Clear the cart
        renderCart(); // Re-render to show it's empty
    } catch (error) {
        console.error("Error placing order: ", error);
        alert("حدث خطأ أثناء إرسال الطلب.");
    }
});

logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => {
        console.log("User signed out.");
        // The onAuthStateChanged listener will automatically redirect to the login page.
    }).catch((error) => {
        console.error("Sign out error", error);
    });
});
