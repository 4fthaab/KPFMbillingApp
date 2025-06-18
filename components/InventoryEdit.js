import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, FlatList,
  TouchableOpacity, StyleSheet, Alert
} from 'react-native';
import { getDB, insertItem, fetchItems, updateItem, deleteItem } from '../utils/db';
import { Ionicons } from '@expo/vector-icons'; // For icons

export default function InventoryEdit() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('');
  const [editId, setEditId] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [editUnit, setEditUnit] = useState('');

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    const data = await fetchItems();
    setItems(data);
  };

  const handleAddItem = async () => {
    if (!name || !price || !unit) return;
    await insertItem(name, parseFloat(price), unit);
    setName('');
    setPrice('');
    setUnit('');
    setShowForm(false);
    loadItems();
  };

  const handleUpdate = (item) => {
    setEditId(item.id);
    setEditPrice(item.price.toString());
    setEditUnit(item.unit);
  };

  const handleDelete = async (id) => {
    Alert.alert(
      "Delete Item",
      "Are you sure you want to delete this item?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            await deleteItem(id);
            loadItems();
          },
          style: "destructive"
        }
      ]
    );
  };

  const saveUpdate = async () => {
    if (!editPrice || !editUnit) return;
    await updateItem(editId, parseFloat(editPrice), editUnit);
    setEditId(null);
    setEditPrice('');
    setEditUnit('');
    loadItems();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.toggleButton} onPress={() => setShowForm(prev => !prev)}>
        <Ionicons name={showForm ? "close-circle" : "add-circle"} size={24} color="#007bff" />
        <Text style={styles.toggleText}>{showForm ? "Cancel" : "Add New Item"}</Text>
      </TouchableOpacity>

      {showForm && (
        <View style={styles.form}>
          <TextInput
            placeholder="Item Name"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />
          <TextInput
            placeholder="Price"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            style={styles.input}
          />
          <TextInput
            placeholder="Unit (kg/litre)"
            value={unit}
            onChangeText={setUnit}
            style={styles.input}
          />
          <TouchableOpacity style={styles.addBtn} onPress={handleAddItem}>
            <Text style={styles.addBtnText}>✅ Add Item</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.title}>Current Inventory</Text>
      <FlatList
        data={items}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.itemName}>{item.name}</Text>
            {editId === item.id ? (
              <>
                <TextInput
                  value={editPrice}
                  onChangeText={setEditPrice}
                  placeholder="Price"
                  keyboardType="numeric"
                  style={styles.input}
                />
                <TextInput
                  value={editUnit}
                  onChangeText={setEditUnit}
                  placeholder="Unit"
                  style={styles.input}
                />
                <View style={styles.rowBtns}>
                  <TouchableOpacity style={styles.saveBtn} onPress={saveUpdate}>
                    <Ionicons name="checkmark-circle" size={20} color="white" />
                    <Text style={styles.saveBtnText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setEditId(null)}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.detail}>₹{item.price} / {item.unit}</Text>
                <View style={styles.rowBtns}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => handleUpdate(item)}>
                    <Ionicons name="pencil" size={16} color="white" />
                    <Text style={styles.btnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.delBtn} onPress={() => handleDelete(item.id)}>
                    <Ionicons name="trash" size={16} color="white" />
                    <Text style={styles.btnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fefefe' },
  title: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginVertical: 10 },
  toggleButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 30
  },
  toggleText: { fontSize: 16, marginLeft: 8, color: '#007bff' },
  form: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2
  },
  input: {
    borderWidth: 1, borderColor: '#ddd', padding: 10,
    borderRadius: 8, marginVertical: 8, backgroundColor: '#fff',
    fontSize: 16
  },
  addBtn: {
    backgroundColor: '#28a745',
    padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 5
  },
  addBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  card: {
    backgroundColor: '#f1f3f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 1
  },
  itemName: { fontSize: 18, fontWeight: '600', color: '#343a40' },
  detail: { fontSize: 15, marginVertical: 5, color: '#495057' },
  rowBtns: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 10
  },
  editBtn: {
    backgroundColor: '#17a2b8', flexDirection: 'row',
    alignItems: 'center', padding: 8, borderRadius: 6
  },
  delBtn: {
    backgroundColor: '#dc3545', flexDirection: 'row',
    alignItems: 'center', padding: 8, borderRadius: 6
  },
  saveBtn: {
    backgroundColor: '#007bff', flexDirection: 'row',
    alignItems: 'center', padding: 8, borderRadius: 6
  },
  btnText: { color: 'white', marginLeft: 6 },
  saveBtnText: { color: 'white', marginLeft: 6 },
  cancelBtnText: { color: '#6c757d', marginLeft: 10, alignSelf: 'center' }
});
