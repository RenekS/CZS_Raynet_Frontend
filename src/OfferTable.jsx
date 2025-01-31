// OfferTable.jsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Grid,
  Typography,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';

// Voláme baseUrl z ENV proměnné nebo použijeme fallback
const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

/**
 * Pomocné mapování některých customFields (pokud je potřebujete)
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

/**
 * Pomocná funkce na seskládání jména z titleBefore, firstName, lastName, titleAfter.
 * Ignoruje null hodnoty a mezery navíc.
 */
function buildContactName(contact) {
  if (!contact) return '';
  const parts = [];
  if (contact.titleBefore) parts.push(contact.titleBefore);
  if (contact.firstName)   parts.push(contact.firstName);
  if (contact.lastName)    parts.push(contact.lastName);
  if (contact.titleAfter)  parts.push(contact.titleAfter);
  return parts.join(' ').trim();
}

/**
 * Seskupení položek nabídky podle vybraného customFieldu (groupByKey).
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
 * Jednoduchá funkce pro výpočet ceny po slevě.
 */
function calculatePriceAfterDiscount(price, discount) {
  const priceNumber = parseFloat(price);
  const discountNumber = parseFloat(discount);
  if (isNaN(priceNumber) || isNaN(discountNumber)) return "Neuvedeno";
  const finalPrice = priceNumber * (1 - discountNumber / 100);
  return finalPrice.toFixed(2);
}

