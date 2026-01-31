import React, { useEffect, useState } from 'react';
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
  const [step, setStep] = useState(1);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  
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
    setStep(1);
    setName('');
    setPhone('');
    
    setMessage(product ? `Hi, I'm interested in *${product.name}* (ID: ${product._id}).\nPlease help me with availability and custom order details.` : '');
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

        // Close the cart sheet to restore UI state (click trigger again)
        const trigger = document.querySelector('button[aria-label="Open cart"]') as HTMLElement | null;
        try { trigger?.click(); } catch (e) { /* ignore */ }
      }
    } catch (err) {
      // ignore extraction errors
    }
    setOpen(true);
  };

  const addCustomItem = () => {
    const name = newItemName.trim();
    if (!name) return;
    const qty = Math.max(1, Number(newItemQty) || 1);
    const item: LocalCartItem = { id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`, name, quantity: qty, price: newItemPrice ? String(newItemPrice) : undefined };
    setCartItems((s) => {
      const existing = s.find(i => i.name === item.name && i.price === item.price);
      if (existing) {
        return s.map(i => i.id === existing.id ? { ...i, quantity: i.quantity + item.quantity } : i);
      }
      return [...s, item];
    });
    setNewItemName('');
    setNewItemQty(1);
    setNewItemPrice('');
  };

  const removeCartItemAt = (id: string) => setCartItems(s => s.filter(i => i.id !== id));

  const changeItemQuantity = (id: string, delta: number) => setCartItems(s => s.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));

  const closeChat = () => {
    setOpen(false);
    reset();
  };

  const sendToWhatsApp = () => {
    const lines: string[] = [];
    if (name) lines.push(`Name: ${name}`);
    if (phone) lines.push(`Phone: ${phone}`);
    if (product) lines.push(`Product: ${product.name} (${product._id})`);
    // product-specific size/color/quantity inputs removed from form
    if (cartItems && cartItems.length > 0) {
      lines.push('Cart Items:');
      cartItems.forEach(ci => lines.push(`- ${ci.name} x${ci.quantity}${ci.price ? ` (${ci.price})` : ''}`));
    }
    if (message) lines.push(`Message: ${message}`);

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
          className="flex items-center gap-2 px-2 py-2 rounded-full bg-gradient-to-br from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-2xl ring-1 ring-black/10"
        >
          <img src="/whatsapp.png" alt="WhatsApp" className="h-8 w-8 md:h-10 md:w-10 drop-shadow-lg" />
          <span className="hidden sm:inline">Order/Inquiry on WhatsApp</span>
        </button>
      </div>

      <Dialog open={open} onOpenChange={(v) => { if (!v) closeChat(); }}>
        <DialogContent className="w-[95vw] max-w-md mx-auto rounded-lg shadow-2xl border border-muted/10 bg-card overflow-hidden">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>WhatsApp Order / Inquiry</DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {step === 1 && (
              <div className="space-y-3">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                <Label>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XXXXXXXX" />
              </div>
            )}

                    {step === 2 && (
                      <div className="space-y-3">
                        <Separator />

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label>Cart Items</Label>
                            <div className="text-sm text-muted-foreground">{cartItems.length} item(s)</div>
                          </div>
                          {cartItems.length === 0 ? (
                            <div className="text-sm text-muted-foreground">No items found in cart. You can add custom items below.</div>
                          ) : (
                            <ul className="space-y-2">
                                  {cartItems.map(item => (
                                    <li key={item.id} className="flex items-center gap-3 p-3 rounded-md bg-muted shadow-sm hover:shadow-md transition-shadow">
                                  <div className="flex-1">
                                    <div className="font-medium">{item.name}</div>
                                    {item.price && <div className="text-xs text-muted-foreground">{item.price}</div>}
                                  </div>
                                  <div className="flex items-center gap-1">
                                        <Button variant="outline" size="icon" onClick={() => changeItemQuantity(item.id, -1)}><Minus className="h-4 w-4" /></Button>
                                        <div className="w-8 text-center">{item.quantity}</div>
                                        <Button variant="outline" size="icon" onClick={() => changeItemQuantity(item.id, 1)}><Plus className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeCartItemAt(item.id)}><Trash2 className="h-4 w-4" /></Button>
                                  </div>
                                    </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <Label>Add custom item</Label>
                          <div className="grid grid-cols-12 gap-2 items-end">
                            <div className="col-span-6">
                              <Input placeholder="Item name" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} />
                            </div>
                            <div className="col-span-3">
                              <Input type="number" min={1} placeholder="Qty" value={String(newItemQty)} onChange={(e) => setNewItemQty(Math.max(1, parseInt(e.target.value || '1')))} />
                            </div>
                            <div className="col-span-3">
                              <Input placeholder="Price (optional)" value={newItemPrice} onChange={(e) => setNewItemPrice(e.target.value)} />
                            </div>
                            <div className="col-span-12">
                              <Button className="w-full" onClick={addCustomItem}>Add Item</Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

            {step === 3 && (
              <div className="space-y-3">
                <Label>Message</Label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="w-full min-h-[120px] rounded-md border px-3 py-2" />
                <p className="text-sm text-muted-foreground">You will be taken to WhatsApp with a prefilled message.</p>
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <div className="flex gap-2">
                {step > 1 && <Button variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1))}>Back</Button>}
                {step < 3 && <Button onClick={() => setStep((s) => Math.min(3, s + 1))}>Next</Button>}
              </div>
              <div>
                {step === 3 && (
                  <Button onClick={sendToWhatsApp} className="bg-green-600 hover:bg-green-700">
                    Start WhatsApp
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
