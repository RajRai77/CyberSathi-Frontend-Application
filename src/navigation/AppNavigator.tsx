import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import LiveAnalysisScreen from '../screens/LiveAnalysisScreen';
import {useLiveAnalysisStore} from '../store/liveAnalysisStore';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  LiveAnalysis: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const isLoggedIn = useLiveAnalysisStore(state => state.isLoggedIn);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShadowVisible: false}}>
        {!isLoggedIn ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{headerShown: false}}
          />
        ) : (
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{title: 'Cyberसाथी'}}
            />
            <Stack.Screen
              name="LiveAnalysis"
              component={LiveAnalysisScreen}
              options={{title: 'Live Call Analysis'}}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}