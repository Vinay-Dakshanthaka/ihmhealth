import {
    onAuthStateChanged,
    signOut,
    firestore,
    auth
} from "./assets/repository/initialize.js";
import {
    collection,
    query,
    where,
    getDocs,
    getDoc,
    setDoc,
    updateDoc,
    onSnapshot,
    addDoc,
    deleteDoc,
    getCountFromServer,
    doc
} from "./assets/repository/initialize.js";
import {
    ref,
    uploadBytes
} from "./assets/repository/initialize.js";

var loggedIn = false
var summary = null
let cartList = null
let bill = null
let orderId = generateOrderId()
let productSnapshot = null
const confirmLogoutBtn = document.getElementById("confirmLogoutBtn");

async function postPageLoadFunctions() {
    document.querySelector('.order-id').textContent = orderId
    await updateCart();
    // await fetchNavCategories();
    await postPageLoadAddressAction()
    await updateSummary()
}

/**
 * Necessary event listeners to call after pageload
 * 
 * @author dev
 */
async function postPageLoadEventListener() {
    document.querySelectorAll('.address-option').forEach(input => {
        input.addEventListener('change', changeAddressTab)
    })
    document.querySelector('#rzp-button1').addEventListener('click', payment)
}

function updateCart() {
    return new Promise(async (resolve) => {
        // console.log("from update cart")
        const shownCart = document.querySelector('#shown-cart')

        let cart = await getCart()
        // console.log(cart.length)

        if (cart.length) {
            document.querySelectorAll('.cart').forEach(ele => ele.textContent = cart.length)
        }
        else {
            document.querySelectorAll('.cart').forEach(ele => ele.textContent = 0)
        }
        // console.log("resolve")
        resolve()
    })
}