// RaynetClientInfo.jsx

import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Checkbox,
  Typography,
  Autocomplete,
  Chip,
  Paper,
  CircularProgress,
  Alert,
  FormControl,
  FormControlLabel,
  FormLabel,
  RadioGroup,
  Radio,
  Select,
  MenuItem,
  InputLabel
} from '@mui/material';
import OfferTable from './OfferTable'; // <-- Import podkomponenty pro vykreslování tabulky

// ... ostatní importy a pomocné funkce

// Pomocná funkce pro získání prvního jména
function getFirstName(fullName) {
  if (!fullName) return '';
  return fullName.split(' ')[0];
}

// E-mailové šablony
const emailTemplates = {
  "Formální nabídka 1": (contact) => {
    const firstName = getFirstName(contact?.fullName);
    return `
Vážený(á) ${firstName || 'zákazníku'},

děkujeme Vám za Váš zájem o naše produkty. V příloze naleznete detailní ceník.

Pro jakékoliv dotazy nás neváhejte kontaktovat.

S pozdravem,
Vaše společnost
    `;
  },
  "Formální nabídka 2": (contact) => {
    const firstName = getFirstName(contact?.fullName);
    return `
Dobrý den ${firstName || ''},

na základě Vašeho požadavku Vám zasíláme aktuální nabídku cen.

V případě potřeby nás kontaktujte.

S úctou,
Váš tým společnosti
    `;
  },
  "Formální nabídka 3": (contact) => {
    const firstName = getFirstName(contact?.fullName);
    return `
Ahoj ${firstName || 'příteli'},

děkujeme za Váš zájem! V příloze najdete naši nabídku s aktuálními cenami.

Ozvěte se, pokud budete potřebovat další informace.

Hezký den,
Tým Vaší společnosti
    `;
  }
};

// Funkce pro získání e-mailového těla na základě šablony
function getEmailBody(template, contact) {
  const fn = emailTemplates[template] || emailTemplates["Formální nabídka 1"];
  return fn(contact);
}

