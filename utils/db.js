// utils/db.js
import * as SQLite from 'expo-sqlite';

let db;

export const initDB = async () => {
  db = await SQLite.openDatabaseAsync('billing.db');

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      date TEXT,
      serial TEXT,
      total REAL,
      items TEXT
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      unit TEXT NOT NULL
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      type TEXT NOT NULL, -- 'credit' or 'debit'
      amount REAL NOT NULL,
      date TEXT NOT NULL
    );
  `);
  await db.execAsync(`
  CREATE TABLE IF NOT EXISTS cash_received (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    date TEXT NOT NULL
  );
 `);
};

export const insertCustomer = async (name, phone, email) => {
  await db.runAsync(
    `INSERT INTO customers (name, phone, email) VALUES (?, ?, ?)`,
    [name, phone, email]
  );
};

export const fetchCustomers = async () => {
  const result = await db.getAllAsync(`SELECT * FROM customers`);
  return result;
};

export const getDB = () => {
  if (!db) {
    throw new Error("❌ Database is not initialized. Did you call initDB()?");
  }
  return db;
};

export const insertItem = async (name, price, unit) => {
  await db.runAsync(`INSERT INTO items (name, price, unit) VALUES (?, ?, ?)`, [name, price, unit]);
};

export const fetchItems = async () => {
  const result = await db.getAllAsync(`SELECT * FROM items`);
  return result;
};

export const updateItem = async (id, price, unit) => {
  await db.runAsync(`UPDATE items SET price = ?, unit = ? WHERE id = ?`, [price, unit, id]);
};

export const deleteItem = async (id) => {
  await db.runAsync(`DELETE FROM items WHERE id = ?`, [id]);
};

export const insertTransaction = async (customerId, type, amount) => {
  const date = new Date().toISOString().split("T")[0];
  await db.runAsync(
    `INSERT INTO transactions (customer_id, type, amount, date) VALUES (?, ?, ?, ?)`,
    [customerId, type, amount, date]
  );
};

export const fetchTransactions = async (customerId) => {
  const result = await db.getAllAsync(
    `SELECT * FROM transactions WHERE customer_id = ? ORDER BY date DESC`,
    [customerId]
  );
  return result;
};

export const insertCashReceived = async (customerId, amount) => {
  const date = new Date().toISOString().split("T")[0];
  await db.runAsync(
    `INSERT INTO cash_received (customer_id, amount, date) VALUES (?, ?, ?)`,
    [customerId, amount, date]
  );
};

export const fetchCashReceived = async (customerId) => {
  const result = await db.getAllAsync(
    `SELECT * FROM cash_received WHERE customer_id = ? ORDER BY date DESC`,
    [customerId]
  );
  return result;
};