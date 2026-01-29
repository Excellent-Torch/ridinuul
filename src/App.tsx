import { useState, useEffect, useRef, useCallback } from 'react';
import { ShoppingCart, Search, Menu, Plus, Minus, Trash2, Loader2 } from 'lucide-react';
import { getProducts, getProductsByCategory, searchProducts } from './lib/sanity';
import { initiatePayment, getPolicyLinks } from './lib/payhere';
import { recolorClothing, type LoadingStatus } from './lib/clothing-recolor';
import type { Product, CartItem } from './types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MagicCard } from "@/components/ui/magic-card";
import { Marquee } from "@/components/ui/marquee";

import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import TextAnimation from '@/components/ui/scroll-text';
import RotatingText from '@/components/RotatingText';


const CATEGORIES = ['All', 'Dresses', 'Tops', 'Skirts'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const COLORS = [
  { name: 'Black', value: '#000000' },
  { name: 'White', value: '#FFFFFF' },
  { name: 'Red', value: '#DC2626' },
  { name: 'Blue', value: '#2563EB' },
  { name: 'Green', value: '#16A34A' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Beige', value: '#D4A574' },
];

const REVIEWS = [
  { name: 'Ayesha M.', review: 'Absolutely love my new dress! The craftsmanship is exceptional and it fits perfectly.', rating: 5 },
  { name: 'Priya S.', review: 'Beautiful handmade tops. You can really feel the quality and attention to detail.', rating: 5 },
  { name: 'Nimali K.', review: 'Fast delivery and the skirt exceeded my expectations. Will definitely order again!', rating: 5 },
  { name: 'Dilini R.', review: 'The colors are vibrant and true to the photos. Amazing quality for the price.', rating: 4 },
  { name: 'Sachini W.', review: 'I get so many compliments when I wear my dress from here. Highly Recommended!!', rating: 5 },
  { name: 'Rashmi P.', review: 'Traditional designs with a Modern Twist. Perfect for any occasion!', rating: 5 },
  { name: 'Tharushi L.', review: 'The fabric quality is outstanding. Very comfortable to wear all day :)', rating: 4 },
  { name: 'Kavindi J.', review: 'Love supporting local artisans. These pieces are truly unique and Beautiful!', rating: 5 },
];

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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [recoloredImage, setRecoloredImage] = useState<string | null>(null);
  const [recolorStatus, setRecolorStatus] = useState<LoadingStatus>('idle');

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

 const addToCart = (product: Product, qty: number = 1, size?: string, color?: string) => {
    const cartId = `${product._id}-${size || 'default'}-${color || 'default'}`;
    setCart(prev => {
      const existing = prev.find(item => item._id === cartId);
      return existing
        ? prev.map(item => item._id === cartId ? { ...item, quantity: item.quantity + qty } : item)
        : [...prev, { ...product, _id: cartId, quantity: qty, size, color }];
    });
    setCartAnimation(true);
    setTimeout(() => setCartAnimation(false), 600);
    setTimeout(() => {
      cartSheetRef.current?.click();
    }, 100);
  };

  const openProductModal = (product: Product) => {
    setSelectedProduct(product);
    setSelectedSize('');
    setSelectedColor('');
    setQuantity(1);
    setRecoloredImage(null);
    setRecolorStatus('idle');
  };

  const closeProductModal = () => {
    setSelectedProduct(null);
    setSelectedSize('');
    setSelectedColor('');
    setQuantity(1);
    setRecoloredImage(null);
    setRecolorStatus('idle');
  };

  const handleColorSelect = useCallback(async (colorName: string, colorValue: string) => {
    setSelectedColor(colorName);
    if (!selectedProduct?.imageUrl) return;
    
    try {
      const recolored = await recolorClothing(
        selectedProduct.imageUrl,
        colorValue,
        setRecolorStatus
      );
      setRecoloredImage(recolored);
    } catch {
      setRecoloredImage(null);
    }
  }, [selectedProduct]);

  const handleAddFromModal = () => {
    if (selectedProduct) {
      addToCart(selectedProduct, quantity, selectedSize, selectedColor);
      closeProductModal();
    }
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
          >
              <img src="/logo.png" alt="Handmade Threads Logo" className="relative z-10 h-22 w-22 drop-shadow-[0_4px_32px_rgba(212,165,116,0.45)]" />
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
                            {(item.size || item.color) && (
                              <p className="text-xs text-muted-foreground">
                                {item.size && <span>Size: {item.size}</span>}
                                {item.size && item.color && <span> • </span>}
                                {item.color && <span>Color: {item.color}</span>}
                              </p>
                            )}
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
          <div className="flex flex-wrap items-center justify-center gap-2 text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg text-white">
            <TextAnimation
              text="Discover Unique, Handmade"
              variants={{
                hidden: { filter: 'blur(10px)', opacity: 0, y: 20 },
                visible: {
                  filter: 'blur(0px)',
                  opacity: 1,
                  y: 0,
                  transition: { ease: 'linear', duration: 0.5 },
                },
              }}
              classname="font-bold drop-shadow-lg normal-case text-white"
            />
            <RotatingText
              texts={['Dresses', 'Tops', 'Skirts']}
              mainClassName="px-2 sm:px-2 md:px-3 bg-primary text-primary-foreground overflow-hidden py-0.5 sm:py-1 md:py-2 justify-center rounded-lg"
              staggerFrom="last"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-120%" }}
              staggerDuration={0.025}
              splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              rotationInterval={2000}
            />
          </div>
        
          <p className="text-xl opacity-90 max-w-2xl mx-auto drop-shadow-md">
            Explore our curated collection of artisan-crafted pieces, made with care and tradition.
          </p>
        </div>
      </motion.section>

      {/* Customer Reviews Section */}
      <section className="relative z-20 bg-background py-12 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 mb-8">
          <h2 className="text-3xl font-bold text-center mb-2">What Our Customers Say</h2>
          <p className="text-muted-foreground text-center">Real reviews from our happy customers</p>
        </div>
        <Marquee pauseOnHover className="[--duration:30s]">
          {REVIEWS.map((review) => (
            <ReviewCard key={review.name} {...review} />
          ))}
        </Marquee>
        <Marquee pauseOnHover reverse className="[--duration:30s] mt-4">
          {REVIEWS.slice().reverse().map((review) => (
            <ReviewCard key={review.name + '-reverse'} {...review} />
          ))}
        </Marquee>
      </section>

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
                  <ProductCard product={product} onAddToCart={addToCart} onOpenModal={openProductModal} />
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
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <img src="/logo.png" alt="Handmade Threads Logo" className="h-20 w-20 mb-2" />
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
            <h4 className="font-semibold mb-4">Policies</h4>
            <ul className="space-y-2">
              {getPolicyLinks().map(policy => (
                <li key={policy.type}><a href={policy.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors text-sm">{policy.title}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li>Email: contact@ridinuul.com</li>
              <li>Phone: +94 71 237 6114</li>
              <li>Address: 2/5 Maharagewatha Delgahawatha, Angoda, Kotikwatta, Sri Lanka</li>
            </ul>
          </div>
        </div>
        <Separator className="my-8 max-w-7xl mx-auto" />
        <p className="text-center text-muted-foreground">&copy; 2026 ridinuul.com All rights reserved.</p>
      </motion.footer>

      {/* Product Detail Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && closeProductModal()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedProduct && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedProduct.name}</DialogTitle>
              </DialogHeader>
              <div className="grid md:grid-cols-2 gap-6 mt-4">
                {/* Product Image */}
                <div className="relative aspect-square overflow-hidden rounded-lg">
                  <img
                    src={recoloredImage || selectedProduct.imageUrl || '/placeholder.jpg'}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover transition-opacity duration-300"
                  />
                  {(recolorStatus === 'loading' || recolorStatus === 'processing') && (
                    <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                      <span className="text-white text-sm">
                        {recolorStatus === 'loading' ? 'Loading AI model...' : 'Applying color...'}
                      </span>
                    </div>
                  )}
                  {selectedProduct.inStock === false && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Badge variant="secondary" className="text-lg">Out of Stock</Badge>
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="space-y-4">
                  <Badge variant="outline">{selectedProduct.category}</Badge>
                  <p className="text-3xl font-bold text-primary">{formatPrice(selectedProduct.price)}</p>
                  <p className="text-muted-foreground">{selectedProduct.description}</p>

                  <Separator />

                  {/* Size Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Size</label>
                    <div className="flex flex-wrap gap-2">
                      {SIZES.map(size => (
                        <Button
                          key={size}
                          variant={selectedSize === size ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedSize(size)}
                          className="min-w-[3rem]"
                        >
                          {size}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Color Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Color {recolorStatus === 'loading' && '(Loading AI...)'}</label>
                    <div className="flex flex-wrap gap-2">
                      {COLORS.map(color => (
                        <button
                          key={color.name}
                          onClick={() => handleColorSelect(color.name, color.value)}
                          disabled={recolorStatus === 'loading' || recolorStatus === 'processing'}
                          className={`w-8 h-8 rounded-full border-2 transition-all disabled:opacity-50 ${
                            selectedColor === color.name
                              ? 'ring-2 ring-primary ring-offset-2'
                              : 'border-muted hover:scale-110'
                          }`}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                    {selectedColor && <p className="text-sm text-muted-foreground">Selected: {selectedColor}</p>}
                    <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                      ⚠️ AI Color Preview is approximate and sometimes doesn't work at all. Final product color may vary slightly.
                    </p>
                  </div>

                  {/* Quantity Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Quantity</label>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center text-lg font-medium">{quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Add to Cart Button */}
                  <Button
                    size="lg"
                    className="w-full"
                    disabled={selectedProduct.inStock === false}
                    onClick={handleAddFromModal}
                  >
                    {selectedProduct.inStock === false ? 'Out of Stock' : `Add to Cart - ${formatPrice(selectedProduct.price * quantity)}`}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProductCard({ product, onAddToCart, onOpenModal }: { product: Product; onAddToCart: (p: Product) => void; onOpenModal: (p: Product) => void }) {
  const imageUrl = product.imageUrl || '/placeholder.jpg';

  return (
    <MagicCard className="overflow-hidden group cursor-pointer" onClick={() => onOpenModal(product)}>
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
          <Button size="sm" disabled={product.inStock === false} onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}>Quick Add</Button>
        </div>
      </CardContent>
    </MagicCard>
  );
}

function ReviewCard({ name, review, rating }: { name: string; review: string; rating: number }) {
  return (
    <div className="w-[300px] flex-shrink-0 rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-primary font-semibold">{name.charAt(0)}</span>
        </div>
        <div>
          <p className="font-medium text-sm">{name}</p>
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={i < rating ? 'text-yellow-500' : 'text-muted-foreground/30'}>★</span>
            ))}
          </div>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{review}</p>
    </div>
  );
}

export default App;
