import React, { useEffect, useState } from 'react';
import { Box, Button, Typography, CircularProgress, Alert } from '@mui/material';
import OfferTable from './OfferTable';

export default function RaynetClientInfo() {
  // Získáme parametry z URL
  const searchParams = new URLSearchParams(window.location.search);
  const entityId = searchParams.get('entityId');
  const entityName = (searchParams.get('entityName') || 'offer').toLowerCase();
  const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

  // Stavy
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [offerData, setOfferData] = useState(null);
  const [companyData, setCompanyData] = useState(null);
  const [productDetails, setProductDetails] = useState({});
  const [offerSummary, setOfferSummary] = useState(null);

  // Načítáme pouze nabídky (offer)
  useEffect(() => {
    async function fetchOffer() {
      try {
        setLoading(true);
        // Načtení nabídky
        const res = await fetch(`${baseUrl}/api/raynet-offer/${entityId}`);
        if (!res.ok) throw new Error(`Chyba při načítání nabídky: ${res.status}`);
        const json = await res.json();
        const offer = json.data.data;
        setOfferData(offer);

        // Načtení dat firmy (odběratele) pokud jsou k dispozici
        if (offer?.company?.id) {
          const companyRes = await fetch(`${baseUrl}/api/company/${offer.company.id}`);
          if (!companyRes.ok) throw new Error(`Chyba při načítání firmy: ${companyRes.status}`);
          const companyJson = await companyRes.json();
          setCompanyData(companyJson.data.data);
        }

        // Načtení detailů produktů – pro každý produkt u položek nabídky
        if (offer?.items?.length > 0) {
          const promises = offer.items.map(item => {
            const prodId = item.priceListItem.product.id;
            return fetch(`${baseUrl}/api/product/${prodId}`)
              .then(r => {
                if (!r.ok) throw new Error(`Chyba při načítání produktu ${prodId}: ${r.status}`);
                return r.json();
              })
              .then(prodJson => ({ productId: prodId, data: prodJson.data.data }));
          });
          const prods = await Promise.all(promises);
          const prodMap = {};
          prods.forEach(p => {
            prodMap[p.productId] = p.data;
          });
          setProductDetails(prodMap);
        }
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (entityName === 'offer' && entityId) {
      fetchOffer();
    }
  }, [entityId, entityName, baseUrl]);

  // Funkce, která odešle data do backendu pro vygenerování PDF
  async function handleGeneratePdf() {
    if (!offerSummary) {
      alert("Offer summary ještě není připraven.");
      return;
    }
    try {
      // Předáme pouze offerSummary a typ ceníku (zde 'withQuantity')
      const payload = {
        offerSummary,
        offerType: 'withQuantity'
      };
      const res = await fetch(`${baseUrl}/api/generate-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`Chyba při generování PDF: ${res.status}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'nabidka.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      alert("Chyba při generování PDF");
    }
  }

  if (loading) return <Box sx={{ p: 2 }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ p: 2 }}><Alert severity="error">{error}</Alert></Box>;
  if (!offerData) return <Box sx={{ p: 2 }}><Typography>Nenalezena žádná nabídka.</Typography></Box>;

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Detail nabídky</Typography>
      <Button variant="contained" color="primary" onClick={handleGeneratePdf} sx={{ mb: 2 }}>
        Export do PDF
      </Button>
      <OfferTable 
        offerData={offerData}
        productDetails={productDetails}
        supplierData={null}       // Případně můžete předat předdefinovaná data o dodavateli
        buyerData={companyData}
        groupByKey="Naprava_fe9fa"
        offerType="withQuantity"
        onSummaryReady={setOfferSummary}
      />
    </Box>
  );
}
