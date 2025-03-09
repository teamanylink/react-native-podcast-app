import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  FlatList,
  useWindowDimensions,
  ActivityIndicator,
  TextInput,
  Keyboard,
  SafeAreaView,
  Image,
  Pressable,
  Modal
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { PodcastCategory } from '@/types';
import { usePodcastsByCategory, usePodcastSearch } from '@/hooks/usePodcastQueries';
import PodcastCard from '@/components/PodcastCard';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Link } from 'expo-router';
import { Colors, GRADIENT_ANGLE } from '@/constants/Colors';
import { PodcastSearchSkeleton } from '@/components/SkeletonLoader';
import { MOCK_PODCASTS } from '@/services/mockData';

// Define a type that includes our custom "ALL" option and the standard PodcastCategory
type BrowseCategory = PodcastCategory | "ALL";

// Update categories to match the exact PodcastCategory type values with our custom ALL option
const CATEGORIES: BrowseCategory[] = [
  "ALL",
  "Business",
  "Health & Fitness",
  "Comedy",
  "Education",
  "Fiction",
  "History", // Use valid PodcastCategory values
  "Arts", // Use valid PodcastCategory values
  "Kids & Family", // Use valid PodcastCategory values
  "Leisure" // Use valid PodcastCategory values
];

// Calculate item width based on screen size - 3 columns with consistent spacing
// IMPORTANT: This grid must always display 3 columns as per design wireframe
const getItemWidth = (screenWidth: number) => {
  const padding = 16; // Padding on container edges
  const gap = 16;     // Gap between items for better visual spacing
  const columns = 3;  // Always use 3 columns for the grid
  return (screenWidth - (padding * 2) - (gap * (columns - 1))) / columns;
};

