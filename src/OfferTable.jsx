import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  CircularProgress,
  Alert,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Divider
} from '@mui/material';

/**
 * Pomocná funkce pro přičtení dnů k datu ve formátu YYYY-MM-DD.
 */
function addDays(dateString, days) {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * Sestaví jméno kontaktní osoby.
 */
function buildContactName(contact) {
  if (!contact) return '';
  const parts = [];
  if (contact.titleBefore) parts.push(contact.titleBefore);
  if (contact.firstName) parts.push(contact.firstName);
  if (contact.lastName) parts.push(contact.lastName);
  if (contact.titleAfter) parts.push(contact.titleAfter);
  return parts.join(' ').trim();
}

/**
 * Vrátí zadanou hodnotu nebo "Neuvedeno".
 */
function showOrNeuvedeno(value) {
  return value == null || value === '' ? 'Neuvedeno' : value;
}

/**
 * Seskupí položky nabídky podle zadaného klíče v customFields.
 * Pokud groupByKey je "none" nebo null, všechny položky skončí ve stejné skupině.
 */
function groupItemsByCustomField(items, productDetails, groupByKey) {
  const grouped = {};
  items.forEach(item => {
    // Pro seskupení použijeme nadále hodnoty z productDetails, pokud jsou dostupné
    const prodId = item.priceListItem?.product?.id;
    const product = productDetails[prodId];
    if (!product) return;
    let groupValue = "(Nezařazeno)";
    if (groupByKey && product.customFields && product.customFields[groupByKey]) {
      groupValue = String(product.customFields[groupByKey]);
    }
    if (!grouped[groupValue]) {
      grouped[groupValue] = [];
    }
    grouped[groupValue].push(item);
  });
  return grouped;
}

export default function OfferTable({
  offerData,
  productDetails,
  supplierData,
  buyerData,
  groupByKey, // počáteční hodnota seskupení (např. "Naprava_fe9fa")
  offerType,  // počáteční hodnota – "withQuantity" nebo "noQuantity"
  onSummaryReady
}) {
  const [ownerContact, setOwnerContact] = useState(null);
  const [personContact, setPersonContact] = useState(null);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [errorContacts, setErrorContacts] = useState(null);

  // Stav pro výběr typu šablony (s množstvím / bez množství)
  const [localOfferType, setLocalOfferType] = useState(offerType || 'withQuantity');
  // Stav pro výběr seskupení – možnosti: "Naprava_fe9fa", "Rozmer_5ce97", "Provoz_2c25f", "none"
  const [localGroupByKey, setLocalGroupByKey] = useState(groupByKey || 'Naprava_fe9fa');

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

  // Výpis dat do konzole pro debugging
  useEffect(() => {
    console.log('productDetails:', productDetails);
    console.log('offerData:', offerData);
  }, [productDetails, offerData]);

  // Načtení kontaktních údajů dodavatele (owner)
  useEffect(() => {
    async function fetchOwner() {
      if (offerData?.owner?.id) {
        setLoadingContacts(true);
        try {
          const res = await fetch(`${API_BASE_URL}/api/person-detail/${offerData.owner.id}`);
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || 'Chyba při načítání údajů dodavatele.');
          }
          const json = await res.json();
          setOwnerContact(json.data);
        } catch (err) {
          console.error(err);
          setErrorContacts(err.message);
        } finally {
          setLoadingContacts(false);
        }
      }
    }
    fetchOwner();
  }, [offerData, API_BASE_URL]);

  // Načtení kontaktních údajů odběratele (person)
  useEffect(() => {
    async function fetchPerson() {
      if (offerData?.person?.id) {
        setLoadingContacts(true);
        try {
          const res = await fetch(`${API_BASE_URL}/api/person-detail/${offerData.person.id}`);
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || 'Chyba při načítání údajů odběratele.');
          }
          const json = await res.json();
          setPersonContact(json.data);
        } catch (err) {
          console.error(err);
          setErrorContacts(err.message);
        } finally {
          setLoadingContacts(false);
        }
      }
    }
    fetchPerson();
  }, [offerData, API_BASE_URL]);

  // Sestavení offerSummary – nyní se pracuje s offerData.items,
  // přičemž pro seskupení využíváme data z productDetails (pokud jsou k dispozici)
  const offerSummary = useMemo(() => {
    if (!offerData || !offerData.items || Object.keys(productDetails).length === 0) {
      return null;
    }
    const validFrom = offerData.validFrom || "Neuvedeno";
    const expirationDate = offerData.expirationDate
      ? offerData.expirationDate
      : (validFrom !== "Neuvedeno" ? addDays(validFrom, 10) : "Neuvedeno");

    // Pokud se má seskupovat, použijeme groupByKey, jinak všechny položky v jedné skupině
    const groupingKey = localGroupByKey === "none" ? null : localGroupByKey;
    const groupedItems = groupItemsByCustomField(offerData.items, productDetails, groupingKey);

    // Mapa pro přátelské názvy seskupení
    const groupLabelMapping = {
      Naprava_fe9fa: "Náprava",
      Rozmer_5ce97: "Rozměr",
      Provoz_2c25f: "Provoz"
    };

    let friendlyGroupedItems = {};
    if (localGroupByKey !== "none") {
      const label = groupLabelMapping[localGroupByKey] || "Skupina";
      Object.entries(groupedItems).forEach(([key, items]) => {
        friendlyGroupedItems[label + (key === "(Nezařazeno)" ? "" : `: ${key}`)] = items;
      });
    } else {
      friendlyGroupedItems = groupedItems;
    }

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
          ico: ownerContact.customFields?.ICO || defaultSupplier.ico,
          dic: ownerContact.customFields?.DIC || defaultSupplier.dic
        }
      : (supplierData || defaultSupplier);

    const sContactName = ownerContact
      ? (buildContactName(ownerContact) || 'Zákaznický servis')
      : 'Zákaznický servis';

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

    const buyerInfo = personContact
      ? {
          name: buyerData?.name || 'Neuvedeno',
          street: buyerData?.primaryAddress?.address?.street || 'Neuvedeno',
          cityZip: `${buyerData?.primaryAddress?.address?.zipCode || ''} ${buyerData?.primaryAddress?.address?.city || ''}`.trim() || 'Neuvedeno',
          country: buyerData?.primaryAddress?.address?.country || 'Neuvedeno',
          ico: personContact.customFields?.ICO || buyerData?.regNumber || 'Neuvedeno',
          dic: personContact.customFields?.DIC || buyerData?.taxNumber || 'Neuvedeno'
        }
      : {
          name: buyerData?.name || 'Neuvedeno',
          street: buyerData?.primaryAddress?.address?.street || 'Neuvedeno',
          cityZip: `${buyerData?.primaryAddress?.address?.zipCode || ''} ${buyerData?.primaryAddress?.address?.city || ''}`.trim() || 'Neuvedeno',
          country: buyerData?.primaryAddress?.address?.country || 'Neuvedeno',
          ico: buyerData?.regNumber || 'Neuvedeno',
          dic: buyerData?.taxNumber || 'Neuvedeno'
        };

    const bContactName = personContact
      ? (buildContactName(personContact) || 'Pneuservis')
      : 'Pneuservis';

    const buyerContactInfo = personContact
      ? {
          contactPerson: bContactName,
          email: buyerData?.primaryAddress?.contactInfo?.email || 'Neuvedeno',
          tel: personContact.contactInfo?.tel1 || buyerData?.primaryAddress?.contactInfo?.tel1 || 'Neuvedeno',
          www: personContact.contactInfo?.www || buyerData?.primaryAddress?.contactInfo?.www || 'Neuvedeno'
        }
      : {
          contactPerson: bContactName,
          email: buyerData?.primaryAddress?.contactInfo?.email || 'Neuvedeno',
          tel: buyerData?.primaryAddress?.contactInfo?.tel1 || 'Neuvedeno',
          www: buyerData?.primaryAddress?.contactInfo?.www || 'Neuvedeno'
        };

    return {
      offerCode: offerData?.code || "NAB-KÓD NEUVEDEN",
      validFrom,
      expirationDate,
      description: offerData.description,
      supplier: {
        info: supplierInfo,
        contact: supplierContactInfo
      },
      buyer: {
        info: buyerInfo,
        contact: buyerContactInfo
      },
      productGroups: friendlyGroupedItems
    };
  }, [
    offerData,
    productDetails,
    localGroupByKey,
    supplierData,
    buyerData,
    ownerContact,
    personContact,
    localOfferType
  ]);

  // Předání offerSummary do rodiče (pokud je potřeba)
  useEffect(() => {
    if (offerSummary && onSummaryReady) {
      onSummaryReady(offerSummary);
    }
  }, [offerSummary, onSummaryReady]);

  if (loadingContacts) return <CircularProgress />;
  if (errorContacts) return <Alert severity="error">{errorContacts}</Alert>;
  if (!offerData || !offerSummary) return <Box>Načítám souhrn nabídky...</Box>;

  // Funkce pro vykreslení nadpisu skupiny – zobrazí přátelský název
  const renderGroupHeader = (groupKey) => {
    if (localGroupByKey === "none") return null;
    return (
      <Box sx={{ mb: 1 }}>
        <strong>{groupKey}</strong>
      </Box>
    );
  };

  /**
   * Funkce pro vykreslení přehledu produktů pomocí MUI Table.
   * Hodnoty pro tabulku se berou z offerData.items:
   * - Ceníková cena: item.price
   * - Název: item.name
   * - Počet: item.count
   * - Sleva (%): item.discountPercent
   * - Cena po slevě: Math.round(item.price * (1 - item.discountPercent/100))
   * - Celkem: cena po slevě * item.count
   */
  const renderProductOverview = () => {
    return Object.keys(offerSummary.productGroups).map((groupKey) => {
      const items = offerSummary.productGroups[groupKey];
      return (
        <Box key={groupKey} sx={{ mb: 3 }}>
          {renderGroupHeader(groupKey)}
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Kód</TableCell>
                  <TableCell>Název produktu</TableCell>
                  <TableCell align="right">Ceníková cena</TableCell>
                  <TableCell align="center">Počet</TableCell>
                  <TableCell align="right">Sleva (%)</TableCell>
                  <TableCell align="right">Cena po slevě</TableCell>
                  <TableCell align="right">Celkem</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => {
                  // Kód získáme z priceListItem.product.code, pokud je k dispozici
                  const productCode = showOrNeuvedeno(item.priceListItem?.product?.code);
                  // Název přímo z item.name
                  const productName = showOrNeuvedeno(item.name);
                  // Ceníková cena z item.price
                  const listPrice = parseFloat(item.price) || 0;
                  // Počet kusů
                  const quantityValue = item.count || 0;
                  // Sleva (%)
                  const discount = parseFloat(item.discountPercent) || 0;
                  // Cena po slevě dopočítaná matematicky a zaokrouhlená na celé koruny
                  const priceAfter = Math.round(listPrice * (1 - discount / 100));
                  // Celková cena
                  const totalPrice = Math.round(priceAfter * quantityValue);

                  return (
                    <TableRow key={item.id}>
                      <TableCell>{productCode}</TableCell>
                      <TableCell>{productName}</TableCell>
                      <TableCell align="right">{listPrice ? listPrice.toLocaleString('cs-CZ') + ' Kč' : 'Neuvedeno'}</TableCell>
                      <TableCell align="center">{quantityValue}</TableCell>
                      <TableCell align="right">{discount ? discount + '%' : 'Neuvedeno'}</TableCell>
                      <TableCell align="right">{priceAfter ? priceAfter.toLocaleString('cs-CZ') + ' Kč' : ''}</TableCell>
                      <TableCell align="right">{totalPrice ? totalPrice.toLocaleString('cs-CZ') + ' Kč' : ''}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      );
    });
  };

  return (
    <Paper sx={{ p: 2, m: 2 }}>
      {/* Přepínač pro výběr typu šablony */}
      <FormControl component="fieldset" sx={{ mb: 2 }}>
        <FormLabel component="legend">Typ šablony</FormLabel>
        <RadioGroup
          row
          name="offerType"
          value={localOfferType}
          onChange={(e) => setLocalOfferType(e.target.value)}
        >
          <FormControlLabel value="withQuantity" control={<Radio />} label="S množstvím" />
          <FormControlLabel value="noQuantity" control={<Radio />} label="Bez množství" />
        </RadioGroup>
      </FormControl>

      {/* Přepínač pro výběr seskupení produktů */}
      <FormControl component="fieldset" sx={{ mb: 2 }}>
        <FormLabel component="legend">Seskupovat produkty podle:</FormLabel>
        <RadioGroup
          row
          name="groupByKey"
          value={localGroupByKey}
          onChange={(e) => setLocalGroupByKey(e.target.value)}
        >
          <FormControlLabel value="Naprava_fe9fa" control={<Radio />} label="Náprava" />
          <FormControlLabel value="Rozmer_5ce97" control={<Radio />} label="Rozměr" />
          <FormControlLabel value="Provoz_2c25f" control={<Radio />} label="Provoz" />
          <FormControlLabel value="none" control={<Radio />} label="Nezařazeno" />
        </RadioGroup>
      </FormControl>

      {/* Tlačítko pro generování PDF */}
      <Box sx={{ mb: 2 }}>
        <Button variant="contained" onClick={async () => {
          try {
            const endpoint =
              localOfferType === 'withQuantity'
                ? `${API_BASE_URL}/api/generate-pdf-with-quantity`
                : `${API_BASE_URL}/api/generate-pdf-without-quantity`;
            const resp = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ offerSummary })
            });
            if (!resp.ok) {
              throw new Error(`Chyba při generování PDF: ${resp.status} ${resp.statusText}`);
            }
            const blob = await resp.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = localOfferType === 'withQuantity'
              ? 'nabidka-with-quantity.pdf'
              : 'nabidka-without-quantity.pdf';
            link.click();
            window.URL.revokeObjectURL(url);
          } catch (err) {
            console.error('Chyba při stahování PDF:', err);
            alert('Nastala chyba při stahování PDF: ' + err.message);
          }
        }}>
          Stáhnout PDF
        </Button>
      </Box>

      {/* Přehled produktů */}
      <Divider sx={{ mb: 2 }} />
      <Typography variant="h6" sx={{ mb: 2 }}>
        Přehled produktů
      </Typography>
      {renderProductOverview()}
    </Paper>
  );
}
