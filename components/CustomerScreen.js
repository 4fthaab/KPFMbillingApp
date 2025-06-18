// components/CustomerScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, KeyboardAvoidingView, ScrollView
} from 'react-native';
import { insertCustomer, fetchCustomers } from '../utils/db';
import { useFocusEffect } from '@react-navigation/native';
import { showMessage } from 'react-native-flash-message';

export default function CustomerScreen({ navigation }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [customers, setCustomers] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showList, setShowList] = useState(true);

  const loadCustomers = async () => {
    const data = await fetchCustomers();
    setCustomers(data);
  };

  useEffect(() => { loadCustomers(); }, []);
  useFocusEffect(React.useCallback(() => { loadCustomers(); }, []));

  const handleAddCustomer = async () => {
    if (!name.trim() || !phone.trim()) {
      showMessage({ message: '⚠️ Name and Phone are required.', type: 'warning' });
      return;
    }
    await insertCustomer(name, phone);
    setName('');
    setPhone('');
    loadCustomers();
    setShowAdd(false);
    setShowList(true);
    showMessage({ message: '✅ Customer added successfully!', type: 'success' });
  };

  const selectCustomer = (customer) => {
    navigation.navigate('Inventory', { customer });
  };

  return (
    <View style={{ flex: 1 }}>
      {/* 🧭 Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={showList ? styles.activeBtn : styles.inactiveBtn}
          onPress={() => {
            setShowAdd(false);
            setShowList(true);
          }}>
          <Text style={styles.toggleText}>👥 Existing Customers</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={showAdd ? styles.activeBtn : styles.inactiveBtn}
          onPress={() => {
            setShowAdd(true);
            setShowList(false);
          }}>
          <Text style={styles.toggleText}>➕ Add Customer</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        {showAdd && (
          <View style={styles.form}>
            <Text style={styles.title}>Add New Customer</Text>
            <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Phone" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
            <TouchableOpacity style={styles.submitBtn} onPress={handleAddCustomer}>
              <Text style={styles.submitText}>✅ Save Customer</Text>
            </TouchableOpacity>
          </View>
        )}

        {showList && (
          <FlatList
            data={customers}
            contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 20 }}
            keyExtractor={(item) => item.id.toString()}
            ListHeaderComponent={<Text style={styles.title}>Existing Customers</Text>}
            renderItem={({ item }) => (
              <View style={styles.customerCard}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.details}>📞 {item.phone}</Text>
                <View style={styles.cardButtons}>
                  <TouchableOpacity onPress={() => selectCustomer(item)} style={styles.cardBtn}>
                    <Text style={styles.cardBtnText}>🛒 Select</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => navigation.navigate('CustomerDetails', { customerId: item.id })} style={styles.cardBtn}>
                    <Text style={styles.cardBtnText}>📄 View Profile</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#e6f2ff', flexGrow: 1 },
  title: { fontSize: 20, fontWeight: 'bold', margin: 10, justifyContent: 'center', textAlign: 'center' },
  subtitle: { fontSize: 18, fontWeight: 'bold', marginVertical: 10 },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
    padding: 10, marginBottom: 10, backgroundColor: '#fff', marginLeft: 10, marginRight: 10
  },
  toggleContainer: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginBottom: 10,marginTop: 10,
  },
  activeBtn: {
    flex: 1, padding: 10, marginHorizontal: 5,
    backgroundColor: '#007BFF', borderRadius: 8
  },
  inactiveBtn: {
    flex: 1, padding: 10, marginHorizontal: 5,
    backgroundColor: '#ccc', borderRadius: 8
  },
  toggleText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
  submitBtn: {
    backgroundColor: '#28a745', padding: 12, borderRadius: 8,
    alignItems: 'center'
  },
  submitText: { color: '#fff', fontWeight: 'bold' },
  customerCard: {
    backgroundColor: '#fff', borderRadius: 8,
    padding: 15, marginBottom: 10, shadowColor: '#000',
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3
  },
  name: { fontSize: 16, fontWeight: 'bold' },
  details: { fontSize: 14, color: '#555', marginBottom: 5 },
  cardButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  cardBtn: {
    backgroundColor: '#007BFF', padding: 8,
    borderRadius: 6, flex: 1, marginHorizontal: 4
  },
  cardBtnText: { color: 'white', textAlign: 'center', fontWeight: 'bold' },
  form: { marginBottom: 30 }
});