import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Button, StyleSheet } from 'react-native';
import { getDB } from '../utils/db';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Modal, TextInput, Alert, ScrollView } from 'react-native';

export default function CustomerDetails({ route, navigation }) {
  const { customerId } = route.params;
  const [customer, setCustomer] = useState(null);
  const [bills, setBills] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [txnType, setTxnType] = useState('');
  const [txnAmount, setTxnAmount] = useState('');

  
const loadDetails = async () => {
  try {
    const db = getDB();
    const [cust] = await db.getAllAsync(`SELECT * FROM customers WHERE id = ?`, [customerId]);
    const billData = await db.getAllAsync(`SELECT * FROM bills WHERE customer_id = ?`, [customerId]);
    const transactions = await fetchTransactions(customerId);
    const cashList = await fetchCashReceived(customerId); // 🔥 NEW

    if (!cust) {
      console.log("❌ No customer found with ID", customerId);
      return;
    }

    const balance = transactions.reduce((total, txn) => {
      return txn.type === 'credit' ? total + txn.amount : total - txn.amount;
    }, 0);

    setCustomer({ ...cust, balance });
    setBills(billData.sort((a, b) => b.id - a.id));
    setCashHistory(cashList); // ✅ SET CASH HISTORY
  } catch (err) {
    console.error("❌ Error loading customer details:", err);
  }
  };
  const insertCashReceived = async (customerId, amount) => {
  const db = getDB();
  const date = new Date().toISOString().split("T")[0];
  await db.runAsync(
    `INSERT INTO cash_received (customer_id, amount, date) VALUES (?, ?, ?)`,
    [customerId, amount, date]
  );
  };
  const fetchCashReceived = async (customerId) => {
  const db = getDB();
  const result = await db.getAllAsync(
    `SELECT * FROM cash_received WHERE customer_id = ? ORDER BY date DESC`,
    [customerId]
  );
  return result;
  };
  const [cashHistory, setCashHistory] = useState([]); // 🔥 NEW
  useEffect(() => {
  loadDetails();
  }, [customerId]);
    const fetchTransactions = async (customerId) => {
    const db = getDB();
    const result = await db.getAllAsync(
      `SELECT * FROM transactions WHERE customer_id = ? ORDER BY date DESC`,
        [customerId]
    );
    return result;
    };

  if (!customer) {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>🔄 Loading customer profile...</Text>
        </View>
    );
 }
  const regeneratePDF = async (bill) => {
  const formatDate = (isoDateStr) => {
    const [yyyy, mm, dd] = isoDateStr.split('-');
    return `${dd}-${mm}-${yyyy}`;
  };
  const billItems = JSON.parse(bill.items) || [];
  const customerName = customer?.name || 'Customer';
  const serial = bill.serial;
  const billDate = bill.date;
  let labourCharge = 0;
  let oldBal = 0;

  // Extract optional charges if present
  const filteredItems = billItems.filter(item => {
    if (item.name.toLowerCase() === 'labour') {
      labourCharge = item.price;
      return false;
    }
    if (item.name.toLowerCase() === 'old balance') {
      oldBal = item.price;
      return false;
    }
    return true;
  });

  const grandTotal = filteredItems.reduce((sum, item) => sum + item.price, 0) + labourCharge + oldBal;

  const htmlContent = `
    <html>
    <head>
      <title>${customerName}_${billDate}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .header { text-align: center; margin-bottom: 10px; }
        .header h1 { margin: 0; font-size: 30px; color: #007bff; }
        .subheading { font-size: 18px; color: #333; }
        .customer-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 15px 0;
          font-size: 16px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th, td {
          font-size: 18px;
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f4f4f4;
        }
        .total {
          font-size: 1.5em;
          font-weight: bold;
          text-align: right;
          margin-top: 20px;
        }
      </style>
      </head>
      <body>
      <div class="header">
        <h1>KALAPOTH FLOUR MILLS</h1>
        <div class="subheading">WEST MUDICKAL , PH: 9846310540</div>
      </div><br>
      <div class="customer-info">
        <div><strong>CUSTOMER:</strong> ${customerName}</div>
        <div><strong>DATE:</strong> ${formatDate(billDate)}</div>
        <div><strong>BILL NO:</strong> ${serial}</div>
      </div><br>
      <table>
        <thead>
          <tr>
            <th>ITEM</th>
            <th>RATE</th>
            <th>QUANTITY</th>
            <th>PRICE</th>
          </tr>
        </thead>
        <tbody>
          ${filteredItems.map(item => `
            <tr>
              <td>${item.name}</td>
              <td>₹${item.unit === 'g' ? (item.price * 1000 / item.qty).toFixed(2) : item.price / item.qty}</td>
              <td>${item.qty} ${item.unit || ''}</td>
              <td>₹${item.price}</td>
            </tr>`).join('')}

          ${labourCharge > 0 ? `
            <tr>
              <td>Labour</td><td>-</td><td>-</td><td>₹${labourCharge.toFixed(2)}</td>
            </tr>` : ''}

          ${oldBal > 0 ? `
            <tr>
              <td>Old Balance</td><td>-</td><td>-</td><td>₹${oldBal.toFixed(2)}</td>
            </tr>` : ''}
        </tbody>
      </table>

      <div class="total">Total: ₹${grandTotal.toFixed(2)}</div>
    </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    await Sharing.shareAsync(uri);
  } catch (err) {
    console.error("PDF Regeneration Error:", err);
    alert("Error generating PDF: " + err.message);
  }
  };

    const openTransactionModal = (type) => {
      setTxnType(type); // 'credit' or 'debit'
    setTxnAmount('');
    setModalVisible(true);
    };

    const confirmDeleteCash = (cashId) => {
  Alert.alert(
    "Delete Payment?",
    "Are you sure you want to delete this payment record?",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        onPress: () => handleDeleteCash(cashId),
        style: "destructive"
      }
    ]
  );
};

const handleDeleteCash = async (cashId) => {
  try {
    await deleteCashReceived(cashId);
    const updated = await fetchCashReceived(customer.id);
    setCashHistory(updated);
    alert("✅ Payment record deleted.");
  } catch (err) {
    console.error("❌ Error deleting cash received:", err);
    alert("Something went wrong.");
  }
};
const deleteCashReceived = async (cashId) => {
  const db = getDB();
  await db.runAsync(`DELETE FROM cash_received WHERE id = ?`, [cashId]);
  };


const handleSaveTransaction = async () => {
  const amount = parseFloat(txnAmount);
  if (!amount || amount <= 0) {
    alert("⚠️ Please enter a valid amount.");
    return;
  }

  try {
    console.log("Saving transaction:", { customerId: customer.id, txnType, amount });

    // 1. Insert into transactions
    await insertTransaction(customer.id, txnType, amount);

    // 2. If it's a payment (debit), also log into cash_received
    if (txnType === 'debit') {
      await insertCashReceived(customer.id, amount);
    }

    alert(`✅ ${txnType === 'credit' ? 'Credit' : 'Payment'} recorded.`);

    // 3. Close modal
    setModalVisible(false);

    // 4. Refresh balance
    const updatedTxns = await fetchTransactions(customer.id);
    const newBalance = updatedTxns.reduce(
      (total, txn) => txn.type === 'credit' ? total + txn.amount : total - txn.amount,
      0
    );
    setCustomer(prev => ({ ...prev, balance: newBalance }));

    // 5. Refresh cash received list (if shown on UI)
    const newCashList = await fetchCashReceived(customer.id);
    setCashHistory(newCashList); // <-- this assumes `cashHistory` exists in state

  } catch (err) {
    console.error("❌ Failed to save transaction:", err);
    alert("Something went wrong: " + err.message);
  }
};

const insertTransaction = async (customerId, type, amount) => {
        const db = getDB();
        const date = new Date().toISOString().split("T")[0];
        await db.runAsync(
        `INSERT INTO transactions (customer_id, type, amount, date) VALUES (?, ?, ?, ?)`,
        [customerId, type, amount, date]
        );
    };
const confirmDeleteBill = (billId) => {
  Alert.alert(
    "Delete Bill?",
    "Are you sure you want to delete this bill?",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        onPress: () => deleteBillFromDB(billId),
        style: "destructive"
      }
    ]
  );
};

const deleteBillFromDB = async (billId) => {
  try {
    const db = getDB();

    const [bill] = await db.getAllAsync(
      `SELECT * FROM bills WHERE id = ?`,
      [billId]
    );

    if (!bill) {
      alert("❌ Bill not found.");
      return;
    }

    await db.runAsync(`DELETE FROM bills WHERE id = ?`, [billId]);

    await insertTransaction(customer.id, 'debit', bill.total); // update balance
    await loadDetails();

    alert("✅ Bill deleted and balance updated.");
  } catch (err) {
    console.error("❌ Error deleting bill:", err);
    alert("Something went wrong while deleting bill.");
  }
};
const handleDeleteCustomer = () => {
  Alert.alert(
    "Confirm Delete",
    "Are you sure you want to delete this customer and all related records?",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const db = getDB();
            await db.runAsync(`DELETE FROM transactions WHERE customer_id = ?`, [customer.id]);
            await db.runAsync(`DELETE FROM bills WHERE customer_id = ?`, [customer.id]);
            await db.runAsync(`DELETE FROM customers WHERE id = ?`, [customer.id]);

            alert("✅ Customer deleted successfully.");
            navigation.goBack();
          } catch (err) {
            console.error("❌ Delete error:", err);
            alert("Something went wrong while deleting.");
          }
        }
      }
    ]
  );
};

return (
  <View style={styles.container}>
    <Text style={styles.title}>Customer Profile</Text>
    <View style={styles.profileCard}>
      <Text style={styles.customerName}>🧍 {customer.name}</Text>
      <Text style={styles.customerInfo}>📞 {customer.phone}</Text>
    </View>
    <View style={{ marginTop: 20 }}>
      <Button title="🗑️ Delete Customer" color="red" onPress={handleDeleteCustomer} />
    </View>
    <Text style={styles.balance}>
      💰 Current Balance: ₹{customer.balance.toFixed(2)}
    </Text>

    <View style={styles.actions}>
      <Button title="Receive Money" onPress={() => openTransactionModal('debit')} />
      <Button title="Credit Bill" onPress={() => openTransactionModal('credit')} />
    </View>

    <ScrollView contentContainerStyle={{ paddingBottom: 150 }}>
    <Text style={styles.subtitle}>🛒 Purchase History</Text>
    {bills.map(item => (
      <View key={item.id} style={styles.billItem}>
      <Text>🧾 {item.serial}</Text>
      <Text>📅 {item.date}</Text>
      <Text>💰 ₹{item.total.toFixed(2)}</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
        <Button title="View PDF" onPress={() => regeneratePDF(item)} />
        <Button title="❌ Delete" color="red" onPress={() => confirmDeleteBill(item.id)} />
      </View>
      </View>
    ))}
    <Text style={styles.subtitle}>💵 Payment History</Text>
    {cashHistory.map(item => (
    <View key={item.id} style={styles.billItem}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text>📅 {item.date}</Text>
          <Text>Amount: ₹{item.amount.toFixed(2)}</Text>
        </View>
        <Button title="❌" color="red" onPress={() => confirmDeleteCash(item.id)} />
      </View>
    </View>
    ))}
    </ScrollView>

    
    <Modal visible={modalVisible} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {txnType === 'credit' ? 'Credit Bill' : 'Receive Money'}
          </Text>
          <TextInput
            placeholder="Enter amount"
            value={txnAmount}
            onChangeText={setTxnAmount}
            keyboardType="numeric"
            style={styles.input}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 }}>
            <Button title="Save" onPress={handleSaveTransaction} />
            <Button title="Cancel" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </View>
    </Modal>
  </View> // ✅ closes outer View
);
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  label: { fontSize: 16, marginVertical: 2 },
  balance: { fontSize: 18, marginTop: 10, fontWeight: '600', color: 'green' },
  actions: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10 },
  subtitle: { fontSize: 18, fontWeight: 'bold', marginTop: 20 },
  profileCard: {
    backgroundColor: '#e6f0ff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  customerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  customerInfo: {
    fontSize: 16,
    color: '#555',
  },
  billItem: {
    backgroundColor: '#f2f2f2',
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  modalContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0,0,0,0.5)',
},
modalContent: {
  backgroundColor: 'white',
  padding: 20,
  borderRadius: 10,
  width: '80%',
},
modalTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  marginBottom: 10,
},
deleteButton: {
  marginTop: 30,
  backgroundColor: '#ff4d4d',
  borderRadius: 8,
  padding: 10,
},
deleteText: {
  color: 'white',
  textAlign: 'center',
  fontWeight: 'bold',
},
});
