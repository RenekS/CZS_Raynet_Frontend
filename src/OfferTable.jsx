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

/*
  Pokud potřebujete v budoucnu generovat další customFields,
  můžete jejich klíče definovat v poli níže. Momentálně
  pro rozložení "pod čarou" v detailu produktu
  používáme ručně vypsané klíče (např. "Naprava_fe9fa", "Vločka_key", ...).
*/
const customFieldsMapping = [
  { key: "Naprava_fe9fa",   label: "Náprava:" },
  { key: "Vločka_key",      label: "Vločka:" },
  { key: "Spotřeba_key",    label: "Spotřeba:" },
  { key: "Provoz_2c25f",    label: "Provoz:" },
  { key: "M_S_50472",       label: "M+S:" },
  { key: "Přilnavost_key",  label: "Přilnavost:" },
  { key: "Hluk_key",        label: "Hluk:" }
];

/*
  Pomocná funkce pro seskupování položek do objektu:
  {
    [hodnotaGroupByKey] : [ ...pole položek... ],
    ...
  }

  Pokud nepotřebujete seskupovat podle "groupByKey", můžete
  klidně tuhle funkci vynechat a items rovnou mapovat.
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

/*
  Funkce pro výpočet ceny po slevě:
   - price: původní cena
   - discount: sleva v % (např. "10" = 10%)
*/
function calculatePriceAfterDiscount(price, discount) {
  const priceNumber = parseFloat(price);
  const discountNumber = parseFloat(discount);
  if (isNaN(priceNumber) || isNaN(discountNumber)) return "Neuvedeno";
  const discountFraction = discountNumber / 100;
  const finalPrice = priceNumber * (1 - discountFraction);
  return finalPrice.toFixed(2);
}

