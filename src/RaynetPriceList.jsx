import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Alert,
  FormControl,
  FormControlLabel,
  FormLabel,
  RadioGroup,
  Radio,
  Select,
  MenuItem
} from '@mui/material';

import OfferTable, { generateOfferSummary } from './OfferTable';
import { generateOfferDocDefinition } from './offerTemplate';

export default function RaynetClientInfo() {
  // Parametry z URL (jen příklad)
  const searchParams = new URLSearchParams(window.location.search);
  const entityId   = searchParams.get('entityId');
  const entityName = searchParams.get('entityName') || 'offer';
  const baseUrl    = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

  // Stavy
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const [isOffer, setIsOffer] = useState(false);
  const [offerData, setOfferData] = useState(null);
  const [offerError, setOfferError] = useState(null);

  // Detaily produktů
  const [productDetails, setProductDetails] = useState({});
  const [productLoading, setProductLoading] = useState(false);
  const [productError, setProductError] = useState(null);

  // Data kupujícího
  const [companyData, setCompanyData] = useState(null);

  // Data pro "nenabídkový" režim (pokud entityName není 'offer')
  const [data, setData] = useState(null);

  // Pro ukázku – typ ceníku, klíč pro třídění
  const [offerType, setOfferType] = useState('withQuantity'); // 'withQuantity' nebo 'noQuantity'
  const [groupByKey, setGroupByKey] = useState('Naprava_fe9fa');

  // Předdefinovaná data o dodavateli (Supplier) - pro PDF
  const supplierData = {
    companyName: "CZECH STYLE, spol. s r.o.",
    street: "Tečovská 1239",
    cityZip: "763 02 Zlín-Malenovice",
    country: "Česká republika",
    ico: "25560174",
    dic: "CZ25560174",
    ownerEmail: "info@czstyle.cz",
    ownerTel: "+420 571 120 100",
    ownerName: "Zákaznický servis"
  };

  //////////////////////////////////////////////////////////////////////////////////
  // Načítání dat
  //////////////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const isOfferEntity = (entityName.toLowerCase() === 'offer') && entityId;
        setIsOffer(isOfferEntity);

        if (isOfferEntity) {
          // Načteme nabídku
          const offerResp = await fetch(`${baseUrl}/api/raynet-offer/${entityId}`);
          if (!offerResp.ok) {
            throw new Error(`Chyba /api/raynet-offer: ${offerResp.status}`);
          }
          const offerJson = await offerResp.json();
          const offer = offerJson.data.data;
          setOfferData(offer);
          setOfferError(null);

          // Načteme firmu (pokud je ID)
          if (offer?.company?.id) {
            const cResp = await fetch(`${baseUrl}/api/company/${offer.company.id}`);
            if (!cResp.ok) {
              throw new Error(`Chyba /api/company: ${cResp.status}`);
            }
            const cJson = await cResp.json();
            setCompanyData(cJson.data.data);
          }

          // Načteme produkty
          if (offer?.items?.length > 0) {
            setProductLoading(true);
            const productPromises = offer.items.map((item) => {
              const prodId = item.priceListItem.product.id;
              return fetch(`${baseUrl}/api/product/${prodId}`)
                .then((r) => {
                  if (!r.ok) throw new Error(`Chyba /api/product/${prodId}: ${r.status}`);
                  return r.json();
                })
                .then((pr) => {
                  if (!pr.success) throw new Error(`Chyba v produktu ${prodId}: ${pr.error}`);
                  return { productId: prodId, data: pr.data.data };
                });
            });
            const prods = await Promise.all(productPromises);
            const productMap = {};
            prods.forEach((p) => {
              productMap[p.productId] = p.data;
            });
            setProductDetails(productMap);
            setProductLoading(false);
          }

        } else {
          // Není nabídka, je to něco jiného
          const resp1 = await fetch(
            `${baseUrl}/api/data?entityId=${entityId}&entityName=${entityName}`
          );
          if (!resp1.ok) throw new Error(`Chyba /api/data: ${resp1.status}`);
          const jsonData = await resp1.json();
          setData(jsonData);
        }
      } catch (ex) {
        setError(ex.message);
        console.error("Error:", ex);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [entityId, entityName, baseUrl]);

  //////////////////////////////////////////////////////////////////////////////////
  // Odeslání do PDF (backend)
  //////////////////////////////////////////////////////////////////////////////////
  async function handleGeneratePdf() {
    if (!offerData) return;

    try {
      // Vygenerujeme offer summary pomocí sdílené funkce
      const offerSummary = generateOfferSummary({
        offerData,
        productDetails,
        groupByKey,
        supplierData,
        buyerData: companyData
        // Nepředáváme ownerContact ani personContact, použijí se fallback hodnoty
      });

      // Vygenerujeme docDefinition pro pdfMake pomocí šablony
      const docDefinition = generateOfferDocDefinition(offerSummary, offerType);

      // Odeslání POST požadavku na backend s docDefinition
      const response = await fetch(`${baseUrl}/api/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ docDefinition })
      });

      if (!response.ok) {
        throw new Error(`Chyba při generování PDF: ${response.status}`);
      }

      // Stáhnutí PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'nabidka.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error(err);
      alert('Chyba při generování PDF');
    }
  }

  //////////////////////////////////////////////////////////////////////////////////
  // UI - stav načítání a chyb
  //////////////////////////////////////////////////////////////////////////////////
  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">Chyba: {error}</Alert>
      </Box>
    );
  }
  if (!isOffer && !data) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>Žádná data (není offer)</Typography>
      </Box>
    );
  }
  if (isOffer && !offerData && !offerError) {
    return (
      <Box sx={{ p: 2 }}>
        <CircularProgress />
      </Box>
    );
  }

  //////////////////////////////////////////////////////////////////////////////////
  // Vykreslení
  //////////////////////////////////////////////////////////////////////////////////
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        {isOffer ? 'Detail nabídky' : 'Nějaká data (není to nabídka)'}
      </Typography>

      {/* Pokud je to nabídka, zobrazíme ovládací prvky a tabulku */}
      {isOffer && (
        <>
          {/* Volba typu ceníku (withQuantity, noQuantity) */}
          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <FormLabel component="legend">Typ ceníku</FormLabel>
            <RadioGroup
              row
              aria-label="offerType"
              name="offerType"
              value={offerType}
              onChange={(e) => setOfferType(e.target.value)}
            >
              <FormControlLabel value="withQuantity" control={<Radio />} label="Se součty a množstvím" />
              <FormControlLabel value="noQuantity" control={<Radio />} label="Bez součtů a množství" />
            </RadioGroup>
          </FormControl>

          {/* Volba groupByKey (třídění) */}
          <FormControl sx={{ ml: 4, minWidth: 220 }}>
            <Select
              label="Group By"
              value={groupByKey}
              onChange={(e) => setGroupByKey(e.target.value)}
            >
              <MenuItem value="Naprava_fe9fa">Náprava</MenuItem>
              <MenuItem value="Vločka_key">Vločka</MenuItem>
              <MenuItem value="Spotřeba_key">Spotřeba</MenuItem>
              <MenuItem value="Provoz_2c25f">Provoz</MenuItem>
              {/* ... Případně další klíče ... */}
            </Select>
          </FormControl>

          {/* Tlačítko pro generování PDF */}
          <Button
            variant="contained"
            color="primary"
            onClick={handleGeneratePdf}
            sx={{ ml: 4 }}
          >
            Export do PDF
          </Button>

          {/* Vykreslení tabulky nabídky */}
          <OfferTable
            offerData={offerData}
            productDetails={productDetails}
            productLoading={productLoading}
            productError={productError}
            offerType={offerType}
            groupByKey={groupByKey}
            supplierData={supplierData}
            buyerData={companyData}
          />
        </>
      )}

      {/* Pokud to není nabídka, ukážeme jen data */}
      {!isOffer && (
        <Box sx={{ mt: 2 }}>
          <Typography>Data z jiného entityName:</Typography>
          <pre style={{ backgroundColor: '#f8f8f8', padding: '10px' }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </Box>
      )}
    </Box>
  );
}