export default function BrowseScreen() {
  const colorScheme = useColorScheme();
  const isDark = true; // Force dark mode
  const { width } = useWindowDimensions();
  const ITEM_WIDTH = getItemWidth(width);
  const [selectedCategory, setSelectedCategory] = useState<BrowseCategory>("ALL");
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    sortBy: 'EXACTNESS',
    languages: ['ENGLISH'],
    hasTranscript: false
  });
  
  // Category-based podcasts
  const { 
    data: categoryPodcasts,
    isLoading: isLoadingCategory,
    isError: isCategoryError
  } = usePodcastsByCategory(
    selectedCategory !== "ALL" ? selectedCategory as PodcastCategory : undefined
  );
  
  // Search-based podcasts
  const {
    data: searchResults,
    isLoading: isLoadingSearch,
    isError: isSearchError
  } = usePodcastSearch(debouncedQuery, {
    sortBy: filters.sortBy as 'EXACTNESS' | 'POPULARITY',
    languages: filters.languages,
    filterForHasTranscript: filters.hasTranscript
  });
  
  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    
    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);
  
  // Update search state when query changes
  useEffect(() => {
    setIsSearching(debouncedQuery.length >= 3);
  }, [debouncedQuery]);
  
  // Apply selected filter and close modal
  const applyFilters = () => {
    setFilterModalVisible(false);
  };
  
  // Toggle hasTranscript filter
  const toggleTranscriptFilter = () => {
    setFilters(prev => ({
      ...prev,
      hasTranscript: !prev.hasTranscript
    }));
  };

  // Update sort option
  const setSortOption = (sortBy: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy
    }));
  };

  // Toggle language selection
  const toggleLanguage = (language: string) => {
    setFilters(prev => {
      const languages = [...prev.languages];
      const index = languages.indexOf(language);
      
      if (index >= 0) {
        // Don't remove the last language
        if (languages.length > 1) {
          languages.splice(index, 1);
        }
      } else {
        languages.push(language);
      }
      
      return {
        ...prev,
        languages
      };
    });
  };
  
  const handleCategoryPress = (category: BrowseCategory) => {
    console.log(`Category pressed: ${category}`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(category);
  };
  
  const handleClearSearch = () => {
    console.log('Search cleared');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchQuery('');
    setIsSearching(false);
    Keyboard.dismiss();
  };
  
  // Render a podcast item
  const renderPodcastItem = ({ item, index }: { item: any; index: number }) => {
    console.log(`Rendering podcast item: ${item.title}`);
    return (
      <Link href={`/podcast/${item.id}`} asChild>
        <TouchableOpacity 
          style={[
            styles.podcastItem, 
            { 
              width: ITEM_WIDTH,
              marginHorizontal: 0, // Remove any horizontal margin to allow the container to handle spacing
            }
          ]}
        >
          <Image 
            source={{ uri: item.image }} 
            style={[styles.podcastImage, { width: ITEM_WIDTH, height: ITEM_WIDTH }]}
            resizeMode="cover"
          />
        </TouchableOpacity>
      </Link>
    );
  };
  
  // Render a category tab
  const renderCategoryItem = ({ item }: { item: BrowseCategory }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        selectedCategory === item && styles.selectedCategoryButton
      ]}
      onPress={() => handleCategoryPress(item)}
    >
      <Text 
        style={[
          styles.categoryText,
          selectedCategory === item && styles.selectedCategoryText
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );
  
  // Render search bar
  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchInputContainer}>
        <MaterialIcons name="search" size={24} color="#bfbfbf" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search podcasts..."
          placeholderTextColor="#bfbfbf"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
            <MaterialIcons name="close" size={20} color="#bfbfbf" />
          </TouchableOpacity>
        )}
      </View>
      
      {debouncedQuery.length >= 3 && (
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <MaterialIcons 
            name="filter-list" 
            size={24} 
            color={filters.hasTranscript || filters.languages.length > 1 || filters.sortBy !== 'EXACTNESS' ? '#0076aa' : '#bfbfbf'} 
          />
        </TouchableOpacity>
      )}
    </View>
  );

  // Render filter modal
  const renderFilterModal = () => (
    <Modal
      visible={filterModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setFilterModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Search Filters</Text>
            <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
              <MaterialIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          {/* Sort options */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Sort By</Text>
            <View style={styles.optionsContainer}>
              {SORT_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    filters.sortBy === option.value && styles.optionButtonSelected
                  ]}
                  onPress={() => setSortOption(option.value)}
                >
                  <Text style={[
                    styles.optionText,
                    filters.sortBy === option.value && styles.optionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Language options */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Languages</Text>
            <View style={styles.optionsContainer}>
              {LANGUAGE_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    filters.languages.includes(option.value) && styles.optionButtonSelected
                  ]}
                  onPress={() => toggleLanguage(option.value)}
                >
                  <Text style={[
                    styles.optionText,
                    filters.languages.includes(option.value) && styles.optionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Additional filters */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Additional Filters</Text>
            <TouchableOpacity 
              style={styles.checkboxContainer}
              onPress={toggleTranscriptFilter}
            >
              <View style={[
                styles.checkbox, 
                filters.hasTranscript && styles.checkboxSelected
              ]}>
                {filters.hasTranscript && (
                  <MaterialIcons name="check" size={16} color="#fff" />
                )}
              </View>
              <Text style={styles.checkboxLabel}>Has transcript</Text>
            </TouchableOpacity>
          </View>
          
          {/* Apply button */}
          <TouchableOpacity 
            style={styles.applyButton}
            onPress={applyFilters}
          >
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
  
  // Render categories
  const renderCategories = () => (
    <View style={styles.categoriesContainer}>
      <FlatList
        data={CATEGORIES}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContent}
      />
    </View>
  );
  
  // Render search results
  const renderSearchResults = () => {
    // Only show when searching with a valid query
    if (!isSearching || debouncedQuery.length < 3) return null;
    
    console.log('Rendering search results for query:', debouncedQuery);
    
    // Loading state
    if (isLoadingSearch) {
      console.log('Loading search results...');
      return (
        <View style={styles.loadingContainer}>
          <PodcastSearchSkeleton />
        </View>
      );
    }
    
    // Error state
    if (isSearchError) {
      console.log('Error loading search results');
      return (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color="#FF5252" />
          <Text style={styles.errorText}>Failed to load search results</Text>
        </View>
      );
    }
    
    // No results
    if (!searchResults || searchResults.length === 0) {
      console.log('No search results found');
      return (
        <View style={styles.noResultsContainer}>
          <MaterialIcons name="search-off" size={48} color="#bfbfbf" />
          <Text style={styles.noResultsText}>No podcasts found</Text>
          <Text style={styles.noResultsSubtext}>Try a different search term or filters</Text>
        </View>
      );
    }
    
    // Get filter count
    const filterCount = 
      (filters.sortBy !== 'EXACTNESS' ? 1 : 0) + 
      (filters.languages.length > 1 ? 1 : 0) + 
      (filters.hasTranscript ? 1 : 0);
    
    // Render results
    console.log(`Found ${searchResults.length} search results`);
    return (
      <View style={styles.searchResultsContainer}>
        <View style={styles.searchResultsHeader}>
          <Text style={styles.searchResultsTitle}>
            {searchResults.length} {searchResults.length === 1 ? 'Result' : 'Results'}
          </Text>
          
          {filterCount > 0 && (
            <View style={styles.filterCountContainer}>
              <MaterialIcons name="filter-list" size={14} color="#fff" />
              <Text style={styles.filterCountText}>{filterCount}</Text>
            </View>
          )}
        </View>
        
        <FlatList
          // This grid must always have 3 columns to match the design wireframe
          data={searchResults}
          renderItem={({ item, index }) => {
            // Make adjustments for last row
            const rowIndex = Math.floor(index / 3);
            const lastRowStartIndex = Math.floor(searchResults.length / 3) * 3;
            const isLastRow = index >= lastRowStartIndex;
            
            return (
              <View style={[
                styles.podcastItemContainer,
                { 
                  width: ITEM_WIDTH,
                  marginBottom: isLastRow ? 0 : 16
                }
              ]}>
                {renderPodcastItem({ item, index })}
              </View>
            );
          }}
          keyExtractor={item => item.id}
          numColumns={3}
          contentContainerStyle={styles.searchResultsContent}
          columnWrapperStyle={styles.searchResultsRow}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      {renderSearchBar()}
      {renderFilterModal()}
      {renderCategories()}
      
      {isSearching ? (
        // When searching, render search results in a standalone component
        <View style={styles.content}>
          {renderSearchResults()}
        </View>
      ) : (
        // When not searching, use FlatList instead of ScrollView for carousels
        <FlatList
          data={LOCAL_SECTIONS}
          renderItem={({ item: section }) => {
            console.log(`Rendering carousel section: ${section.title || 'Featured'}`);
            return (
              <View style={styles.carouselContainer}>
                {section.title ? (
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                ) : null}
                <FlatList
                  data={section.data}
                  renderItem={renderPodcastItem}
                  keyExtractor={(item) => `${section.id}-${item.id}`}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.carouselContent}
                />
              </View>
            );
          }}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          style={styles.content}
          ListFooterComponent={<View style={styles.bottomPadding} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#081b2f', // Match home background color
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 16,
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    color: '#FFFFFF',
    fontSize: 16,
  },
  clearButton: {
    padding: 8,
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  categoriesContent: {
    paddingHorizontal: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginRight: 8,
  },
  selectedCategoryButton: {
    backgroundColor: '#0076aa', // Primary color
  },
  categoryText: {
    fontSize: 15,
    color: '#bfbfbf',
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  carouselContainer: {
    marginBottom: 30,
  },
  carouselContent: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  podcastItem: {
    borderRadius: 8,
    overflow: 'hidden',
    // Remove marginBottom as we're handling that in searchResultsRow
  },
  podcastImage: {
    borderRadius: 8,
  },
  podcastTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  podcastAuthor: {
    fontSize: 14,
    color: '#bfbfbf',
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  searchResultsContainer: {
    flex: 1,
  },
  searchResultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  searchResultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  filterCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 8,
  },
  filterCountText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  searchResultsContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100, // Extra padding for mini player
  },
  searchResultsRow: {
    justifyContent: 'space-between',
    marginBottom: 16, // Increase vertical spacing between rows
  },
  podcastItemContainer: {
    // Container for proper spacing and positioning of each item
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#FF5252',
    marginTop: 8,
    textAlign: 'center',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#bfbfbf',
  },
  bottomPadding: {
    height: 100, // Extra padding at the bottom for scrolling
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#081b2f',
    padding: 20,
    borderRadius: 20,
    width: '80%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#0076aa',
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  optionButtonSelected: {
    backgroundColor: '#0076aa',
  },
  optionText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  optionTextSelected: {
    fontWeight: 'bold',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#0076aa',
    borderRadius: 4,
    marginRight: 10,
  },
  checkboxSelected: {
    backgroundColor: '#0076aa',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  applyButton: {
    backgroundColor: '#0076aa',
    padding: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});