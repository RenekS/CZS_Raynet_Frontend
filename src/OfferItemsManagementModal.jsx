import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  CircularProgress,
  Alert,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export default function OfferItemsManagementModal({ open, onClose, offerId, baseUrl }) {
  // Stavy pro načtení aktuálních položek nabídky
  const [offerItems, setOfferItems] = useState([]);
  const [loadingOffer, setLoadingOffer] = useState(false);
  const [errorOffer, setErrorOffer] = useState(null);

  // Stavy pro získání detailů produktů pro položky nabídky
  const [itemProductDetails, setItemProductDetails] = useState({});

  // Stavy pro vyhledávání produktů
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [errorProducts, setErrorProducts] = useState(null);

  // Stavy pro přidání nové položky
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [taxRate, setTaxRate] = useState(21);

  // Stavy pro editaci existující položky
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingQuantity, setEditingQuantity] = useState('');
  const [editingPrice, setEditingPrice] = useState('');
  const [editingDiscount, setEditingDiscount] = useState('');
  const [editingTaxRate, setEditingTaxRate] = useState('');

  // Při otevření modalu načteme aktuální položky nabídky
  useEffect(() => {
    if (open && offerId) {
      fetchOfferItems();
    }
  }, [open, offerId, baseUrl]);

  async function fetchOfferItems() {
    setLoadingOffer(true);
    setErrorOffer(null);
    try {
      const res = await fetch(`${baseUrl}/api/raynet-offer/${offerId}`);
      if (!res.ok) throw new Error(`Chyba při načítání nabídky: ${res.status}`);
      const json = await res.json();
      const offer = json.data.data;
      const items = offer.items || [];
      setOfferItems(items);
    } catch (err) {
      console.error(err);
      setErrorOffer(err.message);
    } finally {
      setLoadingOffer(false);
    }
  }

  // Po načtení položek získáme detaily produktů pro unikátní ID produktů
  useEffect(() => {
    if (offerItems.length === 0) return;
    const productIds = Array.from(new Set(offerItems.map(item => item.priceListItem.product.id)));
    Promise.all(
      productIds.map(id =>
        fetch(`${baseUrl}/api/product/${id}`)
          .then(res => {
            if (!res.ok) throw new Error(`Chyba při načítání produktu ${id}: ${res.status}`);
            return res.json();
          })
          .then(prodJson => ({ id, data: prodJson.data.data }))
      )
    )
      .then(results => {
        const mapping = {};
        results.forEach(result => {
          mapping[result.id] = result.data;
        });
        setItemProductDetails(mapping);
      })
      .catch(err => console.error(err));
  }, [offerItems, baseUrl]);

  // Vyhledávání produktů pomocí zadaného dotazu
  async function handleSearchProducts() {
    if (!searchQuery) return;
    setLoadingProducts(true);
    setErrorProducts(null);
    try {
      const res = await fetch(`${baseUrl}/api/products?search=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) throw new Error(`Chyba při načítání produktů: ${res.status}`);
      const data = await res.json();
      setProducts(data.data || []);
    } catch (err) {
      console.error(err);
      setErrorProducts(err.message);
    } finally {
      setLoadingProducts(false);
    }
  }

  // Přidání nové položky pomocí PUT na /api/raynet-offer/{offerId}/item
  async function handleAddItem() {
    if (!selectedProduct) {
      alert("Vyberte produkt.");
      return;
    }
    try {
      const body = {
        productId: selectedProduct.id,
        price: parseFloat(price),
        discountPercent: parseFloat(discountPercent),
        quantity: parseFloat(quantity),
        taxRate: parseFloat(taxRate)
      };
      const res = await fetch(`${baseUrl}/api/raynet-offer/${offerId}/item`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(`Chyba při přidávání položky: ${res.status}`);
      await fetchOfferItems();
      // Reset formuláře
      setSelectedProduct(null);
      setQuantity(1);
      setPrice('');
      setDiscountPercent('');
      setTaxRate(21);
      setProducts([]);
      setSearchQuery('');
    } catch (err) {
      console.error(err);
      alert("Nepodařilo se přidat položku: " + err.message);
    }
  }

  // Zahájení režimu editace pro danou položku
  function startEditItem(item) {
    setEditingItemId(item.id);
    setEditingQuantity(item.count || 1);
    setEditingPrice(item.priceListItem?.price || '');
    setEditingDiscount(item.discountPercent || '');
    setEditingTaxRate(item.taxRate || 21);
  }

  // Uložení upravené položky pomocí POST na /api/raynet-offer/{offerId}/item/{offerItemId}
  async function handleSaveEditItem() {
    if (!editingItemId) return;
    try {
      const body = {
        price: parseFloat(editingPrice),
        discountPercent: parseFloat(editingDiscount),
        quantity: parseFloat(editingQuantity),
        taxRate: parseFloat(editingTaxRate)
      };
      const res = await fetch(`${baseUrl}/api/raynet-offer/${offerId}/item/${editingItemId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(`Chyba při úpravě položky: ${res.status}`);
      await fetchOfferItems();
      setEditingItemId(null);
    } catch (err) {
      console.error(err);
      alert("Nepodařilo se upravit položku: " + err.message);
    }
  }

  function handleCancelEdit() {
    setEditingItemId(null);
  }

  // Odstranění položky pomocí DELETE na /api/raynet-offer/{offerId}/item/{offerItemId}
  async function handleRemoveItem(itemId) {
    if (!window.confirm("Opravdu chcete smazat položku?")) return;
    try {
      const res = await fetch(`${baseUrl}/api/raynet-offer/${offerId}/item/${itemId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error(`Chyba při mazání položky: ${res.status}`);
      await fetchOfferItems();
    } catch (err) {
      console.error(err);
      alert("Nepodařilo se odstranit položku: " + err.message);
    }
  }

  function handleClose() {
    onClose();
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        Správa položek nabídky
        <IconButton onClick={handleClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="h6" gutterBottom>
          Aktuální položky
        </Typography>
        {loadingOffer && <CircularProgress />}
        {errorOffer && <Alert severity="error">{errorOffer}</Alert>}
        {!loadingOffer && !errorOffer && (
          <TableContainer component={Paper} sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Kód</TableCell>
                  <TableCell>Název</TableCell>
                  <TableCell align="center">Množství</TableCell>
                  <TableCell align="center">Náprava</TableCell>
                  <TableCell align="center">Provoz</TableCell>
                  <TableCell align="center">Akce</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {offerItems.map(item => {
                  const prodDetail = itemProductDetails[item.priceListItem.product.id] || {};
                  const productName = prodDetail.name || item.priceListItem?.product?.name || 'Produkt';
                  const productCode = prodDetail.code || item.priceListItem?.product?.code || '';
                  // Z customFields získáme pouze hodnotu pro "Náprava" a "Provoz"
                  const naprava = prodDetail.customFields ? prodDetail.customFields["Naprava_fe9fa"] || '' : '';
                  const provoz = prodDetail.customFields ? prodDetail.customFields["Provoz_2c25f"] || '' : '';
                  if (editingItemId === item.id) {
                    return (
                      <TableRow key={item.id}>
                        <TableCell>{productCode}</TableCell>
                        <TableCell>
                          <strong>{productName}</strong>
                        </TableCell>
                        <TableCell>
                          <TextField
                            label="Množství"
                            type="number"
                            size="small"
                            value={editingQuantity}
                            onChange={(e) => setEditingQuantity(e.target.value)}
                          />
                        </TableCell>
                        <TableCell align="center">{naprava}</TableCell>
                        <TableCell align="center">{provoz}</TableCell>
                        <TableCell>
                          <Button variant="contained" onClick={handleSaveEditItem}>
                            Uložit
                          </Button>
                          <Button onClick={handleCancelEdit}>Zrušit</Button>
                        </TableCell>
                      </TableRow>
                    );
                  } else {
                    return (
                      <TableRow key={item.id}>
                        <TableCell>{productCode}</TableCell>
                        <TableCell>
                          <strong>{productName}</strong>
                        </TableCell>
                        <TableCell align="center">{item.count}</TableCell>
                        <TableCell align="center">{naprava}</TableCell>
                        <TableCell align="center">{provoz}</TableCell>
                        <TableCell>
                          <Button variant="outlined" size="small" onClick={() => startEditItem(item)}>
                            Upravit
                          </Button>
                          <Button variant="outlined" color="error" size="small" onClick={() => handleRemoveItem(item.id)}>
                            Smazat
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  }
                })}
                {offerItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <em>Žádné položky</em>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Typography variant="h6" gutterBottom>
          Přidat novou položku
        </Typography>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
          <TextField
            label="Hledat produkt"
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearchProducts(); }}
          />
          <Button variant="outlined" onClick={handleSearchProducts}>
            Filtrovat
          </Button>
        </div>
        {loadingProducts && <CircularProgress />}
        {errorProducts && <Alert severity="error">{errorProducts}</Alert>}
        <TableContainer component={Paper} sx={{ mb: 2 }}>
          <Table size="small">
            <TableBody>
              {products.map(prod => (
                <TableRow
                  key={prod.id}
                  hover
                  onClick={() => setSelectedProduct(prod)}
                  selected={selectedProduct?.id === prod.id}
                  style={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <strong>{prod.name}</strong>
                    <br />{prod.code && `Kód: ${prod.code}`}
                  </TableCell>
                  <TableCell>{prod.manufacturer}</TableCell>
                </TableRow>
              ))}
              {products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} align="center">
                    <em>Žádné produkty...</em>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {selectedProduct && (
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <div>
              <strong>{selectedProduct.name}</strong>
              <br />
              {selectedProduct.code}
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <TextField
                label="Množství"
                type="number"
                size="small"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
              <TextField
                label="Cena/ks"
                type="number"
                size="small"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              <TextField
                label="Sleva (%)"
                type="number"
                size="small"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
              />
              <TextField
                label="DPH (%)"
                type="number"
                size="small"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
              />
              <Button variant="contained" onClick={handleAddItem}>
                Přidat do nabídky
              </Button>
            </div>
          </Paper>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Zavřít</Button>
      </DialogActions>
    </Dialog>
  );
}
