// components/HomeScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';

export default function HomeScreen({ navigation }) {

  return (
    <View style={styles.container}>
      <Text style={styles.shopBanner}>KALAPOTH FLOUR MILL</Text>
      <Text style={styles.shopSubBanner}>BILLING SYSTEM</Text>
      <Text style={styles.welcome}>👋 Welcome, Abdul Rahman</Text>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Customer')}>
        <Text style={styles.buttonText}>➕ Add Sale</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Customer')}>
        <Text style={styles.buttonText}>👤 Select Customer</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eef5f9', padding: 30, justifyContent: 'center' },
  welcome: { fontSize: 20, textAlign: 'center', marginBottom: 50 },
  shopBanner: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', color: '#007bff', marginBottom: 10 },
  shopSubBanner: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', color: '#007bff', marginBottom: 40 },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  buttonText: { color: '#fff', fontSize: 18, textAlign: 'center', fontWeight: '600' },
});
