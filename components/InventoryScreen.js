import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, Button, StyleSheet, TouchableOpacity } from 'react-native';
import { fetchItems } from '../utils/db';
import { useFocusEffect } from '@react-navigation/native';

export default function InventoryScreen({ navigation, route }) {
  const [inventory, setInventory] = useState([]);
  const { customer } = route.params || {};
  
  const [billItems, setBillItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [quantities, setQuantities] = useState({});
  const [unitSelections, setUnitSelections] = useState({});
  useFocusEffect(
    React.useCallback(() => {
      const load = async () => {
        const data = await fetchItems();
        setInventory(data);
      };
      load();
    }, [])
  );
 useEffect(() => {
  let newBillItems = [];
  let totalAmount = 0;

  inventory.forEach(item => {
    const qtyStr = quantities[item.id];
    if (!qtyStr || isNaN(parseFloat(qtyStr)) || parseFloat(qtyStr) <= 0) return;

    const qty = parseFloat(qtyStr);
    const unit = item.unit.toLowerCase();
    const selection = unitSelections[item.id] || 'kg';

    let actualQty = qty;
    let finalUnit = unit; // default to original unit

    if (unit === 'kg') {
      actualQty = selection === 'g' ? qty / 1000 : qty;
      finalUnit = selection; // allow g or kg
    }

    const price = actualQty * item.price;

    newBillItems.push({
      ...item,
      qty,
      unit: finalUnit, // ✅ correct unit stored
      price,
    });

    totalAmount += price;
  });

  setBillItems(newBillItems);
  setTotal(totalAmount);
 }, [quantities, unitSelections]);
return (
  <View style={styles.container}>
    {customer && (
      <View style={styles.customerBar}>
        <Text style={styles.customerText}>🧍 Customer: {customer.name}</Text>
      </View>
    )}

    <FlatList
      data={inventory}
      numColumns={2}
      columnWrapperStyle={{ justifyContent: 'space-between' }}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => {
        const isWeightBased = item.unit.toLowerCase() === 'kg';
        const qty = parseFloat(quantities[item.id]) || 0;
        const isGram = unitSelections[item.id] === 'g';
        const convertedQty = isGram ? qty / 1000 : qty;
        const totalPrice = (convertedQty * item.price).toFixed(2);

        return (
          <View style={styles.card}>
            <View style={styles.circle} />
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.price}>₹{item.price} / {item.unit}</Text>

            <TextInput
              style={styles.qtyInput}
              placeholder="Qty"
              keyboardType="numeric"
              value={quantities[item.id]}
              onChangeText={(text) =>
                setQuantities({ ...quantities, [item.id]: text })
              }
            />

            {isWeightBased ? (
              <View style={styles.unitToggle}>
              <TouchableOpacity
              style={[
                styles.unitOption,
                unitSelections[item.id] !== 'g' && styles.selectedUnit,
              ]}
              onPress={() =>
                setUnitSelections({ ...unitSelections, [item.id]: 'kg' })
              }
              >
              <Text>Kg</Text>
              </TouchableOpacity>
              <TouchableOpacity
              style={[
                styles.unitOption,
                unitSelections[item.id] === 'g' && styles.selectedUnit,
              ]}
              onPress={() =>
                setUnitSelections({ ...unitSelections, [item.id]: 'g' })
              }
              > 
              <Text>g</Text>
              </TouchableOpacity>
              </View>
            ) : (
            <Text style={styles.unitLabel}>Unit: {item.unit}</Text>
            )}
            <Text style={styles.totalText}>₹{totalPrice}</Text>
          </View>
        );
      }}
    />

    <View style={styles.total}>
      <Text style={styles.totalText}>Total: ₹{total.toFixed(2)}</Text>
    </View>

    <Button
      title="✔ Finish"
      color="green"
      onPress={() => navigation.navigate('Checkout', { billItems, customer })}
    />
  </View>
);
}

const styles = StyleSheet.create({
container: {
  flex: 1,
  padding: 10,
  backgroundColor: '#f9f9f9',
},
customerBar: {
  backgroundColor: '#eef',
  padding: 10,
  borderRadius: 8,
  marginBottom: 10,
  alignItems: 'center',
},
customerText: {
  fontSize: 16,
  fontWeight: 'bold',
},
card: {
  width: '48%',
  backgroundColor: '#fff',
  padding: 12,
  marginBottom: 12,
  borderRadius: 10,
  alignItems: 'center',
  minHeight: 220,
  elevation: 2,
},
circle: {
  width: 50,
  height: 50,
  borderRadius: 25,
  backgroundColor: '#ff6347',
  marginBottom: 8,
},
itemName: {
  fontSize: 16,
  fontWeight: 'bold',
  marginBottom: 4,
},
price: {
  fontSize: 14,
  color: '#555',
},
qtyInput: {
  borderWidth: 1,
  borderColor: '#ccc',
  borderRadius: 5,
  width: '80%',
  textAlign: 'center',
  padding: 6,
  marginVertical: 6,
},
unitToggle: {
  flexDirection: 'row',
  justifyContent: 'center',
  marginVertical: 6,
},
unitOption: {
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderWidth: 1,
  borderColor: '#aaa',
  borderRadius: 5,
  marginHorizontal: 5,
},
selectedUnit: {
  backgroundColor: '#cce5ff',
  borderColor: '#007bff',
},
totalText: {
  fontWeight: 'bold',
  fontSize: 16,
  marginTop: 6,
},
total: {
  padding: 15,
  alignItems: 'center',
},
unitLabel: {
  fontSize: 13,
  color: '#333',
  marginVertical: 4,
  fontStyle: 'italic'
},
});
