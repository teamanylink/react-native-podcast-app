import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
}

// Single skeleton item
export const SkeletonItem = ({ width, height, borderRadius = 8, style }: SkeletonProps) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.6,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeletonItem,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

// Podcast search result skeleton
export const PodcastSearchSkeleton = () => {
  const items = Array(12).fill(0); // Show 12 skeleton items (4 rows of 3)
  const screenWidth = Dimensions.get('window').width;
  
  // Use the same calculation as in browse.tsx
  // IMPORTANT: This grid must always display 3 columns as per design wireframe
  const getItemWidth = (screenWidth: number) => {
    const padding = 16; // Padding on container edges
    const gap = 16;     // Gap between items (consistent in all directions)
    const columns = 3;  // Always use 3 columns for the grid
    return (screenWidth - (padding * 2) - (gap * (columns - 1))) / columns;
  };
  
  const itemWidth = getItemWidth(screenWidth);

  return (
    <View style={styles.container}>
      <View style={styles.skeletonGrid}>
        {items.map((_, index) => {
          // Calculate row and col for proper grid layout in a 3-column grid
          const row = Math.floor(index / 3);
          const col = index % 3;
          
          return (
            <View 
              key={index} 
              style={[
                styles.itemContainer, 
                { 
                  width: itemWidth,
                  marginBottom: index < 9 ? 16 : 0, // No bottom margin for last row
                }
              ]}
            >
              <SkeletonItem width={itemWidth} height={itemWidth} borderRadius={8} />
            </View>
          );
        })}
      </View>
    </View>
  );
};

// Horizontal podcast list skeleton
export const PodcastRowSkeleton = () => {
  const items = Array(4).fill(0); // Create 4 skeleton items

  return (
    <View style={styles.rowContainer}>
      {items.map((_, index) => (
        <View key={index} style={styles.rowItemContainer}>
          <SkeletonItem width={125} height={125} borderRadius={8} />
          <SkeletonItem 
            width={100} 
            height={16} 
            style={styles.titleSkeleton} 
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  itemContainer: {
    // Remove marginBottom as we're adding it dynamically
  },
  rowContainer: {
    flexDirection: 'row',
    paddingLeft: 16,
  },
  rowItemContainer: {
    marginRight: 16,
    marginBottom: 24,
  },
  skeletonItem: {
    backgroundColor: '#243b56', // Dark placeholder color that matches the theme
  },
  titleSkeleton: {
    marginTop: 8,
  },
  subtitleSkeleton: {
    marginTop: 4,
  },
});