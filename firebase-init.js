// --- Firebase Configuration & Initialization (Shared across all pages) ---

const firebaseConfig = {
    apiKey: "AIzaSyBM1NmAkbitESATrLoDEejieWBq7DYnMUM", // Your actual Firebase API key
    authDomain: "notionclonedashboard.firebaseapp.com",
    projectId: "notionclonedashboard",
    storageBucket: "notionclonedashboard.firebasestorage.app",
    messagingSenderId: "759664241290",
    appId: "1:759664241290:web:6013f297f6df262f329b73"
};

// Initialize Firebase, ensuring it's only done once
try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log("Firebase initialized successfully.");
    }

    // Make auth and db globally available for all template scripts
    // This allows your shopping-cart.js, tracker.js, etc. to use them
    window.auth = firebase.auth();
    window.db = firebase.firestore();

} catch (error) {
    console.error("CRITICAL: Firebase SDK initialization failed:", error);
    alert("Could not connect to the database. Please check the console for errors.");
}