// components/CheckoutScreen.js
import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, StyleSheet, Keyboard } from 'react-native';
import { Button } from 'react-native-paper';
import { generateSerial } from '../utils/generateSerial';
import * as Print from 'expo-print';
import { useDBReady } from '../utils/DBContext';
import { getDB } from '../utils/db'; // Assuming you have a db.js file that exports the initialized database
import { KeyboardAvoidingView, ScrollView, Platform } from 'react-native';


export default function CheckoutScreen({ route, navigation }) {
  const isDBReady = useDBReady();
  if (!isDBReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>🔄 Loading database...</Text>
      </View>
    );
  }
  const { billItems, customer } = route.params;
  const [labour, setLabour] = useState('');
  const [oldBalance, setOldBalance] = useState('');

  const subTotal = billItems.reduce((sum, item) => sum + item.price, 0);
  const labourCharge = parseFloat(labour) || 0;
  const oldBal = parseFloat(oldBalance) || 0;
  const grandTotal = subTotal + labourCharge + oldBal;

  const handleFinishBill = async () => {
    console.log("✅ Finish button clicked");    

  try {
    const db = getDB(); // ✅ make sure this line exists inside the function

    const selectedCustomer = customer; // ✅ dynamic
    const customerName = selectedCustomer.name;
    const billDate = new Date().toISOString().split("T")[0];

    const result = await db.getAllAsync(
      `SELECT serial FROM bills WHERE customer_id = ? AND date = ?`,
      [selectedCustomer.id, billDate]
    );
    const previousSerials = result.map(r => r.serial);
    const serial = generateSerial(customerName, billDate, previousSerials);
    const finalItems = [...billItems];

    if (labourCharge > 0) {
      finalItems.push({
        name: 'Labour',
        qty: 1,
        unit: '',
        price: labourCharge,
      });
    }

    if (oldBal > 0) {
      finalItems.push({
        name: 'Old Balance',
        qty: 1,
        unit: '',
        price: oldBal,
      });
    }

    const itemsJSON = JSON.stringify(finalItems);
    console.log("📝 Bill data prepared");

    await db.runAsync(
      `INSERT INTO bills (customer_id, date, serial, total, items) VALUES (?, ?, ?, ?, ?)`,
      [selectedCustomer.id, billDate, serial, grandTotal, itemsJSON]
    );
    await db.runAsync(
      `INSERT INTO transactions (customer_id, type, amount, date) VALUES (?, 'credit', ?, ?)`,
     [selectedCustomer.id, grandTotal, billDate]  
    );

    console.log("💾 Bill saved to database");
    const formatDate = (isoDateStr) => {
    const [yyyy, mm, dd] = isoDateStr.split('-');
    return `${dd}-${mm}-${yyyy}`;
    };

    // Generate PDF and Share
    const htmlContent = `
      <html>
      <head>
      <title>${customerName}_${billDate}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .header {
          text-align: center;
          margin-bottom: 10px;
        }
        .header h1 {
          margin: 0;
          font-size: 30px;
          color: #007bff;
        }
        .subheading {
          font-size: 18px;
          color: #333;
        }
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
          ${billItems.map(item => `
            <tr>
              <td>${item.name}</td>
              <td>₹${item.unit === 'g' ? (item.price * 1000 / item.qty).toFixed(2) : item.price / item.qty}</td>
              <td>${item.qty} ${item.unit || ''}</td>
              <td>₹${item.price.toFixed(2)}</td>
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
    console.log("🧾 HTML content generated");

    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    console.log("📄 PDF created:", uri);
    navigation.navigate('ReceiptPreview', {
      pdfUri: uri,
      htmlContent,
      customerPhone: selectedCustomer.phone,
    });
  } catch (err) {
    console.error("❌ Error in handleFinishBill:", err);
    alert("Something went wrong:\n" + err.message);
  }
};

  return (
    <ScrollView style={{ flex: 1 }}>
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <Text style={styles.title}>Review Bill</Text>
      <FlatList
        data={billItems}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.name}>{item.name}</Text>
            <Text>
              Qty: {item.qty} {item.unit} | Price: ₹{item.price.toFixed(2)}
            </Text>
          </View>
        )}
        ListFooterComponent={
          <>
            <TextInput
              placeholder="Labour Charge"
              keyboardType="numeric"
              style={styles.input}
              value={labour}
              onChangeText={setLabour}
              onSubmitEditing={Keyboard.dismiss}
            />
            <TextInput
              placeholder="Old Balance"
              keyboardType="numeric"
              style={styles.input}
              value={oldBalance}
              onChangeText={setOldBalance}
              onSubmitEditing={Keyboard.dismiss}
            />
            <Text style={styles.total}>Total: ₹{grandTotal.toFixed(2)}</Text>
            <Button mode="contained" onPress={handleFinishBill} style={{ marginTop: 10 }}>
              ✔ Finish & Generate Receipt
            </Button>
          </>
        }
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.container}
      />
    </KeyboardAvoidingView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', margin: 10, textAlign: 'center' },
  item: {
    marginBottom: 10,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#343a40',
  },
  details: {
    fontSize: 14,
    color: '#6c757d',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    backgroundColor: '#fff',
    padding: 12,
    fontSize: 16,
    borderRadius: 8,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
    elevation: 1,
  },
  total: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginVertical: 10 }
});
