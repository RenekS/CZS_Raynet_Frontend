// OfferTable.jsx

import React from 'react';
import {
  Box,
  Paper,
  Grid,
  Typography,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';

// Pomocné mapování některých customFields
const customFieldsMapping = [
  { key: "Naprava_fe9fa",   label: "Náprava:" },
  { key: "Vločka_key",      label: "Vločka:" },
  { key: "Spotřeba_key",    label: "Spotřeba:" },
  { key: "Provoz_2c25f",    label: "Provoz:" },
  { key: "M_S_50472",       label: "M+S:" },
  { key: "Přilnavost_key",  label: "Přilnavost:" },
  { key: "Hluk_key",        label: "Hluk:" }
];

/**
 * Seskupení položek nabídky podle "groupByKey".
 * Pokud nepotřebujete seskupovat, můžete groupByKey vynechat.
 */
function groupItemsByCustomField(items, productDetails, groupByKey) {
  const grouped = {};

  items.forEach((item) => {
    const prodId = item.priceListItem.product.id;
    const product = productDetails[prodId];
    if (!product) return;

    let groupValue = '(Nezařazeno)';
    if (groupByKey && product.customFields && product.customFields[groupByKey]) {
      groupValue = product.customFields[groupByKey].toString();
    }
    if (!grouped[groupValue]) {
      grouped[groupValue] = [];
    }
    grouped[groupValue].push(item);
  });

  return grouped;
}

/**
 * Výpočet ceny po slevě
 */
function calculatePriceAfterDiscount(price, discount) {
  const priceNumber = parseFloat(price);
  const discountNumber = parseFloat(discount);
  if (isNaN(priceNumber) || isNaN(discountNumber)) return "Neuvedeno";
  const finalPrice = priceNumber * (1 - discountNumber / 100);
  return finalPrice.toFixed(2);
}

/**
 * Hlavní komponenta pro zobrazení nabídky
 *
 * @param {object} props
 *  - offerData      = data nabídky (obsahuje .items)
 *  - productDetails = detailní data o produktech (productId -> detail)
 *  - productLoading = bool, zda načítáme produkty
 *  - productError   = string, chyba při načítání
 *  - offerType      = 'noQuantity' | 'withQuantity'
 *  - groupByKey     = klíč pro seskupování (např. "Naprava_fe9fa")
 *  - supplierData   = info o dodavateli
 *  - buyerData      = info o odběrateli
 */
export default function OfferTable({
  offerData,
  productDetails,
  productLoading,
  productError,
  offerType,
  groupByKey,
  supplierData,
  buyerData
}) {
  // 1) Spinner / chyba
  if (productLoading) {
    return <CircularProgress sx={{ mt: 2 }} />;
  }
  if (productError) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Chyba při načítání produktů: {productError}
      </Alert>
    );
  }
  if (!offerData?.items?.length) {
    return <Typography sx={{ mt: 2 }}>Žádné produkty</Typography>;
  }

  // 2) Seskupíme produkty
  const groupedItems = groupItemsByCustomField(
    offerData.items,
    productDetails,
    groupByKey
  );
  const groupValues = Object.keys(groupedItems).sort();

  const showQuantity = (offerType === 'withQuantity');

  // 3) Dodavatel a Odběratel - vytažení, např. pro zobrazení (zde jen ukázka)
  const supplierCompanyName = supplierData?.companyName || "CZECH STYLE, spol. s r.o.";
  // ... Můžete si vypsat i zbytek, v PDF generování se to řeší zvlášť ...

  const buyerCompanyName = buyerData?.companyName || "STANSPED s.r.o.";
  // ... dtto ...

  // 4) Vykreslení
  return (
    <Paper sx={{ overflowX: 'auto', mt: 1, p: 2 }}>
      {/* Dodavatel + Odběratel */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
              Dodavatel
            </Typography>
            <Typography variant="body2">
              {supplierCompanyName}
            </Typography>
            {/* ... příp. další údaje ... */}
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
              Odběratel
            </Typography>
            <Typography variant="body2">
              {buyerCompanyName}
            </Typography>
            {/* ... příp. další údaje ... */}
          </Grid>
        </Grid>
      </Box>

      {/* Skupiny produktů */}
      {groupValues.map((groupValue) => {
        const groupArray = groupedItems[groupValue];

        return (
          <Box
            key={groupValue}
            sx={{ mb: 4, border: '1px solid #ccc', p: 2, borderRadius: 2 }}
          >
            <Typography variant="h6" gutterBottom>
              <strong>Skupina: {groupValue}</strong>
            </Typography>

            {groupArray.map((item) => {
              const prodId = item.priceListItem.product.id;
              const productInfo = productDetails[prodId];

              const price = item.priceListItem.price || "Neuvedeno";
              const discount = item.discount || "0";
              const taxRate = (item.taxRate != null) ? `${item.taxRate}%` : "Neuvedeno";
              const priceAfterDiscount = calculatePriceAfterDiscount(price, discount);

              let quantityValue = "Neuvedeno";
              if (offerType === 'withQuantity' && item.count != null) {
                quantityValue = item.count;
              }

              const productCode = productInfo?.code || "Neuvedeno";
              const productName = productInfo?.name || "Neuvedeno";

              // Ukázka načtení custom fields
              const naprava     = productInfo?.customFields?.["Naprava_fe9fa"]   || "Neuvedeno";
              const vlocka      = productInfo?.customFields?.["Vločka_key"]      || "Neuvedeno";
              const spotreba    = productInfo?.customFields?.["Spotřeba_key"]    || "Neuvedeno";
              const provoz      = productInfo?.customFields?.["Provoz_2c25f"]    || "Neuvedeno";
              const ms          = productInfo?.customFields?.["M_S_50472"]       || "Neuvedeno";
              const prilnavost  = productInfo?.customFields?.["Přilnavost_key"]  || "Neuvedeno";
              const hluk        = productInfo?.customFields?.["Hluk_key"]        || "Neuvedeno";

              return (
                <Box
                  key={`${prodId}_${item.id}`}
                  sx={{
                    mb: 2,
                    p: 1,
                    border: '1px solid #ddd',
                    borderRadius: 1
                  }}
                >
                  <Grid container spacing={1}>
                    {/* Levý blok */}
                    <Grid item xs={12} sm={3}>
                      <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        {productCode}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: (showQuantity ? 0.5 : 0) }}>
                        {productName}
                      </Typography>
                      {showQuantity && (
                        <Typography
                          variant="body2"
                          sx={{ color: '#666', mb: 0.5 }}
                        >
                          Množství: {quantityValue}
                        </Typography>
                      )}
                    </Grid>

                    {/* Pravý blok */}
                    <Grid item xs={12} sm={9}>
                      <Grid container spacing={1}>
                        <Grid item xs={12} sm={3}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.3 }}>
                            Cena za jednotku:
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            {price}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.3 }}>
                            Sleva:
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            {discount}%
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.3 }}>
                            DPH:
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            {taxRate}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.3 }}>
                            Cena po slevě:
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            {priceAfterDiscount}
                          </Typography>
                        </Grid>
                      </Grid>

                      <Box sx={{ my: 1 }}>
                        <Divider />
                      </Box>

                      {/* Custom fields: Náprava, Vločka, Spotřeba, Provoz, M+S, Přilnavost, Hluk */}
                      <Grid container spacing={1}>
                        <Grid item xs={12} sm={4} sx={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0 }}>
                            Náprava:
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 0 }}>
                            {naprava}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4} sx={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0 }}>
                            Vločka:
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 0 }}>
                            {vlocka}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4} sx={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0 }}>
                            Spotřeba:
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 0 }}>
                            {spotreba}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4} sx={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0 }}>
                            Provoz:
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 0 }}>
                            {provoz}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4} sx={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0 }}>
                            M+S:
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 0 }}>
                            {ms}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4} sx={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0 }}>
                            Přilnavost:
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 0 }}>
                            {prilnavost}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sx={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0 }}>
                            Hluk:
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 0 }}>
                            {hluk}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                </Box>
              );
            })}
          </Box>
        );
      })}
    </Paper>
  );
}
