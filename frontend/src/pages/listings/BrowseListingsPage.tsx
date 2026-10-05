import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Filter, 
  Grid, 
  List as ListIcon, 
  X, 
  ChevronRight,
  Search
} from 'lucide-react';
import { getListings } from '../../services/listing.service';
import { ListingCard } from '../../components/ui/ListingCard';
import { ListingCardList } from '../../components/ui/ListingCardList';
import { Pagination } from '../../components/common/Pagination';
import { useDebounce } from '../../hooks/useDebounce';
import { ListingCategory, ListingCondition } from '../../types';
import { DIVISIONS, DISTRICTS, THANAS } from '../../utils/locations';
import { SEOHead } from '../../components/common/SEOHead';
import './BrowseListingsPage.css';

export const BrowseListingsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // View state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    searchParams.getAll('category') || (searchParams.get('category') ? [searchParams.get('category') as string] : [])
  );
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [selectedConditions, setSelectedConditions] = useState<string[]>(searchParams.getAll('condition'));
  
  // Location state
  const [division, setDivision] = useState(searchParams.get('division') || '');
  const [district, setDistrict] = useState(searchParams.get('district') || '');
  const [thana, setThana] = useState(searchParams.get('thana') || '');
  
  // Sort & Pagination state
  const [sortBy, setSortBy] = useState('latest');
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
  const limit = 12;

  // Debounce search and price
  const debouncedSearch = useDebounce(searchQuery, 500);
  const debouncedMinPrice = useDebounce(minPrice, 500);
  const debouncedMaxPrice = useDebounce(maxPrice, 500);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (debouncedMinPrice) params.set('minPrice', debouncedMinPrice);
    if (debouncedMaxPrice) params.set('maxPrice', debouncedMaxPrice);
    
    selectedCategories.forEach(cat => params.append('category', cat));
    selectedConditions.forEach(cond => params.append('condition', cond));
    
    if (division) params.set('division', division);
    if (district) params.set('district', district);
    if (thana) params.set('thana', thana);
    
    if (currentPage > 1) params.set('page', currentPage.toString());
    
    setSearchParams(params, { replace: true });
  }, [
    debouncedSearch, 
    debouncedMinPrice, 
    debouncedMaxPrice, 
    selectedCategories, 
    selectedConditions,
    division,
    district,
    thana,
    currentPage,
    setSearchParams
  ]);

  // Fetch data
  const { data, isLoading, error } = useQuery({
    queryKey: ['listings', { 
      search: debouncedSearch, 
      categories: selectedCategories, 
      minPrice: debouncedMinPrice, 
      maxPrice: debouncedMaxPrice,
      conditions: selectedConditions,
      division,
      district,
      thana,
      sortBy,
      page: currentPage 
    }],
    queryFn: () => getListings({
      search: debouncedSearch,
      category: selectedCategories.length === 1 ? selectedCategories[0] : undefined, // Simplify for mock api
      minPrice: debouncedMinPrice ? Number(debouncedMinPrice) : undefined,
      maxPrice: debouncedMaxPrice ? Number(debouncedMaxPrice) : undefined,
      page: currentPage,
      limit,
      status: 'active'
    }),
  });

  const listings = data?.data?.items || [];
  const totalItems = data?.data?.total || 0;
  const totalPages = data?.data?.totalPages || 1;

  // Handlers
  const toggleCategory = (category: string) => {
    setCurrentPage(1);
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleCondition = (condition: string) => {
    setCurrentPage(1);
    setSelectedConditions(prev => 
      prev.includes(condition) 
        ? prev.filter(c => c !== condition)
        : [...prev, condition]
    );
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setMinPrice('');
    setMaxPrice('');
    setSelectedConditions([]);
    setDivision('');
    setDistrict('');
    setThana('');
    setCurrentPage(1);
    setSortBy('latest');
  };

  const handleDivisionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDivision(e.target.value);
    setDistrict('');
    setThana('');
    setCurrentPage(1);
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDistrict(e.target.value);
    setThana('');
    setCurrentPage(1);
  };

  const breadcrumbCategory = selectedCategories.length === 1 ? selectedCategories[0] : 'সকল বিজ্ঞাপন';

  return (
    <div className="browse-page container">
      <SEOHead 
        title="Browse Listings — Becha-Kena" 
        description="Browse all available items on Becha-Kena. Find what you need at the best prices."
      />
      {/* Mobile Filter Button */}
      <div className="mobile-filter-bar">
        <div className="search-bar-mobile">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="কী খুঁজছেন?" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button 
          className="btn btn-outline filter-toggle-btn"
          onClick={() => setIsMobileFilterOpen(true)}
        >
          <Filter size={18} />
          ফিল্টার
        </button>
      </div>

      <div className="browse-layout">
        {/* Sidebar Filters */}
        <aside className={`filter-sidebar ${isMobileFilterOpen ? 'mobile-open' : ''}`}>
          <div className="filter-header-mobile">
            <h3>ফিল্টার করুন</h3>
            <button className="icon-btn" onClick={() => setIsMobileFilterOpen(false)}>
              <X size={24} />
            </button>
          </div>

          <div className="filter-section">
            <div className="filter-section-header">
              <h4>ক্যাটাগরি</h4>
              {selectedCategories.length > 0 && (
                <button className="text-link-sm" onClick={() => setSelectedCategories([])}>ক্লিয়ার</button>
              )}
            </div>
            <div className="filter-options checkbox-list">
              {Object.values(ListingCategory).map((cat) => (
                <label key={cat} className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={selectedCategories.includes(cat)}
                    onChange={() => toggleCategory(cat)}
                  />
                  <span>{cat}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <div className="filter-section-header">
              <h4>মূল্য (৳)</h4>
              {(minPrice || maxPrice) && (
                <button className="text-link-sm" onClick={() => { setMinPrice(''); setMaxPrice(''); }}>ক্লিয়ার</button>
              )}
            </div>
            <div className="price-inputs">
              <input 
                type="number" 
                placeholder="সর্বনিম্ন" 
                value={minPrice}
                onChange={(e) => { setMinPrice(e.target.value); setCurrentPage(1); }}
                className="input"
              />
              <span>-</span>
              <input 
                type="number" 
                placeholder="সর্বোচ্চ" 
                value={maxPrice}
                onChange={(e) => { setMaxPrice(e.target.value); setCurrentPage(1); }}
                className="input"
              />
            </div>
          </div>

          <div className="filter-section">
            <h4>অবস্থা</h4>
            <div className="filter-options checkbox-list">
              {Object.entries(ListingCondition).map(([key, val]) => {
                const label = key === 'New' ? 'নতুন' : key === 'LikeNew' ? 'প্রায় নতুন' : 'ব্যবহৃত';
                return (
                  <label key={val} className="checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={selectedConditions.includes(val)}
                      onChange={() => toggleCondition(val)}
                    />
                    <span>{label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="filter-section">
            <h4>লোকেশন</h4>
            <div className="location-selects">
              <select className="input" value={division} onChange={handleDivisionChange}>
                <option value="">সকল বিভাগ</option>
                {DIVISIONS.map(div => <option key={div} value={div}>{div}</option>)}
              </select>
              
              {division && DISTRICTS[division] && (
                <select className="input" value={district} onChange={handleDistrictChange}>
                  <option value="">সকল জেলা</option>
                  {DISTRICTS[division].map(dist => <option key={dist} value={dist}>{dist}</option>)}
                </select>
              )}
              
              {district && THANAS[district] && (
                <select className="input" value={thana} onChange={(e) => { setThana(e.target.value); setCurrentPage(1); }}>
                  <option value="">সকল থানা/এলাকা</option>
                  {THANAS[district].map(th => <option key={th} value={th}>{th}</option>)}
                </select>
              )}
            </div>
          </div>

          <div className="filter-actions">
            <button className="btn btn-primary" onClick={() => setIsMobileFilterOpen(false)}>
              ফিল্টার প্রয়োগ করুন
            </button>
            <button className="btn btn-outline mt-3 w-100" onClick={resetFilters}>
              ফিল্টার রিসেট
            </button>
          </div>
        </aside>

        {/* Overlay for mobile filter */}
        {isMobileFilterOpen && (
          <div className="filter-overlay" onClick={() => setIsMobileFilterOpen(false)}></div>
        )}

        {/* Main Content */}
        <main className="browse-content">
          <div className="content-toolbar">
            <div className="breadcrumb">
              <Link to="/">হোম</Link>
              <ChevronRight size={14} />
              <Link to="/listings">বিজ্ঞাপন</Link>
              {selectedCategories.length > 0 && (
                <>
                  <ChevronRight size={14} />
                  <span>{breadcrumbCategory}</span>
                </>
              )}
            </div>

            <div className="toolbar-actions">
              <div className="result-count">
                {isLoading ? 'খোঁজা হচ্ছে...' : `${totalItems} টি বিজ্ঞাপন পাওয়া গেছে`}
              </div>
              
              <div className="toolbar-controls">
                <div className="sort-control">
                  <span className="hidden-mobile">সাজান:</span>
                  <select 
                    className="input-sm" 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="latest">নতুন পোস্ট</option>
                    <option value="price_asc">কম মূল্য</option>
                    <option value="price_desc">বেশি মূল্য</option>
                  </select>
                </div>
                
                <div className="view-toggle hidden-mobile">
                  <button 
                    className={`icon-btn ${viewMode === 'grid' ? 'active' : ''}`}
                    onClick={() => setViewMode('grid')}
                    title="Grid View"
                  >
                    <Grid size={18} />
                  </button>
                  <button 
                    className={`icon-btn ${viewMode === 'list' ? 'active' : ''}`}
                    onClick={() => setViewMode('list')}
                    title="List View"
                  >
                    <ListIcon size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Search bar for desktop */}
          <div className="desktop-search">
            <div className="search-input-wrapper">
              <Search size={20} className="search-icon" />
              <input 
                type="text" 
                placeholder="কী খুঁজছেন? (যেমন: আইফোন, ল্যাপটপ)" 
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="input search-input"
              />
              {searchQuery && (
                <button className="clear-search" onClick={() => { setSearchQuery(''); setCurrentPage(1); }}>
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Listings Display */}
          <div className="listings-container">
            {isLoading ? (
              <div className={viewMode === 'grid' ? 'listings-grid' : 'listings-list'}>
                {[...Array(limit)].map((_, i) => (
                  <div key={i} className="listing-skeleton"></div>
                ))}
              </div>
            ) : error ? (
              <div className="error-state">
                <p>লোড করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।</p>
                <button className="btn btn-outline" onClick={() => window.location.reload()}>রিলোড করুন</button>
              </div>
            ) : listings.length > 0 ? (
              <>
                <div className={viewMode === 'grid' ? 'listings-grid' : 'listings-list'}>
                  {listings.map(listing => (
                    viewMode === 'grid' 
                      ? <ListingCard key={listing.id} listing={listing} />
                      : <ListingCardList key={listing.id} listing={listing} />
                  ))}
                </div>
                <Pagination 
                  currentPage={currentPage} 
                  totalPages={totalPages} 
                  onPageChange={setCurrentPage} 
                />
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">
                  <Search size={48} />
                </div>
                <h3>কোন বিজ্ঞাপন পাওয়া যায়নি</h3>
                <p>আপনার ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন</p>
                <button className="btn btn-primary mt-3" onClick={resetFilters}>
                  ফিল্টার রিসেট করুন
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
