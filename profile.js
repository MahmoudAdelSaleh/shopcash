import { db, collection, getDocs, query, where } from './firebase-config.js';
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const auth = getAuth();

// --- DOM ELEMENTS ---
const profileName = document.getElementById('profile-name');
const profileCustomerId = document.getElementById('profile-customerId');
const profilePhone = document.getElementById('profile-phone');
const profileAddress = document.getElementById('profile-address');
const profilePoints = document.getElementById('profile-points');

// --- AUTHENTICATION CHECK ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // User is signed in, fetch and display their data.
        fetchAndDisplayCustomerData(user.phoneNumber);
    } else {
        // No user is signed in, redirect to login.
        window.location.href = 'login-customer.html';
    }
});

// --- DATA FETCHING AND DISPLAY FUNCTION ---
async function fetchAndDisplayCustomerData(phoneNumber) {
    // Show loading state
    profileName.textContent = 'جار التحميل...';
    
    try {
        const q = query(collection(db, "customers"), where("phone", "==", phoneNumber));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const customerData = querySnapshot.docs[0].data();
            
            // Populate the fields with customer data
            profileName.textContent = customerData.name;
            profileCustomerId.textContent = customerData.customerId;
            profilePhone.textContent = customerData.phone;
            profileAddress.textContent = customerData.address;
            profilePoints.textContent = customerData.points || 0;

        } else {
            // Handle case where customer data might be missing
            console.error("Could not find customer data for this phone number!");
            profileName.textContent = 'بيانات غير موجودة';
        }
    } catch (error) {
        console.error("Error fetching customer data:", error);
        profileName.textContent = 'خطأ في تحميل البيانات';
    }
}
