import React from 'react';
import { View, Text, StyleSheet, Button, ScrollView } from 'react-native';
import * as Sharing from 'expo-sharing';
import { WebView } from 'react-native-webview';


export default function ReceiptPreviewScreen({ route, navigation }) {
  const { htmlContent, pdfUri, customerPhone, billData } = route.params;

const handleSharePDF = async () => {
  try {
    await Sharing.shareAsync(pdfUri, {
      dialogTitle: 'Share Bill PDF',
      mimeType: 'application/pdf',
    });
  } catch (error) {
    alert("❌ Failed to share PDF: " + error.message);
  }
};
  return (
    <View style={{ flex: 1 }}>
      <WebView source={{ html: htmlContent }} style={{ flex: 1 }} />
      <View style={{ padding: 10 }}>
        <Button title="📤 Share Receipt" onPress={handleSharePDF} />
        <Button title="🆕 New Sale" onPress={() => navigation.navigate('Customer')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 4,
  },
  section: {
    marginTop: 15,
    backgroundColor: '#f2f2f2',
    padding: 12,
    borderRadius: 8,
    width: '100%',
  },
  total: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007bff',
  },
  actions: {
    marginTop: 30,
    width: '100%',
  },
});