/*
  Komponenta OfferTable

  Props:
  - offerData        = data nabídky (obsahuje .items)
  - productDetails   = detailní data o produktech (productId -> detail)
  - productLoading   = zda načítáme produkty
  - productError     = případná chyba při načítání
  - offerType        = 'noQuantity' | 'withQuantity' (zda zobrazovat Množství)
  - groupByKey       = klíč pro seskupování (např. "Naprava_fe9fa")
  - supplierData     = info o dodavateli
        { name, street, city, zip, country, ico, dic, ... }
        + data z ownera (např. { firstName, lastName, email, tel })
  - buyerData        = info o odběrateli
        { name, street, city, zip, country, ico, dic, tel, web, ... }
        + data o kontaktu (person)
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
  //////////////////////////////////////////////////////////////////
  // 1) Zobrazení spinneru / chyb
  //////////////////////////////////////////////////////////////////
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

  //////////////////////////////////////////////////////////////////
  // 2) Seskupení a roztřídění
  //////////////////////////////////////////////////////////////////
  const groupedItems = groupItemsByCustomField(
    offerData.items,
    productDetails,
    groupByKey
  );
  const groupValues = Object.keys(groupedItems).sort();

  const showQuantity = (offerType === 'withQuantity');

  //////////////////////////////////////////////////////////////////
  // 3) Dodavatel a Odběratel - data
  //////////////////////////////////////////////////////////////////
  // Supplier (levý blok)
  const supplierCompanyName  = supplierData?.companyName || "CZECH STYLE, spol. s r.o.";
  const supplierStreet       = supplierData?.street || "Tečovská 1239";
  const supplierCityZip      = supplierData?.cityZip || "763 02 Zlín-Malenovice";
  const supplierCountry      = supplierData?.country || "Česká republika";
  const supplierIco          = supplierData?.ico || "25560174";     // IČO
  const supplierDic          = supplierData?.dic || "CZ25560174";     // DIČ
  const supplierEmail        = supplierData?.ownerEmail || "";
  const supplierTel          = supplierData?.ownerTel || "";
  const supplierOwnerName    = supplierData?.ownerName || "";

  // Buyer (pravý blok)
  const buyerCompanyName = buyerData?.companyName || "STANSPED s.r.o.";
  const buyerStreet      = buyerData?.street || "třída Hrdinů 135/45";
  const buyerCityZip     = buyerData?.cityZip || "79501 Rýmařov";
  const buyerCountry     = buyerData?.country || "Česká republika";
  const buyerIco         = buyerData?.ico || "07187343";
  const buyerDic         = buyerData?.dic || "CZ07187343";
  const buyerTel         = buyerData?.tel || "+420 774 950 04";
  const buyerWeb         = buyerData?.www || "https://www.stansped.cz/";
  const buyerContactName = buyerData?.contactName || "Pneuservis";    // např. z person
  const buyerContactTel  = buyerData?.contactTel || "";              // např. z person
  const buyerContactMail = buyerData?.contactMail || "";             // např. z person

  //////////////////////////////////////////////////////////////////
  // 4) Vykreslení
  //////////////////////////////////////////////////////////////////
  return (
    <Paper sx={{ overflowX: 'auto', mt: 1, p: 2 }}>
      {/* 2 bloky vedle sebe: DODAVATEL, ODBĚRATEL */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          {/* Levý sloupec (Dodavatel) */}
          <Grid item xs={12} sm={6}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
              Dodavatel
            </Typography>
            <Typography variant="body2">
              {supplierCompanyName}
            </Typography>
            <Typography variant="body2">
              {supplierStreet}
            </Typography>
            <Typography variant="body2">
              {supplierCityZip}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {supplierCountry}
            </Typography>

            {supplierIco && (
              <Typography variant="body2">
                IČO: {supplierIco}
              </Typography>
            )}
            {supplierDic && (
              <Typography variant="body2" sx={{ mb: 2 }}>
                DIČ: {supplierDic}
              </Typography>
            )}

            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Kontaktní údaje:
            </Typography>
            <Typography variant="body2">
              {supplierOwnerName}
            </Typography>
            <Typography variant="body2">
              Email: {supplierEmail}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Tel: {supplierTel}
            </Typography>
          </Grid>

          {/* Pravý sloupec (Odběratel) */}
          <Grid item xs={12} sm={6}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
              Odběratel
            </Typography>
            <Typography variant="body2">
              {buyerCompanyName}
            </Typography>
            <Typography variant="body2">
              {buyerStreet}
            </Typography>
            <Typography variant="body2">
              {buyerCityZip}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {buyerCountry}
            </Typography>

            {buyerIco && (
              <Typography variant="body2">
                IČO: {buyerIco}
              </Typography>
            )}
            {buyerDic && (
              <Typography variant="body2" sx={{ mb: 2 }}>
                DIČ: {buyerDic}
              </Typography>
            )}

            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Kontaktní údaje:
            </Typography>
            <Typography variant="body2">
              {buyerContactName}
            </Typography>
            <Typography variant="body2">
              Tel: {buyerContactTel}
            </Typography>
            <Typography variant="body2">
              Email: {buyerContactMail}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Web: {buyerWeb}
            </Typography>
          </Grid>
        </Grid>
      </Box>

      {/* Vykreslení seskupených produktů */}
      {groupValues.map((groupValue) => {
        const groupArray = groupedItems[groupValue];

        return (
          <Box
            key={groupValue}
            sx={{ mb: 4, border: '1px solid #ccc', p: 2, borderRadius: 2 }}
          >
            {/* Název skupiny */}
            <Typography variant="h6" gutterBottom>
              <strong>Skupina: {groupValue}</strong>
            </Typography>

            {groupArray.map((item) => {
              // Získáme data k produktu
              const prodId = item.priceListItem.product.id;
              const productInfo = productDetails[prodId];

              // Cena, sleva, DPH, cena po slevě
              const price = item.priceListItem.price || "Neuvedeno";
              const discount = item.discount || "0"; // Předpoklad: discount "10" = 10%
              const taxRate = (item.taxRate != null) ? `${item.taxRate}%` : "Neuvedeno";
              const priceAfterDiscount = calculatePriceAfterDiscount(price, discount);

              // Množství (pokud je 'withQuantity')
              let quantityValue = "Neuvedeno";
              if (offerType === 'withQuantity' && item.count != null) {
                quantityValue = item.count;
              }

              // Kód a název produktu
              const productCode = item.priceListItem.product.code || "Neuvedeno";
              const productName = productInfo?.name || "Neuvedeno";

              // CustomFields
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
                    {/* Levý blok (20%) */}
                    <Grid item xs={12} sm={3}>
                      <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        {productCode}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ mb: (offerType === 'withQuantity') ? 0.5 : 0 }}
                      >
                        {productName}
                      </Typography>
                      {offerType === 'withQuantity' && (
                        <Typography
                          variant="body2"
                          sx={{ color: '#666', mb: 0.5 }}
                        >
                          Množství: {quantityValue}
                        </Typography>
                      )}
                    </Grid>

                    {/* Pravý blok (80%) */}
                    <Grid item xs={12} sm={9}>
                      {/* Horní část - 4 sloupce (Cena, Sleva, DPH, Cena po slevě) */}
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

                      {/* Čára */}
                      <Box sx={{ my: 1 }}>
                        <Divider />
                      </Box>

                      {/* Spodní část (7 custom fields)
                          Rozloženo do 3 řádků:
                            1. řádek: Náprava, Vločka, Spotřeba
                            2. řádek: Provoz, M+S, Přilnavost
                            3. řádek: Hluk
                          Každý "label: value" dáváme vedle sebe
                      */}
                      <Grid container spacing={1}>
                        {/* 1. řádek */}
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

                        {/* 2. řádek */}
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

                        {/* 3. řádek (pouze hluk) */}
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
