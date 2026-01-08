import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Search, Menu, Plus, Minus, Trash2 } from 'lucide-react';
import { getProducts, getProductsByCategory, searchProducts, urlFor } from './lib/sanity';
import { initiatePayment } from './lib/payhere';
import type { Product, CartItem } from './types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { motion, useScroll, useTransform } from 'framer-motion';

const CATEGORIES = ['All', 'Shirts', 'Dresses', 'Tops', 'Skirts', 'Pants'];
const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 0 }).format(price);

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Scroll animation setup
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] });

  // Section transforms
  const heroScale = useTransform(scrollYProgress, [0, 0.33], [1, 0.95]);
  const heroRotate = useTransform(scrollYProgress, [0, 0.33], [0, -3]);
  const productsScale = useTransform(scrollYProgress, [0.33, 0.66], [0.95, 1]);
  const productsRotate = useTransform(scrollYProgress, [0.33, 0.66], [3, 0]);
  const footerScale = useTransform(scrollYProgress, [0.66, 1], [0.95, 1]);
  const footerRotate = useTransform(scrollYProgress, [0.66, 1], [3, 0]);

  useEffect(() => { fetchProducts(); }, [selectedCategory]);

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = selectedCategory === 'all' ? await getProducts() : await getProductsByCategory(selectedCategory);
      setProducts(data);
    } catch {
      setError('Failed to load products. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return fetchProducts();
    setIsLoading(true);
    try {
      setProducts(await searchProducts(searchQuery));
    } catch {
      setError('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = (product: Product) => setCart(prev => {
    const existing = prev.find(item => item._id === product._id);
    return existing
      ? prev.map(item => item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item)
      : [...prev, { ...product, quantity: 1 }];
  });

  const updateQuantity = (id: string, delta: number) =>
    setCart(prev => prev.map(item => item._id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item).filter(item => item.quantity > 0));

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    await initiatePayment(cart, cartTotal, () => setCart([]));
  };

  const selectCategory = (cat: string) => {
    setSelectedCategory(cat);
    setIsMobileMenuOpen(false);
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Handmade Threads Logo" className="h-20 w-20" />
            <span className="sr-only">Handmade Threads</span>
          </a>
          <nav className="hidden md:flex gap-2">
            {CATEGORIES.map(cat => (
              <Button key={cat} variant={selectedCategory === cat.toLowerCase() ? 'default' : 'ghost'} onClick={() => selectCategory(cat.toLowerCase())}>
                {cat}
              </Button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <form onSubmit={handleSearch} className="hidden sm:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..." className="pl-10 w-64" />
              </div>
            </form>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center">{cartCount}</Badge>}
                </Button>
              </SheetTrigger>
              <SheetContent className="flex flex-col">
                <SheetHeader><SheetTitle>Shopping Cart</SheetTitle></SheetHeader>
                <div className="flex-1 overflow-y-auto py-4">
                  {cart.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-30" />
                      <p>Your cart is empty</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cart.map(item => (
                        <div key={item._id} className="flex gap-3 p-3 bg-muted rounded-lg">
                          <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded" />
                          <div className="flex-1">
                            <p className="font-medium line-clamp-1">{item.name}</p>
                            <p className="text-primary font-semibold">{formatPrice(item.price)}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item._id, -1)}><Minus className="h-3 w-3" /></Button>
                              <span className="w-6 text-center">{item.quantity}</span>
                              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item._id, 1)}><Plus className="h-3 w-3" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto text-destructive" onClick={() => setCart(prev => prev.filter(i => i._id !== item._id))}><Trash2 className="h-3 w-3" /></Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {cart.length > 0 && (
                  <SheetFooter className="flex-col gap-4 border-t pt-4">
                    <div className="flex justify-between w-full text-lg font-semibold">
                      <span>Total:</span>
                      <span>{formatPrice(cartTotal)}</span>
                    </div>
                    <Button className="w-full" size="lg" onClick={handleCheckout}>Checkout</Button>
                  </SheetFooter>
                )}
              </SheetContent>
            </Sheet>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
        {isMobileMenuOpen && (
          <div className="md:hidden p-4 border-t space-y-4">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..." className="pl-10" />
              </div>
            </form>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <Button key={cat} variant={selectedCategory === cat.toLowerCase() ? 'default' : 'secondary'} size="sm" onClick={() => selectCategory(cat.toLowerCase())}>
                  {cat}
                </Button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Hero Section with scroll effect */}
      <motion.section
        style={{ scale: heroScale, rotate: heroRotate }}
        className="sticky top-0 z-10 bg-gradient-to-r from-primary to-purple-600 text-primary-foreground py-16 text-center"
      >
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Handcrafted with Love</h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">Discover our collection of unique, handmade clothing pieces crafted with care and tradition.</p>
        </div>
      </motion.section>

      {/* Products Section with scroll effect */}
      <motion.main
        style={{ scale: productsScale, rotate: productsRotate }}
        className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
      >
        {isLoading && <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" /></div>}
        {error && <div className="text-center py-12"><p className="text-destructive mb-4">{error}</p><Button onClick={fetchProducts}>Try Again</Button></div>}
        {!isLoading && !error && products.length === 0 && <p className="text-center py-12 text-muted-foreground text-lg">No products found.</p>}
        {!isLoading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map(product => (
              <ProductCard key={product._id} product={product} onAddToCart={addToCart} />
            ))}
          </div>
        )}
      </motion.main>

      {/* Footer Section with scroll effect */}
      <motion.footer
        style={{ scale: footerScale, rotate: footerRotate }}
        className="relative z-30 bg-card border-t py-12"
      >
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <img src="/logo.svg" alt="Handmade Threads Logo" className="h-10 w-10 mb-2" />
            <p className="text-muted-foreground">Every piece is crafted with care, bringing traditional craftsmanship to your wardrobe.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Categories</h4>
            <ul className="space-y-2">
              {CATEGORIES.slice(1).map(cat => (
                <li key={cat}><Button variant="link" className="p-0 h-auto text-muted-foreground" onClick={() => { selectCategory(cat.toLowerCase()); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>{cat}</Button></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li>Email: info@handmadethreads.lk</li>
              <li>Phone: +94 77 123 4567</li>
              <li>Colombo, Sri Lanka</li>
            </ul>
          </div>
        </div>
        <Separator className="my-8 max-w-7xl mx-auto" />
        <p className="text-center text-muted-foreground">&copy; 2026 Handmade Threads. All rights reserved.</p>
      </motion.footer>
    </div>
  );
}

function ProductCard({ product, onAddToCart }: { product: Product; onAddToCart: (p: Product) => void }) {
  const imageUrl = product.imageUrl || (product as unknown as { image?: { asset?: { _ref: string } } }).image?.asset?._ref
    ? urlFor((product as unknown as { image: { asset: { _ref: string } } }).image).width(400).height(400).url()
    : '/placeholder.jpg';

  return (
    <Card className="overflow-hidden group">
      <div className="relative aspect-square overflow-hidden">
        <img src={imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        {product.inStock === false && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Badge variant="secondary">Out of Stock</Badge></div>}
      </div>
      <CardContent className="p-4">
        <Badge variant="outline" className="mb-2">{product.category}</Badge>
        <h3 className="font-semibold line-clamp-1">{product.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{product.description}</p>
        <div className="flex items-center justify-between mt-4">
          <span className="text-xl font-bold">{formatPrice(product.price)}</span>
          <Button size="sm" disabled={product.inStock === false} onClick={() => onAddToCart(product)}>Add to Cart</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default App;
