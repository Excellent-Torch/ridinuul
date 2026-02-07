import { useEffect, useState } from 'react';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Separator } from './separator';
import type { Product } from '../../types';

type Props = {
  product?: Product | null;
};

const BUSINESS_NUMBER = '94712376114'; // WhatsApp number without +

export default function WhatsAppChat({ product }: Props) {
  const [open, setOpen] = useState(false);

  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  type LocalCartItem = { id: string; name: string; quantity: number; price?: string };
  const [cartItems, setCartItems] = useState<LocalCartItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemPrice, setNewItemPrice] = useState('');

  useEffect(() => {
    if (product) {
      const base = `Hi, I'm interested in *${product.name}*.`;
      setMessage(`${base}\nPlease help me with availability and custom order details.`);
    }
  }, [product]);

  // Auto-generate message when cart items or dialog opens
  const generateMessageDescription = (items: LocalCartItem[]) => {
    if (items.length === 0) {
      return product ? `Hi, I'm interested in *${product.name}*.\nPlease help me with availability and custom order details.` : 'Hi, I have a query about your products.';
    }

    const lines = ['🛍️ *Order Details:*', ''];
    items.forEach((item, idx) => {
      lines.push(`${idx + 1}. ${item.name} × ${item.quantity}${item.price ? ` (${item.price})` : ''}`);
    });
    lines.push('');
    lines.push('Please confirm my order and share payment details.');

    return lines.join('\n');
  };

  // Attempt to read cart items from the rendered cart DOM.
  // This avoids changing App.tsx while still allowing the chat to include current cart contents.
  const gatherCartItemsFromDOM = () => {
    if (typeof document === 'undefined') return [];

    // Find the element that contains the cart header text
    const textEls = Array.from(document.querySelectorAll('div, span, p, h1, h2, h3, h4, h5')) as HTMLElement[];
    const cartTitleEl = textEls.find(el => (el.textContent || '').trim() === 'Shopping Cart');

    // Walk up from the title until we find an ancestor that contains cart item markers (bg-muted)
    let scope: HTMLElement | null = cartTitleEl?.closest('div') || document.body as HTMLElement;
    let walker: HTMLElement | null = scope;
    while (walker && walker !== document.body) {
      if (walker.querySelector('.bg-muted')) { scope = walker; break; }
      walker = walker.parentElement;
    }

    const results: Array<{ name: string; quantity: number; price?: string }> = [];

    // Look specifically for item containers that use the cart's item styling (.bg-muted)
    const itemEls = Array.from(scope.querySelectorAll('.bg-muted')) as HTMLElement[];
    itemEls.forEach(el => {
      // Only accept entries that look like cart items: have an image and a product name element
      const img = el.querySelector('img');
      const nameEl = el.querySelector('p.font-medium') as HTMLElement | null;
      if (!img || !nameEl) return;

      const name = nameEl.textContent?.trim() || '';

      // Quantity is stored in a nearby span (numeric). Search descendant spans for numbers.
      const qtySpan = Array.from(el.querySelectorAll('span')).reverse().find(s => /\d+/.test((s.textContent || '').trim()));
      const quantity = qtySpan ? parseInt((qtySpan.textContent || '1').trim(), 10) || 1 : 1;

      const priceEl = el.querySelector('[class*="text-primary"]') as HTMLElement | null;
      const price = priceEl?.textContent?.trim();

      if (name) results.push({ name, quantity, price });
    });

    // Merge duplicates by name+price
    return results.reduce((acc: typeof results, cur) => {
      const ex = acc.find(a => a.name === cur.name && a.price === cur.price);
      if (ex) ex.quantity += cur.quantity;
      else acc.push({ ...cur });
      return acc;
    }, [] as typeof results);
  };

  // Try to ensure the cart sheet is open so its content is present in the DOM.
  // If it's closed, find the cart trigger button and click it, then wait for the sheet to render.
  const ensureCartSheetOpen = async (timeout = 1500) => {
    if (typeof document === 'undefined') return false;
    const hasCart = !!Array.from(document.querySelectorAll('div, h1, h2, h3, h4, h5, p')).find(el => (el.textContent || '').trim() === 'Shopping Cart');
    if (hasCart) return true;

    const trigger = document.querySelector('button[aria-label="Open cart"]') as HTMLElement | null;
    if (!trigger) return false;

    // click to open
    try { trigger.click(); } catch (e) { /* ignore */ }

    const start = Date.now();
    while (Date.now() - start < timeout) {
      const found = !!Array.from(document.querySelectorAll('div, h1, h2, h3, h4, h5, p')).find(el => (el.textContent || '').trim() === 'Shopping Cart');
      if (found) return true;
      // wait
      // eslint-disable-next-line no-await-in-loop
      await new Promise(res => setTimeout(res, 120));
    }
    return false;
  };

  const reset = () => {
    setName('');
    setMessage(product ? `Hi, I'm interested in *${product.name}*.\nPlease help me with availability and custom order details.` : '');
    setCartItems([]);
  };

  const openChat = async () => {
    // Ensure cart sheet is open so items can be read
    try {
      const opened = await ensureCartSheetOpen();
      if (opened) {
        const items = gatherCartItemsFromDOM();
        const normalized: LocalCartItem[] = items.map((it, idx) => ({ id: `${Date.now()}-${idx}`, name: it.name, quantity: it.quantity, price: it.price }));
        setCartItems(normalized);
        
        // Auto-generate message description from cart items
        setMessage(generateMessageDescription(normalized));

        // Close the cart sheet to restore UI state (click trigger again)
        const trigger = document.querySelector('button[aria-label="Open cart"]') as HTMLElement | null;
        try { trigger?.click(); } catch (e) { /* ignore */ }
      }
    } catch (err) {
      // ignore extraction errors
      // If cart couldn't be read, use default message
      setMessage(generateMessageDescription([]));
    }
    setOpen(true);
  };

  const addCustomItem = () => {
    const itemName = newItemName.trim();
    if (!itemName) return;
    const qty = Math.max(1, Number(newItemQty) || 1);
    const item: LocalCartItem = { id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`, name: itemName, quantity: qty, price: newItemPrice ? String(newItemPrice) : undefined };
    const updated = [...cartItems, item];
    setCartItems(updated);
    setMessage(generateMessageDescription(updated));
    setNewItemName('');
    setNewItemQty(1);
    setNewItemPrice('');
  };

  const removeCartItemAt = (id: string) => {
    const updated = cartItems.filter(i => i.id !== id);
    setCartItems(updated);
    setMessage(generateMessageDescription(updated));
  };

  const changeItemQuantity = (id: string, delta: number) => {
    const updated = cartItems.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i);
    setCartItems(updated);
    setMessage(generateMessageDescription(updated));
  };

  const closeChat = () => {
    setOpen(false);
    reset();
  };

  const sendToWhatsApp = () => {
    if (!name.trim()) {
      alert('Please enter your name');
      return;
    }

    const lines: string[] = [];
    lines.push(`*Name:* ${name}`);
    if (message) lines.push(message);

    const text = encodeURIComponent(lines.join('\n'));
    const url = `https://wa.me/${BUSINESS_NUMBER}?text=${text}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    closeChat();
  };

  return (
    <>
      <div className="fixed right-4 bottom-4 z-50 md:right-8 md:bottom-8">
        <button
          aria-label="Open WhatsApp chat"
          onClick={openChat}
          className="flex items-center gap-2 px-2 py-2 rounded-full bg-gradient-to-br from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-2xl dark:shadow-[0_25px_50px_rgba(255,255,255,0.04)] ring-1 ring-black/10 dark:ring-white/10"
        >
          <img src="/whatsapp.png" alt="WhatsApp" className="h-8 w-8 md:h-10 md:w-10 drop-shadow-lg dark:drop-shadow-[0_10px_8px_rgba(255,255,255,0.06)]" />
          <span className="hidden sm:inline">Order/Inquiry on WhatsApp</span>
        </button>
      </div>

      <Dialog open={open} onOpenChange={(v) => { if (!v) closeChat(); }}>
        <DialogContent className="w-[95vw] max-w-lg mx-auto rounded-lg shadow-2xl dark:shadow-[0_25px_50px_rgba(255,255,255,0.04)] border border-muted/10 bg-card overflow-hidden max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>WhatsApp Order</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4 overflow-y-auto max-h-[calc(90vh-150px)]">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name">Your Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>

            <Separator />

            {/* Cart Items Section */}
            {cartItems.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Cart Items</Label>
                  <span className="text-sm text-muted-foreground dark:text-white">{cartItems.length} item(s)</span>
                </div>
                <ul className="space-y-2">
                  {cartItems.map(item => (
                    <li key={item.id} className="flex items-center gap-2 p-2 rounded-md bg-muted text-sm">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.name}</div>
                        {item.price && <div className="text-xs text-muted-foreground dark:text-white">{item.price}</div>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => changeItemQuantity(item.id, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => changeItemQuantity(item.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={() => removeCartItemAt(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>

                <Separator className="my-3" />
              </div>
            )}

            {/* Add Custom Item */}
            <div className="space-y-2">
              <Label>Add custom item (Optional)</Label>
              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-6">
                  <Input
                    placeholder="Item name"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="col-span-3">
                  <Input
                    type="number"
                    min={1}
                    placeholder="Qty"
                    value={String(newItemQty)}
                    onChange={(e) => setNewItemQty(Math.max(1, parseInt(e.target.value || '1')))}
                    className="text-sm"
                  />
                </div>
                <div className="col-span-3">
                  <Input
                    placeholder="Price"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="col-span-12">
                  <Button
                    className="w-full text-sm"
                    size="sm"
                    onClick={addCustomItem}
                  >
                    Add Item
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            {/* Message Description */}
            <div className="space-y-2">
              <Label htmlFor="message">Message Description</Label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground dark:placeholder:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Your message will be auto-generated from your name and items..."
              />
              <p className="text-xs text-muted-foreground dark:text-white">You can edit the message before sending to WhatsApp.</p>
            </div>

            {/* Send Button */}
            <Button
              onClick={sendToWhatsApp}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              Send to WhatsApp
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
