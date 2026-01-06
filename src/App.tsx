import { useState, useEffect } from 'react';
import { ShoppingCart, Search, Menu, X, Plus, Minus, Trash2 } from 'lucide-react';
import { getProducts, getProductsByCategory, searchProducts, urlFor } from './lib/sanity';
import { initiatePayment } from './lib/payhere';
import type { Product, CartItem } from './types';

const CATEGORIES = [
  { label: 'All', value: 'all' },
  { label: 'Shirts', value: 'shirts' },
  { label: 'Dresses', value: 'dresses' },
  { label: 'Tops', value: 'tops' },
  { label: 'Skirts', value: 'skirts' },
  { label: 'Pants', value: 'pants' },
];

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let data: Product[];
      if (selectedCategory === 'all') {
        data = await getProducts();
      } else {
        data = await getProductsByCategory(selectedCategory);
      }
      setProducts(data);
    } catch (err) {
      setError('Failed to load products. Please try again later.');
      console.error('Error fetching products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchProducts();
      return;
    }
    setIsLoading(true);
    try {
      const data = await searchProducts(searchQuery);
      setProducts(data);
    } catch (err) {
      setError('Search failed. Please try again.');
      console.error('Error searching products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item._id === product._id);
      if (existingItem) {
        return prevCart.map((item) =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item._id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) =>
          item._id === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    await initiatePayment(cart, cartTotal, () => {
      setCart([]);
      setIsCartOpen(false);
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-gray-900">
                Handmade Threads
              </h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              {CATEGORIES.map((category) => (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    selectedCategory === category.value
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-gray-700 hover:text-indigo-600'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </nav>

            {/* Search & Cart */}
            <div className="flex items-center space-x-4">
              <form onSubmit={handleSearch} className="hidden sm:flex items-center">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </form>

              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-gray-700 hover:text-indigo-600 transition-colors"
              >
                <ShoppingCart className="h-6 w-6" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-gray-700"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t">
              <form onSubmit={handleSearch} className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </form>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((category) => (
                  <button
                    key={category.value}
                    onClick={() => {
                      setSelectedCategory(category.value);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category.value
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Handcrafted with Love
          </h2>
          <p className="text-xl text-indigo-100 max-w-2xl mx-auto">
            Discover our collection of unique, handmade clothing pieces crafted
            with care and tradition.
          </p>
        </div>
      </section>

      {/* Products Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchProducts}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onAddToCart={addToCart}
                formatPrice={formatPrice}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Handmade Threads</h3>
              <p className="text-gray-400">
                Every piece is crafted with care, bringing traditional
                craftsmanship to your wardrobe.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Categories</h4>
              <ul className="space-y-2 text-gray-400">
                {CATEGORIES.slice(1).map((cat) => (
                  <li key={cat.value}>
                    <button
                      onClick={() => {
                        setSelectedCategory(cat.value);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="hover:text-white transition-colors"
                    >
                      {cat.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Email: info@handmadethreads.lk</li>
                <li>Phone: +94 77 123 4567</li>
                <li>Colombo, Sri Lanka</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2026 Handmade Threads. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Cart Sidebar */}
      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onRemove={removeFromCart}
        onUpdateQuantity={updateQuantity}
        cartTotal={cartTotal}
        onCheckout={handleCheckout}
        formatPrice={formatPrice}
      />
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  formatPrice: (price: number) => string;
}

function ProductCard({ product, onAddToCart, formatPrice }: ProductCardProps) {
  const imageUrl = product.imageUrl || (product as unknown as { image?: { asset?: { _ref: string } } }).image?.asset?._ref 
    ? urlFor((product as unknown as { image: { asset: { _ref: string } } }).image).width(400).height(400).url()
    : '/placeholder.jpg';

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow group">
      <div className="relative aspect-square overflow-hidden">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {product.inStock === false && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-semibold text-lg">Out of Stock</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <span className="text-xs font-medium text-indigo-600 uppercase tracking-wide">
          {product.category}
        </span>
        <h3 className="text-lg font-semibold text-gray-900 mt-1 line-clamp-1">
          {product.name}
        </h3>
        <p className="text-gray-600 text-sm mt-1 line-clamp-2">
          {product.description}
        </p>
        <div className="flex items-center justify-between mt-4">
          <span className="text-xl font-bold text-gray-900">
            {formatPrice(product.price)}
          </span>
          <button
            onClick={() => onAddToCart(product)}
            disabled={product.inStock === false}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onRemove: (productId: string) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  cartTotal: number;
  onCheckout: () => void;
  formatPrice: (price: number) => string;
}

function CartSidebar({
  isOpen,
  onClose,
  cart,
  onRemove,
  onUpdateQuantity,
  cartTotal,
  onCheckout,
  formatPrice,
}: CartSidebarProps) {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-semibold">Shopping Cart</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Your cart is empty</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {cart.map((item) => (
                  <li
                    key={item._id}
                    className="flex gap-4 p-3 bg-gray-50 rounded-lg"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-md"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 line-clamp-1">
                        {item.name}
                      </h3>
                      <p className="text-indigo-600 font-semibold">
                        {formatPrice(item.price)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => onUpdateQuantity(item._id, -1)}
                          className="p-1 rounded bg-gray-200 hover:bg-gray-300"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="font-medium w-8 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item._id, 1)}
                          className="p-1 rounded bg-gray-200 hover:bg-gray-300"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onRemove(item._id)}
                          className="ml-auto p-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {cart.length > 0 && (
            <div className="border-t p-4 space-y-4">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total:</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>
              <button
                onClick={onCheckout}
                className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Checkout
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
