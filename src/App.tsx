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
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import TextAnimation from '@/components/ui/scroll-text';
import { Colors, Liquid } from '@/components/ui/liquid-gradient';

const LOGO_COLORS: Colors = {
  color1: '#cacacaff',
  color2: '#f1f1f1ff',
  color3: '#e7e6e6ff',
  color4: '#FCFCFE',
  color5: '#F9F9FD',
  color6: '#F5E6D3',
  color7: '#dbdbdbff',
  color8: '#e4ddd5ff',
  color9: '#c4c2bfff',
  color10: '#f0ebe5ff',
  color11: '#b4b4b4ff',
  color12: '#fdf9f5ff',
  color13: '#fdfdfdff',
  color14: '#fdfdfdff',
  color15: '#ebe8e6ff',
  color16: '#c2c2c2ff',
  color17: '#dad3ccff',
};


const CATEGORIES = ['All', 'Dresses', 'Tops', 'Skirts'];

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
  const [cartAnimation, setCartAnimation] = useState(false);
  const cartSheetRef = useRef<HTMLButtonElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [logoHovered, setLogoHovered] = useState(false);

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
  useEffect(() => {
      // Set isMobile on mount and on resize
      const checkMobile = () => setIsMobile(window.innerWidth < 640);
      checkMobile();
      window.addEventListener("resize", checkMobile);
      return () => window.removeEventListener("resize", checkMobile);
    }, []);
  

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

 const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item._id === product._id);
      return existing
        ? prev.map(item => item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item)
        : [...prev, { ...product, quantity: 1 }];
    });
    setCartAnimation(true);
    setTimeout(() => setCartAnimation(false), 600);
    setTimeout(() => {
      cartSheetRef.current?.click();
    }, 100); // Open cart after add
  };

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
          <a
            href="/"
            className="relative flex items-center gap-2 p-2 rounded-lg overflow-hidden"
            onMouseEnter={() => setLogoHovered(true)}
            onMouseLeave={() => setLogoHovered(false)}
          >
            {/* Aura/Shadow effect */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="absolute h-25 w-25 rounded-full bg-gradient-to-br from-yellow-200 via-yellow-100 to-transparent blur-2xl opacity-60 animate-pulse" />
            </div>
            {/* Liquid gradient background */}
            <div className="absolute inset-0 opacity-30">
              <Liquid isHovered={logoHovered} colors={LOGO_COLORS} />
            </div>
              <img src="/logo.png" alt="Handmade Threads Logo" className="relative z-10 h-12 w-12 drop-shadow-[0_4px_32px_rgba(212,165,116,0.45)]" />
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
                <Button
                  ref={cartSheetRef}
                  variant="ghost"
                  size="icon"
                  className={`relative ${cartAnimation ? 'animate-bounce' : ''}`}
                  aria-label="Open cart"
                >
                  <AnimatePresence>
                    {cartAnimation && (
                      <motion.div
                        initial={{ scale: 1, opacity: 1 }}
                        animate={{ scale: 1.3, opacity: 1 }}
                        exit={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 z-10"
                      >
                        <ShoppingCart className="h-5 w-5 text-primary" />
                      </motion.div>
                    )}
                  </AnimatePresence>
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
        className="sticky top-0 z-10 bg-black text-primary-foreground py-0 text-center h-[60vh] flex items-center justify-center overflow-hidden"
      >
        {/* Background video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
          src="/hero.mp4"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40 z-10" />
        {/* Content */}
        <div className="relative z-20 max-w-3xl mx-auto px-4 flex flex-col items-center justify-center h-full">
          <TextAnimation
            text="Discover Unique, Handmade Clothing"
            variants={{
              hidden: { filter: 'blur(10px)', opacity: 0, y: 20 },
              visible: {
              filter: 'blur(0px)',
              opacity: 1,
              y: 0,
              transition: { ease: 'linear', duration: 0.5},
            },
            }}
            classname="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg text-white normal-case"
          />
        
          <p className="text-xl opacity-90 max-w-2xl mx-auto drop-shadow-md">
            Explore our curated collection of artisan-crafted pieces, made with care and tradition.
          </p>
        </div>
      </motion.section>

       {/* Products Section with scroll effect */}
      <motion.main
        style={{ scale: productsScale, rotate: productsRotate }}
        className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
      >
        {!isLoading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product, idx) => {
              const delay = isMobile ? 0 : idx * 0.08;
              return (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 40, scale: 0.95, rotate: (idx % 2 === 0 ? -3 : 3) }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    rotate: 0,
                    transition: {
                      delay,
                      duration: 0.7,
                      type: "spring",
                      stiffness: 80,
                      damping: 12,
                    },
                  }}
                  exit={{
                    opacity: 0,
                    y: 40,
                    scale: 0.95,
                    rotate: (idx % 2 === 0 ? -3 : 3),
                    transition: {
                      delay,
                      duration: 0.7,
                      type: "spring",
                      stiffness: 80,
                      damping: 12,
                    },
                  }}
                  viewport={{ once: false, amount: 0.2 }}
                >
                  <ProductCard product={product} onAddToCart={addToCart} />
                </motion.div>
              );
            })}
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
            <img src="/logo.png" alt="Handmade Threads Logo" className="h-10 w-10 mb-2" />
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
              <li>Email: contact@ridinuul.com</li>
              <li>Phone: +94 71 237 6114</li>
              <li>Address: Kotikwatta, Sri Lanka</li>
            </ul>
          </div>
        </div>
        <Separator className="my-8 max-w-7xl mx-auto" />
        <p className="text-center text-muted-foreground">&copy; 2026 ridinuul.com All rights reserved.</p>
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
