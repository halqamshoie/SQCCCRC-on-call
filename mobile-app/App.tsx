import React from 'react'
import { ActivityIndicator, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { NavigationContainer, DarkTheme as NavigationDarkTheme } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { AuthProvider, useAuth } from './src/contexts/AuthContext'
import LoginScreen from './src/screens/LoginScreen'
import TodayScreen from './src/screens/TodayScreen'
import MyShiftsScreen from './src/screens/MyShiftsScreen'
import SwapScreen from './src/screens/SwapScreen'
import ProfileScreen from './src/screens/ProfileScreen'

const Tab = createBottomTabNavigator()

const colors = {
  background: '#0f172a',
  card: '#1e293b',
  border: '#334155',
  text: '#f8fafc',
  textMuted: '#64748b',
  accent: '#6366f1',
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 88,
          paddingBottom: 28,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600' as const,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'calendar'
          if (route.name === 'Today') iconName = 'today'
          else if (route.name === 'My Shifts') iconName = 'calendar'
          else if (route.name === 'Swaps') iconName = 'swap-horizontal'
          else if (route.name === 'Profile') iconName = 'person'
          return <Ionicons name={iconName} size={size} color={color} />
        },
      })}
    >
      <Tab.Screen name="Today" component={TodayScreen} />
      <Tab.Screen name="My Shifts" component={MyShiftsScreen} />
      <Tab.Screen name="Swaps" component={SwapScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

function AppNavigator() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    )
  }

  return user ? <MainTabs /> : <LoginScreen />
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer
        theme={{
          ...NavigationDarkTheme,
          colors: {
            ...NavigationDarkTheme.colors,
            primary: colors.accent,
            background: colors.background,
            card: colors.card,
            text: colors.text,
            border: colors.border,
            notification: colors.accent,
          },
        }}
      >
        <StatusBar style="light" />
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  )
}