// Hlavní komponenta
export default function RaynetClientInfo() {
  // Parametry z URL
  const searchParams = new URLSearchParams(window.location.search);
  const entityId   = searchParams.get('entityId') || 30;
  const entityName = searchParams.get('entityName') || 'offer';
  const userName   = searchParams.get('userName') || 'brno_sklad@czstyle.cz';
  const userId     = searchParams.get('userId') || 3;
  const baseUrl    = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

  // Obecné stavy pro API volání
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  // Nabídka a související data
  const [isOffer, setIsOffer] = useState(false);
  const [offerData, setOfferData] = useState(null);
  const [offerError, setOfferError] = useState(null);

  // Produkty a jejich detaily
  const [productDetails, setProductDetails] = useState({});
  const [productLoading, setProductLoading] = useState(false);
  const [productError, setProductError] = useState(null);

  // Data o firmě a osobě (Odběratel a kontaktní osoba)
  const [companyData, setCompanyData] = useState(null);
  const [personData, setPersonData] = useState(null);

  // Data pro "nenabídkový" režim
  const [data, setData] = useState(null);

  // Kontakty a "matching" kontakt
  const [contacts, setContacts] = useState([]);
  const [matchingContact, setMatchingContact] = useState(null);

  // Dialog a e-mail
  const [showDialog, setShowDialog] = useState(false);
  const [template, setTemplate] = useState("Formální nabídka 1");
  const [emailBody, setEmailBody] = useState("");
  const [recipients, setRecipients] = useState([]);

  // Výběr ceníků
  const [selectedCeniky, setSelectedCeniky] = useState([]);

  // Možnosti pro e-mailové šablony
  const templateOptions = [
    "Formální nabídka 1",
    "Formální nabídka 2",
    "Formální nabídka 3"
  ];

  // Definice pevného supplierData pro CZECH STYLE
  const supplierData = {
    fullName: "CZECH STYLE",
    name: "CZECH STYLE, SPOL. S R.O.",
    address: {
      street: "Tečovská 1239",
      city: "763 02 Zlín - Malenovice",
      province: "Moravskoslezský kraj",
      country: "Česká republika",
      zipCode: "79501"
    },
    regNumber: "07187343",
    taxNumber: "CZ07187343",
    contactInfo: {
      www: "https://www.czstyle.cz/",
      email: "pneuservis@stansped.cz",
      tel1: "+420 774 950 041",
      fax: "",
      otherContact: ""
    },
    contactPerson: {
      fullName: "David Hink ml.",
      email: "pneuservis@stansped.cz",
      tel1: "+420 774 950 041"
    }
  };

  // Definice proměnných 'offerType' a 'groupByKey' pomocí useState
  const [offerType, setOfferType] = useState('withQuantity'); // 'noQuantity' nebo 'withQuantity'
  const [groupByKey, setGroupByKey] = useState('Sirka_04504'); // např. 'Sirka_04504'

  //////////////////////////////////////////////////////////////////////////////////
  // Načítání hlavních dat
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

          // Načteme firmu a osobu (Odběratel)
          if (offer?.company?.id) {
            const cResp = await fetch(`${baseUrl}/api/company/${offer.company.id}`);
            if (!cResp.ok) {
              throw new Error(`Chyba /api/company: ${cResp.status}`);
            }
            const cJson = await cResp.json();
            setCompanyData(cJson.data.data);
          }

          // Načteme kontakty
          if (offer?.company?.id) {
            const contactsResp = await fetch(`${baseUrl}/api/contacts?entityId=${offer.company.id}`);
            if (!contactsResp.ok) {
              throw new Error(`Chyba /api/contacts: ${contactsResp.status}`);
            }
            const contactsJson = await contactsResp.json();
            const allContacts = contactsJson.contacts || [];

            // Najdeme kontaktní osobu David Hink ml.
            const davidContact = allContacts.find(contact => contact.fullName === "David Hink ml.");
            if (davidContact) {
              setPersonData(davidContact);
            } else {
              setPersonData(null); // Nebo nějaké výchozí hodnoty
            }

            setContacts(allContacts);
            console.log("Contacts Loaded:", allContacts);
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
                  // Podle vaší struktury: pr.data.data 
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
          // Není nabídka, jen obecná data
          const resp1 = await fetch(
            `${baseUrl}/api/data?entityId=${entityId}&entityName=${entityName}&userName=${userName}&userId=${userId}`
          );
          if (!resp1.ok) throw new Error(`Chyba /api/data: ${resp1.status}`);
          const jsonData = await resp1.json();
          setData(jsonData);

          // Kontakty
          const resp2 = await fetch(`${baseUrl}/api/contacts?entityId=${entityId}`);
          if (!resp2.ok) throw new Error(`Chyba /api/contacts: ${resp2.status}`);
          const jsonContacts = await resp2.json();
          setContacts(jsonContacts.contacts || []);
        }
      } catch (ex) {
        setError(ex.message);
        console.error("Error:", ex);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [entityId, entityName, userName, userId, baseUrl]);

  //////////////////////////////////////////////////////////////////////////////////
  // Vyhledání matchingContact dle userName
  //////////////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    if (contacts.length > 0) {
      const usr = userName.toLowerCase();
      const match = contacts.find((c) =>
        (c.email?.toLowerCase() === usr) ||
        (c.email2?.toLowerCase() === usr)
      );
      setMatchingContact(match || null);
    }
  }, [contacts, userName]);

  //////////////////////////////////////////////////////////////////////////////////
  // E-mail text
  //////////////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    setEmailBody(getEmailBody(template, matchingContact));
  }, [template, matchingContact]);

  const emailOptions = contacts.map((c) => ({
    id: c.id,
    label: `${c.fullName} - ${c.email || c.email2 || 'Bez e‑mailu'}`
  }));

  //////////////////////////////////////////////////////////////////////////////////
  // Zobrazení – stav načítání nebo chyba
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
  // Pokud nenabídka, ale nemáme data
  if (!isOffer && !data) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>Žádná data</Typography>
      </Box>
    );
  }
  // Pokud je to nabídka, ale nemáme offerData
  if (isOffer && !offerData && !offerError) {
    return (
      <Box sx={{ p: 2 }}>
        <CircularProgress />
      </Box>
    );
  }

  //////////////////////////////////////////////////////////////////////////////////
  // Logika pro "ceníky" a checkbox
  //////////////////////////////////////////////////////////////////////////////////
  function handleCenikCheckbox(id) {
    setSelectedCeniky((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      return [...prev, id];
    });
  }

  function handleNextStep() {
    setRecipients([]);
    setShowDialog(true);
  }

  function handleCloseDialog() {
    setShowDialog(false);
  }

  async function handlePreviewDocx() {
    if (selectedCeniky.length === 0) return;
    const priceListId = selectedCeniky[0];
    console.log(`Selected priceListId: ${priceListId}`);
  }

  async function handleSendCeniky() {
    alert("Simulace odeslání ceníků.");
    setShowDialog(false);
  }

  async function downloadOfferPDF(offerId) {
    alert(`Simulace stažení PDF pro offerId=${offerId}`);
  }

  //////////////////////////////////////////////////////////////////////////////////
  // Nové Ovládací Prvky pro Typ Ceníku a Parametr Třídění
  //////////////////////////////////////////////////////////////////////////////////

  // Možnosti pro třídění
  const sortOptions = [
    { value: 'Sirka_04504', label: 'Šířka' },
    { value: 'Provoz_2c25f', label: 'Provoz' },
    { value: 'Dezen_e771c', label: 'Dezén' },
    { value: 'Rafek_1f4ee', label: 'Ráfek' },
    { value: 'Naprava_fe9fa', label: 'Náprava' },
    { value: 'Index_rych_a74ff', label: 'Index Rychlosti' },
    { value: 'M_S_50472', label: 'M+S' },
    { value: 'Profil_c69ed', label: 'Profil' },
    // Přidejte další možnosti podle potřeby
  ];

  return (
    <Box sx={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f5f5f5', p: 2 }}>
      {/* Horní lišta */}
      <Box
        sx={{
          backgroundColor: '#007b8a',
          color: '#fff',
          p: 2,
          display: 'flex',
          justifyContent: 'space-between'
        }}
      >
        <Typography variant="h6">Správa ceníků</Typography>
        <Button variant="contained" sx={{ backgroundColor: '#00a3b1' }}>+ Přidat záznam</Button>
      </Box>

      {/* Pokud je nabídka, zobrazíme ovládací prvky pro typ ceníku a třídění */}
      {isOffer && (
        <Box sx={{ mt: 2, mb: 2, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {/* Typ ceníku */}
          <FormControl component="fieldset">
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

          {/* Parametr třídění */}
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="sort-by-label">Třídit podle</InputLabel>
            <Select
              labelId="sort-by-label"
              id="sort-by-select"
              value={groupByKey}
              label="Třídit podle"
              onChange={(e) => setGroupByKey(e.target.value)}
            >
              {sortOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {/* Pokud to není nabídka, zobrazíme data (klient + uživatel) */}
      {!isOffer && (
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
          <Box sx={{ flex: 1, minWidth: 300, backgroundColor: '#fff', p: 2, borderRadius: 1, boxShadow: 1 }}>
            <Typography variant="h6" sx={{ backgroundColor: '#007b8a', color: '#fff', p: 1 }}>
              Informace o klientovi
            </Typography>
            {/* Sem doplňte, co potřebujete o klientovi, např. data?.client */}
          </Box>

          <Box sx={{ flex: 1, minWidth: 300, backgroundColor: '#fff', p: 2, borderRadius: 1, boxShadow: 1 }}>
            <Typography variant="h6" sx={{ backgroundColor: '#007b8a', color: '#fff', p: 1 }}>
              Informace o uživateli
            </Typography>
            {/* Sem doplňte, co potřebujete o uživateli, např. data?.user */}
          </Box>
        </Box>
      )}

      {/* Nabídka – zobrazení tabulky s produkty */}
      {isOffer && offerData && (
        <Box sx={{ backgroundColor: '#fff', p: 2, mt: 2, borderRadius: 1, boxShadow: 1 }}>
          <Typography variant="h6" sx={{ backgroundColor: '#007b8a', color: '#fff', p: 1 }}>
            Informace o nabídce
          </Typography>

          {offerError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Chyba: {offerError}
            </Alert>
          )}

          {/* Seznam produktů */}
          <Typography variant="h6" sx={{ mt: 2 }}>
            Seznam produktů
          </Typography>

          {/* Komponenta OfferTable: sem posíláme data pro vykreslení */}
          <OfferTable
            offerData={offerData}
            productDetails={productDetails}
            productLoading={productLoading}
            productError={productError}
            downloadOfferPDF={downloadOfferPDF}
            offerType={offerType}       // 'noQuantity' nebo 'withQuantity'
            groupByKey={groupByKey}     // např. 'Sirka_04504'
            supplierData={supplierData} // Přidáno
            buyerData={companyData}     // Přidáno
            contactPerson={personData}  // Přidáno
          />
        </Box>
      )}

      {/* Pokud nejde o nabídku, zobraz ceníky */}
      {!isOffer && data?.priceLists?.length > 0 && (
        <Box sx={{ backgroundColor: '#fff', p: 2, mt: 2, borderRadius: 1, boxShadow: 1 }}>
          <Typography variant="h6">
            Seznam ceníků (filtrováno podle: {data?.client?.customerGroup || "Neuvedeno"})
          </Typography>
          <Paper sx={{ overflowX: 'auto', mt: 1 }}>
            {/* ... tabulka ceníků ... */}
          </Paper>
        </Box>
      )}

      {/* Dialog pro e-mail */}
      <Dialog open={showDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Odeslání ceníku</DialogTitle>
        <DialogContent dividers>
          <Typography gutterBottom>
            Zvolte šablonu, napište text e‑mailu a vyberte příjemce.
          </Typography>

          <Typography variant="subtitle1" sx={{ mt: 1 }}>
            Příjemci e‑mailu
          </Typography>
          <Autocomplete
            multiple
            options={emailOptions}
            getOptionLabel={(option) => option.label}
            value={recipients}
            onChange={(event, newValue) => setRecipients(newValue)}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  variant="outlined"
                  label={option.label}
                  {...getTagProps({ index })}
                  key={option.id}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Vyberte příjemce"
                placeholder="E-mail"
                margin="normal"
              />
            )}
          />

          <TextField
            select
            label="Šablona"
            fullWidth
            margin="normal"
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            SelectProps={{ native: false }}
            helperText="Vyberte šablonu e‑mailu"
          >
            {templateOptions.map((opt) => (
              <Box component="option" key={opt} value={opt}>
                {opt}
              </Box>
            ))}
          </TextField>

          <TextField
            label="Text e‑mailu (HTML)"
            fullWidth
            multiline
            rows={4}
            margin="normal"
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
          />

          {matchingContact && (
            <Box
              sx={{
                border: '1px solid #ddd',
                borderRadius: 1,
                p: 1,
                mt: 2,
                backgroundColor: '#fafafa'
              }}
            >
              <Typography variant="subtitle1">
                Podpis nalezené osoby
              </Typography>
              <Typography variant="body2">
                {matchingContact.fullName}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Zrušit</Button>
          <Button variant="contained" onClick={handleSendCeniky}>
            Odeslat ceníky
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