/**
 * Komponenta OfferTable
 * - Zobrazuje informace o dodavateli a odběrateli.
 * - Zobrazuje skupiny produktů a jejich detaily.
 * 
 * PROPS:
 *  - offerData:        Data nabídky (obsahuje .items, .owner, .person, atp.).
 *  - productDetails:   Objekt s detaily o produktech, klíč je productId -> detail.
 *  - productLoading:   Bool, značí zda se načítají data o produktech.
 *  - productError:     String, popis chyby při načítání produktů.
 *  - offerType:        Může být 'noQuantity' nebo 'withQuantity', ovlivňuje zobrazení množství.
 *  - groupByKey:       Klíč pro seskupování produktů (např. "Naprava_fe9fa").
 *  - supplierData:     Pevné výchozí údaje o dodavateli (obvykle CZECH STYLE...).
 *  - buyerData:        Data o odběrateli ve **nové struktuře** (viz. `name`, `regNumber`, `taxNumber`, `primaryAddress`...).
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
  // --- Pro ladění ---
  console.log('offerData:', offerData);
  console.log('productDetails:', productDetails);
  console.log('productLoading:', productLoading);
  console.log('productError:', productError);
  console.log('offerType:', offerType);
  console.log('groupByKey:', groupByKey);
  console.log('supplierData:', supplierData);
  console.log('buyerData:', buyerData);

  // --- Stavy pro kontaktní osoby (owner, person) z Raynetu ---
  const [ownerContact, setOwnerContact] = useState(null);
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [ownerError, setOwnerError] = useState(null);

  const [personContact, setPersonContact] = useState(null);
  const [personLoading, setPersonLoading] = useState(false);
  const [personError, setPersonError] = useState(null);

  // --- Funkce pro načtení detailu osoby z API ---
  async function fetchContactDetails(personId, setContact, setLoading, setError) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${baseUrl}/api/person-detail/${personId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Neznámá chyba při načítání dat o osobě.');
      }
      const data = await response.json();
      if (data && data.data) {
        setContact(data.data);
      }
    } catch (error) {
      console.error(`Chyba při načítání detailu osoby ID=${personId}:`, error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  // --- useEffect pro dodavatele (offerData.owner) ---
  useEffect(() => {
    if (offerData?.owner?.id) {
      fetchContactDetails(offerData.owner.id, setOwnerContact, setOwnerLoading, setOwnerError);
    }
  }, [offerData?.owner?.id]);

  // --- useEffect pro odběratele (offerData.person) ---
  useEffect(() => {
    if (offerData?.person?.id) {
      fetchContactDetails(offerData.person.id, setPersonContact, setPersonLoading, setPersonError);
    }
  }, [offerData?.person?.id]);

  // --- Loading & Error stavy ---
  if (productLoading || ownerLoading || personLoading) {
    return <CircularProgress sx={{ mt: 2 }} />;
  }

  if (productError) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Chyba při načítání produktů: {productError}
      </Alert>
    );
  }

  if (ownerError) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Chyba při načítání kontaktních informací dodavatele: {ownerError}
      </Alert>
    );
  }

  if (personError) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Chyba při načítání kontaktních informací odběratele: {personError}
      </Alert>
    );
  }

  if (!offerData?.items?.length) {
    return <Typography sx={{ mt: 2 }}>Žádné produkty</Typography>;
  }

  // --- 1) Seskupení produktů ---
  const groupedItems = groupItemsByCustomField(
    offerData.items,
    productDetails,
    groupByKey
  );
  const groupValues = Object.keys(groupedItems).sort();

  // Zobrazovat množství?
  const showQuantity = (offerType === 'withQuantity');

  // --------------------------------------------------
  // A) Dodavatel (supplierData) - zachována stará struktura
  // --------------------------------------------------
  const defaultSupplier = {
    companyName: 'CZECH STYLE, spol. s r.o.',
    street: 'Tečovská 1239',
    cityZip: '763 02 Zlín-Malenovice',
    country: 'Česká republika',
    ico: '25560174',
    dic: 'CZ25560174'
  };

  const supplierInfo = ownerContact
    ? {
        companyName: ownerContact.company?.name || defaultSupplier.companyName,
        street: ownerContact.privateAddress?.street || defaultSupplier.street,
        cityZip: `${ownerContact.privateAddress?.zipCode || '763 02'} ${ownerContact.privateAddress?.city || 'Zlín-Malenovice'}`,
        country: ownerContact.privateAddress?.country || defaultSupplier.country,
        ico: ownerContact?.customFields?.ICO || defaultSupplier.ico,
        dic: ownerContact?.customFields?.DIC || defaultSupplier.dic
      }
    : (supplierData || defaultSupplier);

  let sContactName = '';
  if (ownerContact) {
    sContactName = buildContactName(ownerContact);
    if (!sContactName) sContactName = 'Zákaznický servis';
  } else {
    sContactName = 'Zákaznický servis';
  }

  const supplierContactInfo = ownerContact
    ? {
        contactPerson: sContactName,
        email: ownerContact.contactInfo?.email || 'info@czstyle.cz',
        tel: ownerContact.contactInfo?.tel1 || '+420 777 777 777'
      }
    : {
        contactPerson: sContactName,
        email: 'info@czstyle.cz',
        tel: '+420 571 120 100'
      };

  // --------------------------------------------------
  // B) Odběratel (buyerData) - nová struktura
  // --------------------------------------------------
  //
  // Pokud je k dispozici personContact (z Raynet person detail), upřednostníme ho.
  // Jinak použijeme buyerData tak, jak jste poslal (name, regNumber, taxNumber, primaryAddress).
  //
  // 1) Základní identifikace (název, IČO, DIČ) + adresa
  const buyerInfo = personContact
    ? {
        // name = jméno firmy (pokud je to "osoba", může to být prázdné => fallback):
        name: buyerData?.name || 'Neuvedeno', // Případně personContact.company?.name, pokud to Raynet vrací
        street: personContact.privateAddress?.street || 'Neuvedeno',
        cityZip: `${personContact.privateAddress?.zipCode || ''} ${personContact.privateAddress?.city || ''}`.trim() || 'Neuvedeno',
        country: personContact.privateAddress?.country || 'Neuvedeno',
        ico: personContact.customFields?.ICO || buyerData?.regNumber || 'Neuvedeno',
        dic: personContact.customFields?.DIC || buyerData?.taxNumber || 'Neuvedeno'
      }
    : {
        // Čteme přímo z buyerData (nová struktura)
        name: buyerData?.name || 'Neuvedeno',
        street: buyerData?.primaryAddress?.address?.street || 'Neuvedeno',
        cityZip: `${(buyerData?.primaryAddress?.address?.zipCode || '')} ${(buyerData?.primaryAddress?.address?.city || '')}`.trim() || 'Neuvedeno',
        country: buyerData?.primaryAddress?.address?.country || 'Neuvedeno',
        ico: buyerData?.regNumber || 'Neuvedeno',
        dic: buyerData?.taxNumber || 'Neuvedeno'
      };

  // 2) Kontaktní osoba / e-mail / telefon / web
  let bContactName = '';
  if (personContact) {
    bContactName = buildContactName(personContact);
    if (!bContactName) bContactName = 'Pneuservis';
  } else {
    bContactName = 'Pneuservis';
  }

  const buyerContactInfo = personContact
    ? {
        contactPerson: bContactName,
        email: personContact.contactInfo?.email || buyerData?.primaryAddress?.contactInfo?.email || 'Neuvedeno',
        tel: personContact.contactInfo?.tel1 || buyerData?.primaryAddress?.contactInfo?.tel1 || 'Neuvedeno',
        www: personContact.contactInfo?.www || buyerData?.primaryAddress?.contactInfo?.www || 'Neuvedeno'
      }
    : {
        contactPerson: bContactName,
        email: buyerData?.primaryAddress?.contactInfo?.email || 'Neuvedeno',
        tel: buyerData?.primaryAddress?.contactInfo?.tel1 || 'Neuvedeno',
        www: buyerData?.primaryAddress?.contactInfo?.www || 'Neuvedeno'
      };

  // --- Vykreslení ---
  return (
    <Paper sx={{ overflowX: 'auto', mt: 1, p: 2 }}>
      {/* Hlavička (Dodavatel a Odběratel) */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          {/* Dodavatel */}
          <Grid item xs={12} sm={6}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
              Dodavatel
            </Typography>
            <Typography variant="body2">{supplierInfo.companyName}</Typography>
            <Typography variant="body2">{supplierInfo.street}</Typography>
            <Typography variant="body2">{supplierInfo.cityZip}</Typography>
            <Typography variant="body2">{supplierInfo.country}</Typography>
            <Typography variant="body2">IČO: {supplierInfo.ico}</Typography>
            <Typography variant="body2">DIČ: {supplierInfo.dic}</Typography>

            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                Kontaktní osoba:
              </Typography>
              <Typography variant="body2">
                {supplierContactInfo.contactPerson}
              </Typography>
              <Typography variant="body2">
                Email: {supplierContactInfo.email}
              </Typography>
              <Typography variant="body2">
                Tel: {supplierContactInfo.tel}
              </Typography>
            </Box>
          </Grid>

          {/* Odběratel */}
          <Grid item xs={12} sm={6}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
              Odběratel
            </Typography>
            <Typography variant="body2">{buyerInfo.name}</Typography>
            <Typography variant="body2">{buyerInfo.street}</Typography>
            <Typography variant="body2">{buyerInfo.cityZip}</Typography>
            <Typography variant="body2">{buyerInfo.country}</Typography>
            <Typography variant="body2">
              IČO: {buyerInfo.ico}
            </Typography>
            <Typography variant="body2">
              DIČ: {buyerInfo.dic}
            </Typography>

            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                Kontaktní osoba:
              </Typography>
              <Typography variant="body2">
                {buyerContactInfo.contactPerson}
              </Typography>
              <Typography variant="body2">
                Email: {buyerContactInfo.email}
              </Typography>
              <Typography variant="body2">
                Tel: {buyerContactInfo.tel}
              </Typography>
              <Typography variant="body2">
                Web: {buyerContactInfo.www}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Skupiny produktů */}
      <Box>
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

                // Čtení custom fields (příklad)
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
                      {/* Levý blok: Název, Kód produktu, Množství */}
                      <Grid item xs={12} sm={3}>
                        <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                          {productCode}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: (showQuantity ? 0.5 : 0) }}>
                          {productName}
                        </Typography>
                        {showQuantity && (
                          <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
                            Množství: {quantityValue}
                          </Typography>
                        )}
                      </Grid>

                      {/* Pravý blok: Cena, Sleva, DPH, Cena po slevě */}
                      <Grid item xs={12} sm={9}>
                        <Grid container spacing={1}>
                          <Grid item xs={12} sm={3}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.3 }}>
                              Cena za jednotku:
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              {price} Kč
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
                              {priceAfterDiscount} Kč
                            </Typography>
                          </Grid>
                        </Grid>

                        <Box sx={{ my: 1 }}>
                          <Divider />
                        </Box>

                        {/* Custom fields: Náprava, Vločka, Spotřeba, ... */}
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
      </Box>
    </Paper>
  );
}
