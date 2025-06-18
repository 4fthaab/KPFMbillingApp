import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './components/HomeScreen';
import InventoryScreen from './components/InventoryScreen';
import CustomerScreen from './components/CustomerScreen';
import CheckoutScreen from './components/CheckoutScreen';
import { DBProvider } from './utils/DBContext'; // ✅ import this
import InventoryEdit from './components/InventoryEdit';
import CustomerDetails from './components/CustomerDetails';
import ReceiptPreviewScreen from './components/ReceiptpreviewScreen';
import FlashMessage from 'react-native-flash-message';
import { Image } from 'react-native';
import HomeIcon from './assets/home.png';
import InventoryIcon from './assets/inventory.png';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// 👇 Stack for Home
function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ title: 'Home' }} />
      <Stack.Screen name="Customer" component={CustomerScreen} />
      <Stack.Screen name="Inventory">
        {(props) => <InventoryScreen {...props} />}
      </Stack.Screen>
      <Stack.Screen name="CustomerDetails" component={CustomerDetails} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="ReceiptPreview" component={ReceiptPreviewScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <DBProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarIcon: ({ focused, size }) => {
              let iconSource;

              if (route.name === 'Home') {
                iconSource = HomeIcon;
              } else if (route.name === 'Inventory Edit') {
                iconSource = InventoryIcon;
              }

              return (
                <Image
                  source={iconSource}
                  style={{
                    width: size,
                    height: size,
                    tintColor: focused ? '#007BFF' : 'gray',
                  }}
                />
              );
            },
            tabBarLabelStyle: { fontSize: 12, fontWeight: 'bold' },
            tabBarActiveTintColor: '#007BFF',
            tabBarInactiveTintColor: 'gray',
          })}
        >
          <Tab.Screen name="Home" component={HomeStack} />
          <Tab.Screen name="Inventory Edit" component={InventoryEdit} />
        </Tab.Navigator>
        <FlashMessage position="top" />
      </NavigationContainer>
    </DBProvider>
  );
}


