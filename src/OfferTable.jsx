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
  Button
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
 * Vrátí zadanou hodnotu nebo prázdný řetězec.
 */
function showOrBlank(value) {
  return value == null || value === '' ? '' : value;
}

/**
 * Výpočet ceny po slevě.
 */
function calculatePriceAfterDiscount(price, discountPercent) {
  const p = parseFloat(price);
  const d = parseFloat(discountPercent);
  if (isNaN(p) || isNaN(d)) return "";
  return (p * (1 - d / 100)).toFixed(2);
}

/**
 * Seskupí položky nabídky podle zadaného klíče v customFields.
 */
function groupItemsByCustomField(items, productDetails, groupByKey) {
  const grouped = {};
  items.forEach(item => {
    const prodId = item.priceListItem.product.id;
    const product = productDetails[prodId];
    if (!product) return;
    let groupValue = '(Nezařazeno)';
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
  groupByKey,
  offerType,        // 'withQuantity' nebo 'noQuantity'
  onSummaryReady
}) {
  const [ownerContact, setOwnerContact] = useState(null);
  const [personContact, setPersonContact] = useState(null);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [errorContacts, setErrorContacts] = useState(null);

  // Lokální stav pro volbu šablony
  const [localOfferType, setLocalOfferType] = useState(offerType || 'withQuantity');

  /**
   * Získáme základní URL pro API z env proměnné
   * (pokud není, spadne fallback na http://localhost:3001)
   */
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

  // 1) Načtení kontaktních údajů dodavatele (owner)
  useEffect(() => {
    async function fetchOwner() {
      if (offerData?.owner?.id) {
        setLoadingContacts(true);
        try {
          const res = await fetch(
            `${API_BASE_URL}/api/person-detail/${offerData.owner.id}`
          );
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

  // 2) Načtení kontaktních údajů odběratele (person)
  useEffect(() => {
    async function fetchPerson() {
      if (offerData?.person?.id) {
        setLoadingContacts(true);
        try {
          const res = await fetch(
            `${API_BASE_URL}/api/person-detail/${offerData.person.id}`
          );
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

  // 3) Sestavení offerSummary
  const offerSummary = useMemo(() => {
    if (!offerData || !offerData.items || Object.keys(productDetails).length === 0) {
      return null;
    }

    // Data platnosti nabídky
    const validFrom = offerData.validFrom || "Neuvedeno";
    const expirationDate = offerData.expirationDate
      ? offerData.expirationDate
      : (validFrom !== "Neuvedeno" ? addDays(validFrom, 10) : "Neuvedeno");

    // Obohacení položek
    const enrichedItems = offerData.items.map(item => {
      const prodId = item.priceListItem.product.id;
      const details = productDetails[prodId];
      if (details) {
        item.priceListItem.product = { ...item.priceListItem.product, ...details };
      }
      return item;
    });

    // Seskupení položek
    const groupedItems = groupItemsByCustomField(enrichedItems, productDetails, groupByKey);

    // Výchozí data dodavatele
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

    // Obdobně pro kupujícího
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
      // Přidané pole description s hodnotou z offerData.description
      description: offerData.description,
      supplier: {
        info: supplierInfo,
        contact: supplierContactInfo
      },
      buyer: {
        info: buyerInfo,
        contact: buyerContactInfo
      },
      productGroups: groupedItems
    };
  }, [
    offerData,
    productDetails,
    groupByKey,
    supplierData,
    buyerData,
    ownerContact,
    personContact,
    localOfferType
  ]);

  // Předání offerSummary do rodiče
  useEffect(() => {
    if (offerSummary && onSummaryReady) {
      onSummaryReady(offerSummary);
    }
  }, [offerSummary, onSummaryReady]);

  if (loadingContacts) return <CircularProgress />;
  if (errorContacts) return <Alert severity="error">{errorContacts}</Alert>;
  if (!offerData || !offerSummary) return <Box>Načítám souhrn nabídky...</Box>;

  /**
   * Stáhnout PDF – s množstvím nebo bez
   */
  async function handleDownloadPDF() {
    try {
      // Rozhodneme se dle localOfferType
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

      // Stáhneme PDF
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
  }

  return (
    <Paper sx={{ p: 2, m: 2 }}>
      <h2>Offer Summary</h2>

      {/* Přepínač "S množstvím" / "Bez množství" */}
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

      {/* Tlačítko pro generování PDF */}
      <Box sx={{ mb: 2 }}>
        <Button variant="contained" onClick={handleDownloadPDF}>
          Stáhnout PDF
        </Button>
      </Box>

      {/* Pro kontrolu, co se posílá do serveru */}
      <pre>{JSON.stringify(offerSummary, null, 2)}</pre>
    </Paper>
  );
}
