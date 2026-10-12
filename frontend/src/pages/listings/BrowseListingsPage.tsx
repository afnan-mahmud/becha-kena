import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { SlidersHorizontal, LayoutGrid, List as ListIcon, X, Search, RotateCcw } from 'lucide-react';
import { getListings } from '../../services/listing.service';
import { ListingCard, ListingCardSkeleton } from '../../components/ui/ListingCard';
import { ListingCardList } from '../../components/ui/ListingCardList';
import { Pagination } from '../../components/common/Pagination';
import { SEOHead } from '../../components/common/SEOHead';
import { useDebounce } from '../../hooks/useDebounce';
import { CATEGORIES, CONDITIONS, SORT_OPTIONS, getCategoryLabel, getConditionLabel } from '../../utils/constants';
import { DIVISIONS, DISTRICTS, THANAS } from '../../utils/locations';
import { formatNumber, formatPrice } from '../../utils/formatters';
import type { ListingConditionValue, ListingSort } from '../../types';
import './BrowseListingsPage.css';

const PAGE_SIZE = 12;
const FILTER_KEYS = ['search', 'category', 'condition', 'minPrice', 'maxPrice', 'division', 'district', 'thana', 'sort'] as const;

export const BrowseListingsPage = () => {
  const [params, setParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);

  // The URL is the single source of truth for filters
  const get = (key: string) => params.get(key) || '';
  const page = Math.max(1, Number(params.get('page')) || 1);

  const update = (changes: Record<string, string | undefined>, resetPage = true) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (resetPage) next.delete('page');
    setParams(next, { replace: true });
  };

  // Free-text fields are debounced before they hit the URL / API
  const [searchText, setSearchText] = useState(get('search'));
  const [minPrice, setMinPrice] = useState(get('minPrice'));
  const [maxPrice, setMaxPrice] = useState(get('maxPrice'));
  const debouncedSearch = useDebounce(searchText, 450);
  const debouncedMin = useDebounce(minPrice, 450);
  const debouncedMax = useDebounce(maxPrice, 450);

  useEffect(() => { setSearchText(params.get('search') || ''); }, [params.get('search')]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (debouncedSearch !== get('search') || debouncedMin !== get('minPrice') || debouncedMax !== get('maxPrice')) {
      update({ search: debouncedSearch.trim() || undefined, minPrice: debouncedMin || undefined, maxPrice: debouncedMax || undefined });
    }
  }, [debouncedSearch, debouncedMin, debouncedMax]); // eslint-disable-line react-hooks/exhaustive-deps

  const filters = useMemo(() => ({
    search: get('search') || undefined,
    category: get('category') || undefined,
    condition: (get('condition') || undefined) as ListingConditionValue | undefined,
    minPrice: get('minPrice') ? Number(get('minPrice')) : undefined,
    maxPrice: get('maxPrice') ? Number(get('maxPrice')) : undefined,
    division: get('division') || undefined,
    district: get('district') || undefined,
    thana: get('thana') || undefined,
    sort: (get('sort') || 'newest') as ListingSort,
    page,
    limit: PAGE_SIZE,
  }), [params]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['listings', 'browse', filters],
    queryFn: () => getListings(filters),
    placeholderData: keepPreviousData,
  });

  const listings = data?.data?.listings || [];
  const total = data?.data?.total || 0;
  const totalPages = data?.data?.totalPages || 1;

  const activeChips = [
    filters.category && { key: 'category', label: getCategoryLabel(filters.category) },
    filters.condition && { key: 'condition', label: getConditionLabel(filters.condition) },
    filters.division && { key: 'division', label: [filters.thana, filters.district, filters.division].filter(Boolean).join(', ') },
    (filters.minPrice !== undefined || filters.maxPrice !== undefined) && {
      key: 'price',
      label: `${filters.minPrice !== undefined ? formatPrice(filters.minPrice) : '৳০'} – ${filters.maxPrice !== undefined ? formatPrice(filters.maxPrice) : 'যেকোনো'}`,
    },
  ].filter(Boolean) as { key: string; label: string }[];

  const removeChip = (key: string) => {
    if (key === 'division') return update({ division: undefined, district: undefined, thana: undefined });
    if (key === 'price') {
      setMinPrice('');
      setMaxPrice('');
      return update({ minPrice: undefined, maxPrice: undefined });
    }
    update({ [key]: undefined });
  };

  const resetAll = () => {
    setSearchText('');
    setMinPrice('');
    setMaxPrice('');
    const next = new URLSearchParams(params);
    FILTER_KEYS.forEach((k) => next.delete(k));
    next.delete('page');
    setParams(next, { replace: true });
  };

  // Lock page scroll while the mobile filter sheet is open
  useEffect(() => {
    document.body.style.overflow = filtersOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [filtersOpen]);

  const title = filters.category ? getCategoryLabel(filters.category) : filters.search ? `"${filters.search}" এর ফলাফল` : 'সব বিজ্ঞাপন';

  return (
    <div className="browse container">
      <SEOHead title={`${title} — বেচা-কেনা`} description="বাংলাদেশ জুড়ে যাচাইকৃত বিক্রেতাদের বিজ্ঞাপন দেখুন।" />

      <div className="browse__top">
        <div>
          <h1 className="browse__title">{title}</h1>
          <p className="browse__count">
            {isLoading ? 'খোঁজা হচ্ছে…' : `${formatNumber(total)}টি বিজ্ঞাপন পাওয়া গেছে`}
          </p>
        </div>

        <div className="browse__search">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="এই পেজে খুঁজুন…"
            aria-label="বিজ্ঞাপন খুঁজুন"
          />
        </div>
      </div>

      <div className="browse__layout">
        {filtersOpen && <div className="browse__backdrop" onClick={() => setFiltersOpen(false)} />}

        <aside className={`filters ${filtersOpen ? 'is-open' : ''}`} aria-label="ফিল্টার">
          <div className="filters__head">
            <h2><SlidersHorizontal size={18} /> ফিল্টার</h2>
            <button type="button" className="text-link-sm" onClick={resetAll}><RotateCcw size={14} /> রিসেট</button>
            <button type="button" className="icon-btn filters__close" onClick={() => setFiltersOpen(false)} aria-label="বন্ধ করুন">
              <X size={20} />
            </button>
          </div>

          <div className="filters__section">
            <h3>ক্যাটাগরি</h3>
            <div className="filters__cats">
              <button type="button" className={`filters__cat ${!filters.category ? 'active' : ''}`} onClick={() => update({ category: undefined })}>
                🗂️ সব ক্যাটাগরি
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat.value}
                  className={`filters__cat ${filters.category === cat.value ? 'active' : ''}`}
                  onClick={() => update({ category: cat.value })}
                >
                  <span aria-hidden="true">{cat.emoji}</span> {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="filters__section">
            <h3>অবস্থান</h3>
            <select className="input" value={filters.division || ''} onChange={(e) => update({ division: e.target.value || undefined, district: undefined, thana: undefined })} aria-label="বিভাগ">
              <option value="">সব বিভাগ</option>
              {DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            {filters.division && (
              <select className="input" value={filters.district || ''} onChange={(e) => update({ district: e.target.value || undefined, thana: undefined })} aria-label="জেলা">
                <option value="">সব জেলা</option>
                {DISTRICTS[filters.division]?.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            )}
            {filters.district && (
              <select className="input" value={filters.thana || ''} onChange={(e) => update({ thana: e.target.value || undefined })} aria-label="থানা">
                <option value="">সব থানা</option>
                {THANAS[filters.district]?.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            )}
          </div>

          <div className="filters__section">
            <h3>দাম (৳)</h3>
            <div className="filters__price">
              <input type="number" min={0} inputMode="numeric" className="input" placeholder="সর্বনিম্ন" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} aria-label="সর্বনিম্ন দাম" />
              <span>–</span>
              <input type="number" min={0} inputMode="numeric" className="input" placeholder="সর্বোচ্চ" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} aria-label="সর্বোচ্চ দাম" />
            </div>
          </div>

          <div className="filters__section">
            <h3>পণ্যের অবস্থা</h3>
            <div className="filters__chips">
              <button type="button" className={`chip ${!filters.condition ? 'active' : ''}`} onClick={() => update({ condition: undefined })}>সব</button>
              {CONDITIONS.map((c) => (
                <button type="button" key={c.value} className={`chip ${filters.condition === c.value ? 'active' : ''}`} onClick={() => update({ condition: c.value })}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <button type="button" className="btn btn-primary btn-block filters__apply" onClick={() => setFiltersOpen(false)}>
            {formatNumber(total)}টি ফলাফল দেখুন
          </button>
        </aside>

        <section className="browse__results" aria-busy={isFetching}>
          <div className="browse__toolbar">
            <button type="button" className="btn btn-outline btn-sm browse__filter-btn" onClick={() => setFiltersOpen(true)}>
              <SlidersHorizontal size={16} /> ফিল্টার
              {activeChips.length > 0 && <span className="browse__filter-count">{formatNumber(activeChips.length)}</span>}
            </button>

            <div className="browse__chips">
              {activeChips.map((chip) => (
                <button type="button" key={chip.key} className="chip active" onClick={() => removeChip(chip.key)}>
                  {chip.label} <X size={14} />
                </button>
              ))}
            </div>

            <div className="browse__tools">
              <select className="input input-sm" value={filters.sort} onChange={(e) => update({ sort: e.target.value === 'newest' ? undefined : e.target.value })} aria-label="সাজান">
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <div className="view-toggle" role="group" aria-label="দেখার ধরন">
                <button type="button" className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')} aria-label="গ্রিড"><LayoutGrid size={18} /></button>
                <button type="button" className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')} aria-label="লিস্ট"><ListIcon size={18} /></button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="listings-grid">
              {Array.from({ length: 8 }).map((_, i) => <ListingCardSkeleton key={i} />)}
            </div>
          ) : isError ? (
            <div className="empty-state">
              <p>বিজ্ঞাপন লোড করা যায়নি।</p>
              <button type="button" className="btn btn-outline btn-sm mt-3" onClick={() => refetch()}>আবার চেষ্টা করুন</button>
            </div>
          ) : listings.length === 0 ? (
            <div className="empty-state browse__empty">
              <div className="browse__empty-emoji" aria-hidden="true">🔍</div>
              <h3>কোনো বিজ্ঞাপন পাওয়া যায়নি</h3>
              <p>অন্য কিওয়ার্ড দিয়ে খুঁজুন অথবা কিছু ফিল্টার সরিয়ে দেখুন।</p>
              {activeChips.length > 0 && <button type="button" className="btn btn-outline btn-sm mt-3" onClick={resetAll}>সব ফিল্টার মুছুন</button>}
            </div>
          ) : viewMode === 'grid' ? (
            <div className={`listings-grid browse__grid ${isFetching ? 'is-fetching' : ''}`}>
              {listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
            </div>
          ) : (
            <div className={`browse__list ${isFetching ? 'is-fetching' : ''}`}>
              {listings.map((listing) => <ListingCardList key={listing.id} listing={listing} />)}
            </div>
          )}

          <div className="browse__pagination">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => {
                update({ page: p > 1 ? String(p) : undefined }, false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        </section>
      </div>
    </div>
  );
};
