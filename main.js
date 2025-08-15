import { db, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, writeBatch, where, getDocs } from './firebase-config.js';

document.addEventListener("DOMContentLoaded", () => {
    // #region Global Variables and DOM Elements
    const DOM = {
        // App & Auth
        appContainer: document.getElementById("app-container"),
        loginContainer: document.getElementById("login-container"),
        loginForm: document.getElementById("login-form"),
        usernameInput: document.getElementById("usernameInput"),
        passwordInput: document.getElementById("passwordInput"),
        logoutBtn: document.getElementById("logoutBtn"),
        navButtons: document.querySelectorAll("nav button"),
        sections: document.querySelectorAll("main section"),
        notificationContainer: document.getElementById("notification-container"),
        
        // Items & Categories
        itemCodeInput: document.getElementById("itemCode"),
        itemNameInput: document.getElementById("itemName"),
        itemUnitInput: document.getElementById("itemUnit"),
        itemPriceInput: document.getElementById("itemPrice"),
        itemStockInput: document.getElementById("itemStock"),
        itemCategorySelect: document.getElementById("itemCategorySelect"),
        filterCategorySelect: document.getElementById("filterCategorySelect"),
        saveItemBtn: document.getElementById("saveItemBtn"),
        itemsTable: document.getElementById("itemsTable"),
        categoryNameInput: document.getElementById("categoryNameInput"),
        saveCategoryBtn: document.getElementById("saveCategoryBtn"),
        clearCategoryFormBtn: document.getElementById("clearCategoryFormBtn"),
        categoriesList: document.getElementById("categoriesList"),

        // Customers
        newCustomerNameInput: document.getElementById("newCustomerName"),
        newCustomerPhoneInput: document.getElementById("newCustomerPhone"),
        newCustomerAddressInput: document.getElementById("newCustomerAddress"),
        newCustomerNotesInput: document.getElementById("newCustomerNotes"),
        saveCustomerBtn: document.getElementById("saveCustomerBtn"),
        customersList: document.getElementById("customersList"),
        customerStatementSection: document.getElementById("customerStatement"),
        statementCustomerName: document.getElementById("statementCustomerName"),
        statementDetails: document.getElementById("statementDetails"),
        backToCustomersBtn: document.getElementById("backToCustomersBtn"),

        // Sales
        customerNameInput: document.getElementById("customerName"),
        customerSuggestionsDiv: document.getElementById("customerSuggestions"),
        searchItemInput: document.getElementById("searchItem"),
        searchResultsDiv: document.getElementById("searchResults"),
        quantitySelect: document.getElementById("quantitySelect"),
        addToInvoiceBtn: document.getElementById("addToInvoiceBtn"),
        invoiceTable: document.getElementById("invoiceTable"),
        invoiceTotalSpan: document.getElementById("invoiceTotal"),
        saveInvoiceBtn: document.getElementById("saveInvoiceBtn"),
        printInvoiceBtn: document.getElementById("printInvoiceBtn"),
        paymentMethodSelect: document.getElementById("paymentMethodSelect"),
        amountPaidInput: document.getElementById("amountPaidInput"),
        changeTextSpan: document.getElementById("changeText"),
        changeAmountSpan: document.getElementById("changeAmount"),

        // Invoices & Reports
        invoicesList: document.getElementById("invoicesList"),
        salesSummaryTable: document.getElementById("salesSummaryTable"),
        totalSalesAmount: document.getElementById("totalSalesAmount"),
        summaryGroupSelect: document.getElementById("summaryGroupSelect"),
        bestSellingItemsDiv: document.getElementById("bestSellingItems"),
        
        // Users
        usersList: document.getElementById("usersList"),
        newUsernameInput: document.getElementById("newUsernameInput"),
        newUserPasswordInput: document.getElementById("newUserPasswordInput"),
        saveUserBtn: document.getElementById("saveUserBtn"),
        changePinBtn: document.getElementById("changePinBtn"),
        oldPinInput: document.getElementById("oldPinInput"),
        newPinInput: document.getElementById("newPinInput"),
    };

    let appState = {
        items: [],       
        invoices: [],    
        customers: [],   
        categories: [],
        users: [],       
        adminPIN: null,  
        currentUser: null,
        currentInvoice: [],
        editingItemId: null,      
        editingCustomerId: null,
        editingUserId: null,      
        editingCategoryId: null,
        selectedItem: null,
        selectedCustomer: null,
        unsubscribe: {}
    };
    // #endregion

    // #region Utility Functions (Helpers)
    const Helpers = {
        showNotification: (message, duration = 3000) => {
            const notification = document.createElement("div");
            notification.className = "notification";
            notification.textContent = message;
            DOM.notificationContainer.appendChild(notification);
            setTimeout(() => notification.classList.add("show"), 10);
            setTimeout(() => {
                notification.classList.remove("show");
                setTimeout(() => notification.remove(), 500);
            }, duration);
        },
        switchTab: (tabId) => {
            DOM.sections.forEach(s => s.classList.remove("active"));
            document.getElementById(tabId)?.classList.add("active");
             if (tabId === "items") { ItemsController.render(); CategoriesController.render(); }
             if (tabId === "customers") CustomersController.render();
             if (tabId === "invoices") ReportsController.renderInvoices();
             if (tabId === "summary") ReportsController.renderSummary();
             if (tabId === "users") UsersController.render();
        },
        updateNavButtons: (activeButton) => {
            DOM.navButtons.forEach(btn => btn.classList.remove("active"));
            activeButton.classList.add("active");
        },
        clearItemForm: () => {
            DOM.itemCodeInput.value = "";
            DOM.itemNameInput.value = "";
            DOM.itemUnitInput.value = "";
            DOM.itemPriceInput.value = "";
            DOM.itemStockInput.value = "";
            DOM.itemCategorySelect.value = "";
            appState.editingItemId = null;
            DOM.saveItemBtn.innerHTML = '<i class="fas fa-save"></i> حفظ الصنف';
        },
        clearCustomerForm: () => {
            DOM.newCustomerNameInput.value = "";
            DOM.newCustomerPhoneInput.value = "";
            DOM.newCustomerAddressInput.value = "";
            DOM.newCustomerNotesInput.value = "";
            appState.editingCustomerId = null;
            DOM.saveCustomerBtn.innerHTML = '<i class="fas fa-save"></i> حفظ العميل';
            DOM.saveCustomerBtn.disabled = false;
        },
        clearCategoryForm: () => {
            DOM.categoryNameInput.value = "";
            appState.editingCategoryId = null;
            DOM.saveCategoryBtn.innerHTML = '<i class="fas fa-save"></i> حفظ الفئة';
        },
        calculateChange: () => {
            const total = parseFloat(DOM.invoiceTotalSpan.textContent) || 0;
            const paid = parseFloat(DOM.amountPaidInput.value) || 0;
            const change = paid - total;
            DOM.changeTextSpan.textContent = change >= 0 ? "الباقي للعميل:" : "المطلوب منه:";
            DOM.changeAmountSpan.textContent = Math.abs(change).toFixed(2);
        },
        convertToArabicAndEnglishDigits: (text) => {
            if (!text) return "";
            const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
            return text.toString().replace(/[٠-٩]/g, d => arabicDigits.indexOf(d));
        },
        getWeekNumber: (d) => {
            d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
            d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
            return [d.getUTCFullYear(), Math.ceil((((d - yearStart) / 86400000) + 1) / 7)];
        },
        generatePrintContent: (invoice) => { /* ... (Function content is unchanged) ... */ },
        printContent: (content) => { /* ... (Function content is unchanged) ... */ },
    };
    // #endregion

    // #region Authentication Controller
    const Auth = {
      login: async (username, password) => {
        const pin = Helpers.convertToArabicAndEnglishDigits(password);
        const adminConfig = await getDoc(doc(db, "config", "admin"));
        appState.adminPIN = adminConfig.exists() ? adminConfig.data().pin : "790707071";

        if (pin === appState.adminPIN) {
          appState.currentUser = { username: "المدير العام", role: "general_manager" };
          localStorage.setItem('currentUser', JSON.stringify(appState.currentUser));
          Helpers.showNotification("تم تسجيل الدخول كمدير عام.");
          Auth.showApp(appState.currentUser.role);
          return;
        }

        const q = query(collection(db, "users"), where("username", "==", username), where("password", "==", pin));
        const userSnapshot = await getDocs(q);
        
        if (!userSnapshot.empty) {
            const user = {id: userSnapshot.docs[0].id, ...userSnapshot.docs[0].data()};
            appState.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            Helpers.showNotification(`أهلاً بك, ${user.username}!`);
            Auth.showApp(user.role);
        } else {
          Helpers.showNotification("اسم المستخدم أو كلمة المرور غير صحيحة.", 5000);
        }
      },
      logout: () => {
        appState.currentUser = null;
        localStorage.removeItem('currentUser');
        DOM.appContainer.style.display = "none";
        DOM.loginContainer.style.display = "flex";
        DOM.usernameInput.value = "";
        DOM.passwordInput.value = "";
      },
      showApp: (role) => {
        DOM.loginContainer.style.display = "none";
        DOM.appContainer.style.display = "block";
        const usersTab = document.querySelector('[data-tab="users"]');
        usersTab.classList.toggle("hidden", role !== "general_manager");
        document.querySelector('[data-tab="sales"]').click();
      }
    };
    // #endregion

    // #region Categories Controller
    const CategoriesController = {
        render: () => {
            DOM.categoriesList.innerHTML = appState.categories.map(cat => `
                <span class="tag" data-id="${cat.id}" data-name="${cat.name}">
                    ${cat.name}
                    <i class="fas fa-trash-alt delete-tag" data-id="${cat.id}" data-name="${cat.name}"></i>
                </span>
            `).join("");

            const optionsHtml = appState.categories.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join("");
            DOM.itemCategorySelect.innerHTML = `<option value="">اختر الفئة</option>${optionsHtml}`;
            DOM.filterCategorySelect.innerHTML = `<option value="all">جميع الفئات</option>${optionsHtml}`;
        },
        save: async () => {
            const name = DOM.categoryNameInput.value.trim();
            if (!name) return Helpers.showNotification("اسم الفئة لا يمكن أن يكون فارغًا.");

            const isDuplicate = appState.categories.some(c => c.name.toLowerCase() === name.toLowerCase() && c.id !== appState.editingCategoryId);
            if(isDuplicate) return Helpers.showNotification("هذه الفئة موجودة بالفعل.");

            const categoryData = { name };
            try {
                if(appState.editingCategoryId) {
                    await updateDoc(doc(db, "categories", appState.editingCategoryId), categoryData);
                    Helpers.showNotification("تم تعديل الفئة بنجاح.");
                } else {
                    await addDoc(collection(db, "categories"), { ...categoryData, createdAt: serverTimestamp() });
                    Helpers.showNotification("تمت إضافة الفئة بنجاح.");
                }
                Helpers.clearCategoryForm();
            } catch (error) {
                console.error("Error saving category:", error);
                Helpers.showNotification("حدث خطأ أثناء حفظ الفئة.");
            }
        },
        edit: (id, name) => {
            DOM.categoryNameInput.value = name;
            appState.editingCategoryId = id;
            DOM.saveCategoryBtn.innerHTML = '<i class="fas fa-edit"></i> تعديل الفئة';
        },
        delete: async (id, name) => {
            const itemsWithCategory = query(collection(db, "items"), where("category", "==", name));
            const snapshot = await getDocs(itemsWithCategory);

            if (!snapshot.empty) {
                return Helpers.showNotification(`لا يمكن حذف الفئة "${name}" لوجود أصناف مرتبطة بها.`, 5000);
            }

            if (confirm(`هل أنت متأكد من حذف الفئة "${name}"؟`)) {
                try {
                    await deleteDoc(doc(db, "categories", id));
                    Helpers.showNotification("تم حذف الفئة بنجاح.");
                    Helpers.clearCategoryForm(); // Clear form in case it was being edited
                } catch (error) {
                    console.error("Error deleting category:", error);
                    Helpers.showNotification("حدث خطأ أثناء الحذف.");
                }
            }
        }
    };
    // #endregion

    // #region Items Controller (Updated)
    const ItemsController = {
        render: () => {
            const filterCategory = DOM.filterCategorySelect.value;
            const filteredItems = filterCategory === "all" 
                ? appState.items 
                : appState.items.filter(item => item.category === filterCategory);

            DOM.itemsTable.innerHTML = filteredItems.map(item => `
                <tr>
                    <td>${item.code}</td>
                    <td>${item.name}</td>
                    <td>${item.unit}</td>
                    <td>${parseFloat(item.price).toFixed(2)}</td>
                    <td>${item.stock}</td>
                    <td>${item.category || 'غير محدد'}</td>
                    <td><button class="btn-small btn-warning edit-item-btn" data-id="${item.id}"><i class="fas fa-edit"></i></button></td>
                    <td><button class="btn-small btn-danger delete-item-btn" data-id="${item.id}"><i class="fas fa-trash-alt"></i></button></td>
                </tr>
            `).join("");
        },
        save: async () => {
            // Unchanged from previous version, as it already reads category from the select dropdown.
            const { itemCodeInput, itemNameInput, itemUnitInput, itemPriceInput, itemStockInput, itemCategorySelect } = DOM;
            const code = itemCodeInput.value.trim();
            const name = itemNameInput.value.trim();
            const unit = itemUnitInput.value.trim();
            const price = parseFloat(Helpers.convertToArabicAndEnglishDigits(itemPriceInput.value));
            const stock = parseInt(Helpers.convertToArabicAndEnglishDigits(itemStockInput.value));
            const category = itemCategorySelect.value;

            if (!code || !name || isNaN(price) || isNaN(stock) || !category) {
                return Helpers.showNotification("يرجى إدخال جميع البيانات بشكل صحيح واختيار الفئة.", 5000);
            }
            // ... (rest of the save logic is the same)
        },
        edit: (id) => {
            const item = appState.items.find(i => i.id === id);
            if (!item) return;
            DOM.itemCodeInput.value = item.code;
            DOM.itemNameInput.value = item.name;
            DOM.itemUnitInput.value = item.unit;
            DOM.itemPriceInput.value = item.price;
            DOM.itemStockInput.value = item.stock;
            DOM.itemCategorySelect.value = item.category || "";
            appState.editingItemId = id;
            DOM.saveItemBtn.innerHTML = '<i class="fas fa-edit"></i> تعديل الصنف';
        },
        delete: async (id) => { /* Unchanged */ }
    };
    // #endregion

    // #region Customers Controller (Updated)
    const CustomersController = {
        render: () => {
            DOM.customersList.style.display = 'block';
            DOM.customerStatementSection.style.display = 'none';
            DOM.customersList.innerHTML = appState.customers.map(cust => `
                <div class="customer-card">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                        <div>
                            <b>${cust.name}</b> <small>(الكود: ${cust.customerId})</small><br/>
                            <div class="details">
                                <span><i class="fas fa-phone"></i> ${cust.phone || 'لا يوجد'}</span>
                                <span><i class="fas fa-map-marker-alt"></i> ${cust.address || 'لا يوجد'}</span>
                                <span><i class="fas fa-star"></i> <b>${cust.points || 0}</b> نقطة</span>
                            </div>
                        </div>
                        <div class="flex-container">
                            <button class="btn-small btn-success show-statement-btn" data-id="${cust.id}"><i class="fas fa-clipboard-list"></i> كشف حساب</button>
                            <button class="btn-small btn-warning edit-customer-btn" data-id="${cust.id}"><i class="fas fa-edit"></i></button>
                            <button class="btn-small btn-danger delete-customer-btn" data-id="${cust.id}"><i class="fas fa-trash-alt"></i></button>
                        </div>
                    </div>
                </div>
            `).join("");
        },
        saveCustomer: async () => {
            DOM.saveCustomerBtn.disabled = true;
            const name = DOM.newCustomerNameInput.value.trim();
            const phone = DOM.newCustomerPhoneInput.value.trim();
            const address = DOM.newCustomerAddressInput.value.trim();
            const notes = DOM.newCustomerNotesInput.value.trim();
            
            if (!name || !phone) {
                Helpers.showNotification("يجب إدخال الاسم ورقم الهاتف على الأقل.", 5000);
                DOM.saveCustomerBtn.disabled = false;
                return;
            }

            const customerData = { name, phone, address, notes };

            try {
                if (appState.editingCustomerId) { // Editing existing customer
                    await updateDoc(doc(db, "customers", appState.editingCustomerId), customerData);
                    Helpers.showNotification("تم تعديل العميل بنجاح.");
                } else { // Adding a new customer
                    // Generate a unique 5-digit code
                    let customerId;
                    let isUnique = false;
                    while(!isUnique) {
                        customerId = Math.floor(10000 + Math.random() * 90000).toString();
                        const q = query(collection(db, "customers"), where("customerId", "==", customerId));
                        const snapshot = await getDocs(q);
                        if (snapshot.empty) isUnique = true;
                    }

                    const newCustomerData = { ...customerData, customerId, points: 0, createdAt: serverTimestamp() };
                    await addDoc(collection(db, "customers"), newCustomerData);
                    Helpers.showNotification("تم حفظ العميل بنجاح.");
                }
                Helpers.clearCustomerForm();
            } catch (error) {
                console.error("Error saving customer: ", error);
                Helpers.showNotification("حدث خطأ أثناء حفظ العميل.", 5000);
                DOM.saveCustomerBtn.disabled = false;
            }
        },
        edit: (id) => {
            const customer = appState.customers.find(c => c.id === id);
            if (!customer) return;
            DOM.newCustomerNameInput.value = customer.name;
            DOM.newCustomerPhoneInput.value = customer.phone;
            DOM.newCustomerAddressInput.value = customer.address || '';
            DOM.newCustomerNotesInput.value = customer.notes || '';
            appState.editingCustomerId = id;
            DOM.saveCustomerBtn.innerHTML = '<i class="fas fa-edit"></i> تعديل العميل';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        deleteCustomer: async (id) => { /* Unchanged */ }
    };
    // #endregion

    // #region Sales & Other Controllers (Mostly Unchanged)
    const SalesController = { /* ... No changes needed yet ... */ };
    const ReportsController = { /* ... No changes needed yet ... */ };
    const UsersController = { /* ... No changes needed yet ... */ };
    // #endregion

    // #region App Logic & Event Listeners
    const App = {
        init: () => {
            if ('serviceWorker' in navigator) { /* ... Unchanged ... */ }
            App.bindEvents();
            App.listenToFirebase();

            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                appState.currentUser = JSON.parse(savedUser);
                Helpers.showNotification(`أهلاً بعودتك, ${appState.currentUser.username}!`);
                Auth.showApp(appState.currentUser.role);
            }
            for (let i = 1; i <= 100; i++) {
                DOM.quantitySelect.appendChild(new Option(i, i));
            }
        },

        listenToFirebase: () => {
            Object.values(appState.unsubscribe).forEach(unsub => unsub());

            // NEW: Listen to Categories
            appState.unsubscribe.categories = onSnapshot(query(collection(db, "categories"), orderBy("name")), snapshot => {
                appState.categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                CategoriesController.render();
            });

            // UPDATED LISTENERS (no code change, just context)
            appState.unsubscribe.items = onSnapshot(query(collection(db, "items"), orderBy("name")), snapshot => {
                appState.items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                if (document.getElementById('items').classList.contains('active')) ItemsController.render();
            });

            appState.unsubscribe.customers = onSnapshot(query(collection(db, "customers"), orderBy("createdAt", "desc")), snapshot => {
                appState.customers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                if (document.getElementById('customers').classList.contains('active')) CustomersController.render();
            });
            // ... Other listeners are unchanged ...
        },

        bindEvents: () => {
            // ... Auth, Nav, Sales, Reports, Users event listeners are mostly unchanged ...
            
            // NEW: Category Events
            DOM.saveCategoryBtn.addEventListener("click", CategoriesController.save);
            DOM.clearCategoryFormBtn.addEventListener("click", Helpers.clearCategoryForm);
            DOM.categoriesList.addEventListener("click", (e) => {
                const target = e.target;
                const tag = target.closest('.tag');
                if (target.classList.contains('delete-tag')) {
                    const id = target.dataset.id;
                    const name = target.dataset.name;
                    CategoriesController.delete(id, name);
                } else if (tag) {
                    const id = tag.dataset.id;
                    const name = tag.dataset.name;
                    CategoriesController.edit(id, name);
                }
            });

            // UPDATED: Customer Events
            DOM.saveCustomerBtn.addEventListener("click", CustomersController.saveCustomer);
            DOM.customersList.addEventListener("click", (e) => {
                const button = e.target.closest("button");
                if (!button) return;
                const id = button.dataset.id;
                if (button.classList.contains("edit-customer-btn")) CustomersController.edit(id);
                else if (button.classList.contains("delete-customer-btn")) CustomersController.deleteCustomer(id);
                else if (button.classList.contains("show-statement-btn")) CustomersController.showStatement(id);
            });
            // Other event listeners are unchanged.
        }
    };

    App.init();
});

