import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAb7KDEVZQsCGFtwpFIx1vtjLYFArOhwMI",
  authDomain: "skylixfm-shop-df92f.firebaseapp.com",
  projectId: "skylixfm-shop-df92f",
  storageBucket: "skylixfm-shop-df92f.firebasestorage.app",
  messagingSenderId: "1023371313049",
  appId: "1:1023371313049:web:a7f59f04207483dd511d08"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

function clean(value) {
  return JSON.parse(JSON.stringify(value));
}

async function readCollection(name) {
  const snap = await getDocs(collection(db, name));
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }));
}

async function writeCollection(name, items) {
  await Promise.all(items.map((item, index) => {
    const id = String(item.id || crypto.randomUUID());
    return setDoc(doc(db, name, id), clean({ ...item, id, order: item.order ?? index }));
  }));
}

export async function loadProducts(defaultProducts) {
  const remote = await readCollection("products");
  return remote.length
    ? remote.sort((a, b) => Number(a.order ?? 9999) - Number(b.order ?? 9999))
    : defaultProducts;
}

export async function saveProducts(products) {
  await writeCollection("products", products);
}

export async function saveProduct(product) {
  await setDoc(doc(db, "products", String(product.id)), clean(product));
}

export async function deleteProduct(id) {
  await deleteDoc(doc(db, "products", String(id)));
}

export async function loadOrders() {
  const remote = await readCollection("orders");
  return remote.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
}

export async function saveOrder(order) {
  await setDoc(doc(db, "orders", String(order.id)), clean(order));
}

export async function saveOrders(orders) {
  await writeCollection("orders", orders);
}

export async function clearOrders() {
  const orders = await readCollection("orders");
  await Promise.all(orders.map((order) => deleteDoc(doc(db, "orders", String(order.id)))));
}

export async function loadKeys() {
  const remote = await readCollection("keys");
  return remote.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
}

export async function saveKeys(keys) {
  await writeCollection("keys", keys);
}

export async function saveKey(key) {
  await setDoc(doc(db, "keys", String(key.id)), clean(key));
}

export async function deleteKey(id) {
  await deleteDoc(doc(db, "keys", String(id)));
}
