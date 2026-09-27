import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  User,
  Search,
  ChevronDown,
  ChevronUp,
  MapPin,
  List,
  GripVertical,
  Check,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Customer, MonthBill } from '../types';

interface CustomerSelectDropdownProps {
  customers: Customer[];
  bills: MonthBill[];
  selectedCustomerId: string;
  onSelectCustomer: (customerId: string) => void;
  label?: string;
  accentColor?: 'emerald' | 'rose' | 'sky';
  initiallyOpen?: boolean;
}

export const CustomerSelectDropdown: React.FC<CustomerSelectDropdownProps> = ({
  customers,
  bills,
  selectedCustomerId,
  onSelectCustomer,
  label = 'ग्राहक चुनें (Customer)',
  accentColor = 'sky',
  initiallyOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(initiallyOpen);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRoute, setSelectedRoute] = useState<string>('all');
  const [onlyDueFilter, setOnlyDueFilter] = useState<boolean>(false);
  const [dropdownMode, setDropdownMode] = useState<'searchable' | 'native'>('searchable');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click (if not locked open)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && dropdownMode === 'searchable') {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, dropdownMode]);

  // Map of bills by customerId
  const billMap = useMemo(() => {
    const map = new Map<string, MonthBill>();
    bills.forEach((b) => map.set(b.customerId, b));
    return map;
  }, [bills]);

  // Selected customer
  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  const selectedBill = selectedCustomer ? billMap.get(selectedCustomer.id) : null;
  const currentBalance = selectedBill
    ? selectedBill.remainingDue
    : selectedCustomer?.oldDue || 0;

  // Available unique routes
  const availableRoutes = useMemo(() => {
    const map = new Map<string, number>();
    customers.forEach((c) => {
      const r = c.route?.trim() || 'अन्य';
      map.set(r, (map.get(r) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [customers]);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return customers.filter((c) => {
      // Route filter
      if (selectedRoute !== 'all') {
        const cRoute = c.route?.trim() || 'अन्य';
        if (cRoute !== selectedRoute) return false;
      }

      const bill = billMap.get(c.id);
      const due = bill ? bill.remainingDue : c.oldDue || 0;

      // Only due filter
      if (onlyDueFilter && due <= 0) {
        return false;
      }

      // Search query
      if (q) {
        const name = (c.name || '').toLowerCase();
        const code = (c.customerCode || '').toLowerCase();
        const phone = (c.phone || '').toLowerCase();
        const route = (c.route || '').toLowerCase();
        const address = (c.address || '').toLowerCase();
        return (
          name.includes(q) ||
          code.includes(q) ||
          phone.includes(q) ||
          route.includes(q) ||
          address.includes(q)
        );
      }

      return true;
    });
  }, [customers, billMap, selectedRoute, onlyDueFilter, searchQuery]);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, custId: string) => {
    e.dataTransfer.setData('text/plain', custId);
    e.dataTransfer.setData('application/json', JSON.stringify({ customerId: custId }));
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const custId = e.dataTransfer.getData('text/plain');
    if (custId && customers.some((c) => c.id === custId)) {
      onSelectCustomer(custId);
      setIsOpen(false);
    }
  };

  const handleSelect = (custId: string) => {
    onSelectCustomer(custId);
    setIsOpen(false);
  };

  const colorStyles = {
    emerald: {
      borderActive: 'border-emerald-500 ring-2 ring-emerald-200',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      highlightBg: 'bg-emerald-50',
      dropActive: 'border-emerald-500 bg-emerald-50/70',
      textAccent: 'text-emerald-700',
    },
    rose: {
      borderActive: 'border-rose-500 ring-2 ring-rose-200',
      badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
      highlightBg: 'bg-rose-50',
      dropActive: 'border-rose-500 bg-rose-50/70',
      textAccent: 'text-rose-700',
    },
    sky: {
      borderActive: 'border-sky-500 ring-2 ring-sky-200',
      badgeBg: 'bg-sky-100 text-sky-800 border-sky-300',
      highlightBg: 'bg-sky-50',
      dropActive: 'border-sky-500 bg-sky-50/70',
      textAccent: 'text-sky-700',
    },
  }[accentColor];

  return (
    <div className="space-y-1.5" ref={containerRef}>
      {/* Label and Mode Switcher */}
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-bold text-stone-800 flex items-center gap-1.5">
          <User className="w-4 h-4 text-stone-600" />
          <span>{label}</span>
          <span className="text-xs font-normal text-stone-500">
            (कुल {customers.length} ग्राहक) <span className="text-rose-500">*</span>
          </span>
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              setDropdownMode(dropdownMode === 'searchable' ? 'native' : 'searchable')
            }
            className="text-xs text-stone-600 hover:text-stone-900 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            title="ड्रॉपडाउन का प्रकार बदलें"
          >
            <List className="w-3.5 h-3.5" />
            <span>
              {dropdownMode === 'searchable' ? 'साधारण सेलेक्ट' : 'सर्च व ड्रैग'}
            </span>
          </button>
        </div>
      </div>

      {dropdownMode === 'native' ? (
        /* Native OS HTML <select> Dropdown */
        <div>
          <select
            value={selectedCustomerId}
            onChange={(e) => onSelectCustomer(e.target.value)}
            className="w-full px-3.5 py-2.5 text-base sm:text-sm font-bold border-2 border-stone-300 bg-white rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-none shadow-xs text-stone-900 cursor-pointer"
          >
            <option value="" disabled>
              -- ग्राहक चुनें (कुल {customers.length} ग्राहक) --
            </option>
            {customers.map((c) => {
              const bill = billMap.get(c.id);
              const due = bill ? bill.remainingDue : c.oldDue || 0;
              return (
                <option key={c.id} value={c.id}>
                  #{c.customerCode} - {c.name} ({c.route}){' '}
                  {due > 0 ? `[बकाया: ₹${due}]` : '[चुक्ता]'}
                </option>
              );
            })}
          </select>
        </div>
      ) : (
        /* Searchable Custom Dropdown with Drag-and-Drop Drop Zone */
        <div className="relative">
          {/* Main Selected Customer Display & Drag-and-Drop Zone */}
          <div
            onClick={() => setIsOpen(!isOpen)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`w-full p-3 bg-white border-2 rounded-xl flex items-center justify-between cursor-pointer transition-all shadow-2xs select-none ${
              isDragOver
                ? `${colorStyles.dropActive} border-dashed ring-2 ring-emerald-300`
                : isOpen
                ? colorStyles.borderActive
                : 'border-stone-300 hover:border-stone-400'
            }`}
          >
            {isDragOver ? (
              <div className="w-full py-1 text-center font-bold text-sm text-emerald-800 flex items-center justify-center gap-1.5 animate-pulse">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>🎯 ग्राहक को यहाँ छोड़ें (Drop to Select)</span>
              </div>
            ) : selectedCustomer ? (
              <div className="flex items-center gap-2.5 overflow-hidden flex-1 mr-2">
                <span
                  className={`font-mono text-xs sm:text-sm font-black px-2 py-0.5 rounded border shrink-0 ${colorStyles.badgeBg}`}
                >
                  #{selectedCustomer.customerCode}
                </span>
                <div className="text-left truncate">
                  <div className="text-sm sm:text-base font-bold text-stone-900 truncate flex items-center gap-1.5">
                    <span>{selectedCustomer.name}</span>
                    {selectedCustomer.phone && (
                      <span className="text-xs font-mono text-stone-500 font-normal">
                        ({selectedCustomer.phone})
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-stone-500 flex items-center gap-2 mt-0.5 truncate">
                    <span className="flex items-center gap-0.5">
                      <MapPin className="w-3 h-3 text-stone-400" />
                      {selectedCustomer.route}
                    </span>
                    {selectedCustomer.address && (
                      <span className="truncate text-stone-400">
                        • {selectedCustomer.address}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-left">
                <span className="text-sm sm:text-base text-stone-500 font-medium block">
                  ग्राहक चुनें या नीचे से ड्रैग करें...
                </span>
                <span className="text-xs text-stone-400">
                  (यहाँ क्लिक करके सभी {customers.length} ग्राहक देखें)
                </span>
              </div>
            )}

            {!isDragOver && (
              <div className="flex items-center gap-2 shrink-0 ml-1">
                {selectedCustomer && (
                  <span
                    className={`font-mono text-xs sm:text-sm font-bold px-2 py-1 rounded border ${
                      currentBalance > 0
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {currentBalance > 0 ? `बकाया: ₹${currentBalance}` : 'चुक्ता'}
                  </span>
                )}
                {isOpen ? (
                  <ChevronUp className="w-5 h-5 text-stone-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-stone-500" />
                )}
              </div>
            )}
          </div>

          {/* Drag & Drop Visual Hint */}
          <div className="flex items-center justify-between text-xs text-stone-500 px-1 pt-1">
            <span className="flex items-center gap-1">
              <span>💡</span>
              <span>
                {isOpen
                  ? 'सूची से ग्राहक पर क्लिक करें'
                  : 'ग्राहक बदलने के लिए ऊपर क्लिक करें'}
              </span>
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(!isOpen);
              }}
              className="text-stone-700 hover:text-stone-900 font-bold underline cursor-pointer"
            >
              {isOpen ? 'सूची बंद करें ✕' : 'सूची खोलें ▼'}
            </button>
          </div>

          {/* Dropdown Menu Panel (Displays ALL Customers with search & drag support) */}
          {isOpen && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border-2 border-stone-300 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-80 animate-fadeIn">
              {/* Search & Filters Bar */}
              <div className="p-2.5 border-b border-stone-200 bg-stone-50 space-y-2 shrink-0">
                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ग्राहक का नाम, कोड, मोबाइल या एरिया खोजें..."
                    className="w-full pl-9 pr-8 py-2 text-sm sm:text-base border border-stone-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white font-medium"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600 text-sm cursor-pointer p-0.5"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Route Filter and Due Toggle Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedRoute('all')}
                    className={`px-2.5 py-1 rounded-full font-bold whitespace-nowrap cursor-pointer transition-colors ${
                      selectedRoute === 'all'
                        ? 'bg-stone-800 text-white'
                        : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                    }`}
                  >
                    सभी ({customers.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setOnlyDueFilter(!onlyDueFilter)}
                    className={`px-2.5 py-1 rounded-full font-bold whitespace-nowrap cursor-pointer transition-colors ${
                      onlyDueFilter
                        ? 'bg-rose-600 text-white'
                        : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                    }`}
                  >
                    {onlyDueFilter ? '✓ सिर्फ बकाया' : 'सिर्फ बकाया'}
                  </button>

                  {availableRoutes.map(([r, count]) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedRoute(r)}
                      className={`px-2.5 py-1 rounded-full font-medium whitespace-nowrap cursor-pointer transition-colors ${
                        selectedRoute === r
                          ? 'bg-sky-700 text-white font-bold'
                          : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                      }`}
                    >
                      {r} ({count})
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer List Items (Draggable and Clickable) */}
              <div className="overflow-y-auto flex-1 divide-y divide-stone-100 p-1">
                {filteredCustomers.length === 0 ? (
                  <div className="p-6 text-center text-sm text-stone-500">
                    <p className="font-semibold text-stone-700">कोई ग्राहक नहीं मिला।</p>
                    <p className="text-xs text-stone-400 mt-1">
                      खोज शब्द बदलें या रूट फ़िल्टर रीसेट करें।
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedRoute('all');
                        setOnlyDueFilter(false);
                      }}
                      className="mt-2 text-sky-700 font-bold underline cursor-pointer text-sm"
                    >
                      सभी ग्राहक पुनः दिखाएं
                    </button>
                  </div>
                ) : (
                  filteredCustomers.map((c) => {
                    const bill = billMap.get(c.id);
                    const due = bill ? bill.remainingDue : c.oldDue || 0;
                    const isSelected = c.id === selectedCustomerId;

                    return (
                      <div
                        key={c.id}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, c.id)}
                        onClick={() => handleSelect(c.id)}
                        className={`p-2.5 rounded-xl flex items-center justify-between text-sm cursor-pointer transition-all hover:bg-sky-50/80 group ${
                          isSelected
                            ? `${colorStyles.highlightBg} ring-1 ring-inset ring-sky-300 font-bold`
                            : ''
                        }`}
                        title="क्लिक करके चुनें या ऊपर ड्रैग करें"
                      >
                        {/* Drag Handle & Info */}
                        <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                          <span
                            className="text-stone-300 group-hover:text-stone-500 cursor-grab active:cursor-grabbing p-0.5"
                            title="ड्रैग करने के लिए पकड़ें"
                          >
                            <GripVertical className="w-4 h-4" />
                          </span>

                          <span className="font-mono text-xs font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded border border-stone-200 shrink-0">
                            #{c.customerCode}
                          </span>

                          <div className="text-left truncate">
                            <div className="text-sm text-stone-900 truncate font-semibold">
                              {c.name}
                            </div>
                            <div className="text-xs text-stone-500 flex items-center gap-2 mt-0.5 truncate">
                              <span className="flex items-center gap-0.5">
                                <MapPin className="w-3 h-3 text-stone-400" />
                                {c.route}
                              </span>
                              {c.phone && (
                                <span className="font-mono text-stone-500">
                                  📞 {c.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Due Badge and Selection Tick */}
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span
                            className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                              due > 0
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {due > 0 ? `₹${due}` : 'चुक्ता'}
                          </span>
                          {isSelected && (
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer status */}
              <div className="p-2.5 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-500 shrink-0">
                <span>
                  दिखाए गए: <strong>{filteredCustomers.length}</strong> / कुल{' '}
                  <strong>{customers.length}</strong> ग्राहक
                </span>
                <span className="text-xs text-stone-400">
                  👆 ग्राहक पर 1-क्लिक करें
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
