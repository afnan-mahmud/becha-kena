import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#00704A',
        tabBarInactiveTintColor: '#5B6660',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E7E3DA',
        },
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTintColor: '#1B2420',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'হোম',
          headerTitle: 'বেচা-কেনা',
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'অনুসন্ধান',
          headerTitle: 'বিজ্ঞাপন খুঁজুন',
        }}
      />
      <Tabs.Screen
        name="post"
        options={{
          title: 'বিজ্ঞাপন দিন',
          headerTitle: 'নতুন বিজ্ঞাপন পোস্ট',
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'চ্যাট',
          headerTitle: 'মেসেজ ও বার্তা',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'প্রোফাইল',
          headerTitle: 'আমার প্রোফাইল',
        }}
      />
    </Tabs>
  );
}
