// import React from 'react';
// import { ScrollView, StyleSheet, Text } from 'react-native';
// import PermissionTile from '../components/PermissionTile';
// import AppButton from '../components/AppButton';
// import { colors } from '../theme/colors';
// import { spacing } from '../theme/spacing';
// import type { NativeStackScreenProps } from '@react-navigation/native-stack';
// import type { RootStackParamList } from '../navigation/AppNavigator';

// type Props = NativeStackScreenProps<RootStackParamList, 'Permission'>;

// export default function PermissionScreen({ navigation }: Props) {
//   return (
//     <ScrollView style={styles.container} contentContainerStyle={styles.content}>
//       <Text style={styles.heading}>Enable Live Protection</Text>
//       <Text style={styles.subheading}>
//         To monitor call scams safely, Cyberसाथी needs a few permissions.
//       </Text>

//       <PermissionTile
//         title="Overlay Permission"
//         description="Show floating safety button over other apps. / दूसरी ऐप्स के ऊपर सुरक्षा बटन दिखाने के लिए।"
//       />
//       <PermissionTile
//         title="Microphone Permission"
//         description="Listen for live audio transcription. / लाइव ऑडियो ट्रांसक्रिप्शन के लिए।"
//       />
//       <PermissionTile
//         title="Notification Permission"
//         description="Show instant scam alerts. / तुरंत स्कैम अलर्ट दिखाने के लिए।"
//       />
//       <PermissionTile
//         title="Screen / Capture Permission"
//         description="Used for future advanced analysis and better live monitoring. / भविष्य के उन्नत विश्लेषण के लिए।"
//       />

//       <AppButton title="Continue to Live Analysis" onPress={() => navigation.navigate('LiveAnalysis')} />
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: colors.background,
//   },
//   content: {
//     padding: spacing.lg,
//   },
//   heading: {
//     fontSize: 26,
//     fontWeight: '800',
//     color: colors.primary,
//     marginBottom: 8,
//   },
//   subheading: {
//     fontSize: 15,
//     lineHeight: 22,
//     color: colors.textSecondary,
//     marginBottom: spacing.lg,
//   },
// });