import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { useTheme, FontFamilies } from '@/constants/theme';
import { useRequireVerified } from '@/hooks/useRequireVerified';
import { useChatStore } from '@/store/chat.store';

// Configuration for each tab
interface TabConfig {
  name: string;
  label: string;
  activeIcon: keyof typeof Ionicons.glyphMap;
  inactiveIcon: keyof typeof Ionicons.glyphMap;
  isCenter?: boolean;
  showBadge?: boolean;
}

const TAB_CONFIGS: Record<string, TabConfig> = {
  home: {
    name: 'home',
    label: 'হোম',
    activeIcon: 'home',
    inactiveIcon: 'home-outline',
  },
  search: {
    name: 'search',
    label: 'খুঁজুন',
    activeIcon: 'search',
    inactiveIcon: 'search-outline',
  },
  post: {
    name: 'post',
    label: 'বিজ্ঞাপন দিন',
    activeIcon: 'add',
    inactiveIcon: 'add',
    isCenter: true,
  },
  chat: {
    name: 'chat',
    label: 'চ্যাট',
    activeIcon: 'chatbubble',
    inactiveIcon: 'chatbubble-outline',
    showBadge: true,
  },
  profile: {
    name: 'profile',
    label: 'প্রোফাইল',
    activeIcon: 'person',
    inactiveIcon: 'person-outline',
  },
};

/**
 * Animated Standard Tab Item (home, search, chat, profile)
 */
function AnimatedTabItem({
  label,
  activeIcon,
  inactiveIcon,
  isFocused,
  onPress,
  onLongPress,
  showBadge,
  badgeCount,
  activeColor,
  inactiveColor,
  surfaceColor,
}: {
  label: string;
  activeIcon: keyof typeof Ionicons.glyphMap;
  inactiveIcon: keyof typeof Ionicons.glyphMap;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  showBadge?: boolean;
  badgeCount?: number;
  activeColor: string;
  inactiveColor: string;
  surfaceColor: string;
}) {
  const iconScale = useSharedValue(1);
  const badgeScale = useSharedValue(1);

  // Small scale/bounce animation on active icon
  useEffect(() => {
    if (isFocused) {
      iconScale.value = withSequence(
        withTiming(0.82, { duration: 80 }),
        withSpring(1.22, { damping: 5, stiffness: 280 }),
        withSpring(1, { damping: 10, stiffness: 200 })
      );
    } else {
      iconScale.value = withTiming(1, { duration: 150 });
    }
  }, [isFocused]);

  // Unread badge pop animation when count changes
  useEffect(() => {
    if (showBadge) {
      badgeScale.value = withSequence(
        withSpring(1.35, { damping: 4, stiffness: 300 }),
        withSpring(1, { damping: 10, stiffness: 180 })
      );
    }
  }, [badgeCount, showBadge]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const animatedBadgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  const iconName = isFocused ? activeIcon : inactiveIcon;
  const itemColor = isFocused ? activeColor : inactiveColor;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabItem}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
    >
      <View style={styles.iconContainer}>
        <Animated.View style={animatedIconStyle}>
          <Ionicons name={iconName} size={24} color={itemColor} />
        </Animated.View>

        {showBadge && (
          <Animated.View
            style={[
              styles.badgeContainer,
              { borderColor: surfaceColor },
              animatedBadgeStyle,
            ]}
          >
            <Text style={styles.badgeText}>
              {typeof badgeCount === 'number' && badgeCount > 99
                ? '99+'
                : String(badgeCount ?? 0)}
            </Text>
          </Animated.View>
        )}
      </View>

      <Text
        style={[
          styles.tabLabel,
          {
            color: itemColor,
            fontFamily: isFocused
              ? FontFamilies.semiBold
              : FontFamilies.medium,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Raised Circular Center Button for Post (বিজ্ঞাপন দিন)
 * In ACCENT red (#E63946) with a white "+"
 */
function RaisedCenterButton({
  label,
  isFocused,
  onPress,
  onLongPress,
  activeColor,
  inactiveColor,
}: {
  label: string;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  activeColor: string;
  inactiveColor: string;
}) {
  const buttonScale = useSharedValue(1);

  const handlePressIn = () => {
    buttonScale.value = withTiming(0.9, { duration: 80 });
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1, { damping: 9, stiffness: 220 });
  };

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.centerTabItem}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
    >
      <Animated.View style={[styles.raisedCircle, animatedButtonStyle]}>
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </Animated.View>

      <Text
        style={[
          styles.tabLabel,
          styles.centerLabel,
          {
            color: isFocused ? activeColor : inactiveColor,
            fontFamily: isFocused
              ? FontFamilies.semiBold
              : FontFamilies.medium,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Custom Tab Bar Component
 */
function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  // Total unread count from chat store (Prompt 28; defaults to 0)
  const unreadCount = useChatStore(
    (s: any) => s.totalUnread ?? s.unreadCount ?? 0
  );

  const surfaceColor = isDark ? colors.surface : '#FFFFFF';
  const activeColor = colors.primary; // Primary green #00704A
  const inactiveColor = colors.textMuted; // Muted

  return (
    <View
      style={[
        styles.tabBarContainer,
        {
          backgroundColor: surfaceColor,
          borderTopColor: isDark ? colors.border : '#E7E3DA',
          paddingBottom: Math.max(insets.bottom, 6),
        },
      ]}
    >
      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index;
        const config = TAB_CONFIGS[route.name];

        if (!config) {
          return null;
        }

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        if (config.isCenter) {
          return (
            <RaisedCenterButton
              key={route.key}
              label={config.label}
              isFocused={isFocused}
              onPress={onPress}
              onLongPress={onLongPress}
              activeColor={activeColor}
              inactiveColor={inactiveColor}
            />
          );
        }

        return (
          <AnimatedTabItem
            key={route.key}
            label={config.label}
            activeIcon={config.activeIcon}
            inactiveIcon={config.inactiveIcon}
            isFocused={isFocused}
            onPress={onPress}
            onLongPress={onLongPress}
            showBadge={config.showBadge}
            badgeCount={unreadCount}
            activeColor={activeColor}
            inactiveColor={inactiveColor}
            surfaceColor={surfaceColor}
          />
        );
      })}
    </View>
  );
}

/**
 * Bottom Tab Navigator for Becha-Kena
 */
export default function TabsLayout() {
  const requireVerified = useRequireVerified();

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'হোম',
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'খুঁজুন',
        }}
      />
      <Tabs.Screen
        name="post"
        options={{
          title: 'বিজ্ঞাপন দিন',
        }}
        listeners={{
          tabPress: (e) => {
            // Guard: unverified user is blocked, shown alert and routed to /kyc
            if (!requireVerified('post')) {
              e.preventDefault();
            }
          },
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'চ্যাট',
        }}
        listeners={{
          tabPress: (e) => {
            // Guard: unverified user is blocked, shown alert and routed to /kyc
            if (!requireVerified('chat')) {
              e.preventDefault();
            }
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'প্রোফাইল',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    height: Platform.select({ ios: 60, default: 62 }),
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingTop: 4,
    // Soft elevation and shadow
    shadowColor: '#1B2420',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  centerTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
  },
  tabLabel: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
    textAlign: 'center',
  },
  centerLabel: {
    marginTop: 2,
  },
  raisedCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E63946', // ACCENT red
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
    // Raised shadow
    shadowColor: '#E63946',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.38,
    shadowRadius: 6,
    elevation: 7,
  },
  badgeContainer: {
    position: 'absolute',
    top: -5,
    right: -10,
    minWidth: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: '#E63946', // ACCENT red badge
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
});
