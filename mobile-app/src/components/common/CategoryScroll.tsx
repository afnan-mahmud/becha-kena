import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { CATEGORIES } from '@/constants/categories';
import { useTheme, FontFamilies } from '@/constants/theme';

export interface CategoryScrollProps {
  selected?: string;
  onSelect: (value: string | undefined) => void;
}

interface CategoryItem {
  value?: string;
  label: string;
  emoji: string;
  tint: string;
}

const ALL_CATEGORY: CategoryItem = {
  value: undefined,
  label: 'সব',
  emoji: '✨',
  tint: '#E7F3EC',
};

function CategoryTile({
  item,
  isSelected,
  onPress,
}: {
  item: CategoryItem;
  isSelected: boolean;
  onPress: () => void;
}) {
  const { colors, isDark } = useTheme();
  const scale = useSharedValue(isSelected ? 1.04 : 1);

  // Animated scale when selection changes
  useEffect(() => {
    if (isSelected) {
      scale.value = withSequence(
        withSpring(1.08, { damping: 10, stiffness: 300 }),
        withSpring(1.04, { damping: 12, stiffness: 200 })
      );
    } else {
      scale.value = withSpring(1, { damping: 12, stiffness: 200 });
    }
  }, [isSelected]);

  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 10, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(isSelected ? 1.04 : 1, {
      damping: 10,
      stiffness: 200,
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.itemContainer}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={item.label}
    >
      <Animated.View
        style={[
          styles.tile,
          { backgroundColor: isDark ? '#1C2B23' : item.tint },
          isSelected && {
            borderWidth: 2,
            borderColor: colors.primary,
          },
          animatedStyle,
        ]}
      >
        <Text style={styles.emoji}>{item.emoji}</Text>
      </Animated.View>
      <Text
        style={[
          styles.label,
          {
            color: isSelected
              ? colors.primary
              : isDark
              ? colors.text
              : '#1B2420',
            fontFamily: isSelected
              ? FontFamilies.semiBold
              : FontFamilies.medium,
          },
        ]}
        numberOfLines={1}
      >
        {item.label}
      </Text>
    </Pressable>
  );
}

export function CategoryScroll({ selected, onSelect }: CategoryScrollProps) {
  const data: CategoryItem[] = [ALL_CATEGORY, ...CATEGORIES];

  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={data}
      keyExtractor={(item) => item.value ?? 'all'}
      contentContainerStyle={styles.listContainer}
      renderItem={({ item }) => {
        const isSelected =
          item.value === undefined
            ? !selected
            : selected === item.value;

        return (
          <CategoryTile
            item={item}
            isSelected={isSelected}
            onPress={() => onSelect(item.value)}
          />
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 14,
  },
  itemContainer: {
    alignItems: 'center',
    width: 68,
  },
  tile: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#1B2420',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  emoji: {
    fontSize: 24,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
});

export default CategoryScroll;
