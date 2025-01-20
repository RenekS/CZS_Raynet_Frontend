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
  Chip
} from '@mui/material';

const getFirstName = (fullName) => fullName ? fullName.split(' ')[0] : '';

const emailTemplate1 = (contact) => {
  const firstName = getFirstName(contact?.fullName);
  return `
    Vážený(á) ${firstName || 'zákazníku'},
    
    děkujeme Vám za Váš zájem o naše produkty. V příloze naleznete detailní ceník.
    
    Pro jakékoliv dotazy nás neváhejte kontaktovat.
    
    S pozdravem,
    Vaše společnost
  `;
};

const emailTemplate2 = (contact) => {
  const firstName = getFirstName(contact?.fullName);
  return `
    Dobrý den ${firstName || ''},
    
    na základě Vašeho požadavku Vám zasíláme aktuální nabídku cen.
    
    V případě potřeby nás kontaktujte.
    
    S úctou,
    Váš tým společnosti
  `;
};

const emailTemplate3 = (contact) => {
  const firstName = getFirstName(contact?.fullName);
  return `
    Ahoj ${firstName || 'příteli'},
    
    děkujeme za Váš zájem! V příloze najdete naši nabídku s aktuálními cenami.
    
    Ozvěte se, pokud budete potřebovat další informace.
    
    Hezký den,
    Tým Vaší společnosti
  `;
};

const getEmailBody = (template, contact) => {
  switch(template) {
    case "Formální nabídka 1":
      return emailTemplate1(contact);
    case "Formální nabídka 2":
      return emailTemplate2(contact);
    case "Formální nabídka 3":
      return emailTemplate3(contact);
    default:
      return emailTemplate1(contact);
  }
};

function RaynetClientInfo() {
  // Stavy pro data, načítání, chyby, kontakty apod.
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [data, setData]       = useState(null);
  const [contacts, setContacts] = useState([]);
  const [matchingContact, setMatchingContact] = useState(null);

  // Stavy pro výběr ceníků a dialogu
  const [selectedCeniky, setSelectedCeniky] = useState([]);
  const [showDialog, setShowDialog] = useState(false);

  // Stavy pro e‑mail
  const [template, setTemplate]   = useState("Formální nabídka 1");
  const [emailBody, setEmailBody] = useState("");
  const [recipients, setRecipients] = useState([]);

  const templateOptions = [
    "Formální nabídka 1",
    "Formální nabídka 2",
    "Formální nabídka 3"
  ];

  // Parametry z URL
  const searchParams = new URLSearchParams(window.location.search);
  const entityId   = searchParams.get('entityId') || 926;
  const entityName = searchParams.get('entityName') || 'Company';
  const userName   = searchParams.get('userName') || 'brno_sklad@czstyle.cz';
  const userId     = searchParams.get('userId') || 3;
  const baseUrl    = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
  console.log("API baseUrl:", baseUrl);

  // Načítání dat z API
  useEffect(() => {
    async function fetchMainData() {
      try {
        setLoading(true);
        const resp1 = await fetch(
          `${baseUrl}/api/data?entityId=${entityId}&entityName=${entityName}&userName=${userName}&userId=${userId}`
        );
        if (!resp1.ok) throw new Error(`Chyba /api/data: ${resp1.status}`);
        const jsonData = await resp1.json();
        setData(jsonData);

        const resp2 = await fetch(`${baseUrl}/api/contacts?entityId=${entityId}`);
        if (!resp2.ok) throw new Error(`Chyba /api/contacts: ${resp2.status}`);
        const jsonContacts = await resp2.json();
        setContacts(jsonContacts.contacts || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchMainData();
  }, [entityId, entityName, userName, userId, baseUrl]);

  // Hledání kontaktní osoby dle userName
  useEffect(() => {
    if (contacts.length > 0) {
      const match = contacts.find(c =>
        (c.email && c.email.toLowerCase() === userName.toLowerCase()) ||
        (c.email2 && c.email2.toLowerCase() === userName.toLowerCase())
      );
      setMatchingContact(match || null);
    }
  }, [contacts, userName]);

  // Nastavení výchozího textu e‑mailu při změně šablony nebo kontaktní osoby
  useEffect(() => {
    setEmailBody(getEmailBody(template, matchingContact));
  }, [template, matchingContact]);

  // Možnosti pro Autocomplete – příjemci
  const emailOptions = contacts.map(c => ({
    id: c.id,
    label: `${c.fullName} - ${c.email || c.email2 || 'Bez e‑mailu'}`
  }));

  if (loading) return <div>Načítám data...</div>;
  if (error) return <div style={{ color: 'red' }}>Chyba: {error}</div>;
  if (!data) return <div>Žádná data</div>;

  // Ovládání výběru ceníků
  const handleCenikCheckbox = (id) => {
    setSelectedCeniky(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleNextStep = () => {
    setRecipients([]);
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
  };

  // Funkce generující náhled DOCX s logováním vybraných položek
const handlePreviewDocx = async () => {
  if (selectedCeniky.length === 0) return;
  // Použijeme první vybrané ID ceníku
  const priceListId = selectedCeniky[0];
  console.log(`Selected priceListId: ${priceListId}`);

  // Pokusíme se najít detail daného ceníku z načtených dat
  const selectedPriceList = data.priceLists.find((price) => price.id === priceListId);
  if (selectedPriceList) {
    console.log("PriceList detail:", selectedPriceList);
    console.log("Items (položky) tohoto ceníku:", selectedPriceList.items);
  } else {
    console.log("Ceník s tímto ID nebyl nalezen!");
  }

  try {
    // Voláme endpoint s použitím query parametru (priceListId)
    const response = await fetch(`${baseUrl}/api/generate-price-list-docx/${priceListId}`);
    if (!response.ok) {
      throw new Error('Chyba při generování dokumentu');
    }
    const blob = await response.blob();
    // Otevření souboru v novém okně (alternativně můžete spustit stažení)
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
  } catch (error) {
    console.error("Error in handlePreviewDocx:", error);
    alert("Chyba při generování náhledu ceníku");
  }
};


  // Funkce pro odeslání ceníků (zatím simulační – e‑maily se neodesílají)
  const handleSendCeniky = async () => {
    alert("E‑maily zatím neodesíláme. Použijte tlačítko 'Generovat náhled ceníku' pro zobrazení dokumentu.");
    setShowDialog(false);
  };

  return (
    <Box sx={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f5f5f5', p: 2 }}>
      {/* Horní lišta */}
      <Box sx={{ backgroundColor: '#007b8a', color: '#fff', p: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h6">Správa ceníků</Typography>
        <Button variant="contained" sx={{ backgroundColor: '#00a3b1' }}>+ Přidat záznam</Button>
      </Box>

      {/* Informace */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
        <Box sx={{ flex: 1, minWidth: 300, backgroundColor: '#fff', p: 2, borderRadius: 1, boxShadow: 1 }}>
          <Typography variant="h6" sx={{ backgroundColor: '#007b8a', color: '#fff', p: 1 }}>
            Informace o klientovi
          </Typography>
          <table>
            <tbody>
              <tr><th>Název společnosti:</th><td>{data.client.name}</td></tr>
              <tr><th>Email:</th><td>{data.client.email}</td></tr>
              <tr><th>Telefon:</th><td>{data.client.phone}</td></tr>
              <tr><th>Zákaznická skupina:</th><td>{data.client.customerGroup}</td></tr>
            </tbody>
          </table>
        </Box>
        <Box sx={{ flex: 1, minWidth: 300, backgroundColor: '#fff', p: 2, borderRadius: 1, boxShadow: 1 }}>
          <Typography variant="h6" sx={{ backgroundColor: '#007b8a', color: '#fff', p: 1 }}>
            Informace o uživateli
          </Typography>
          <table>
            <tbody>
              <tr><th>User Name:</th><td>{data.user.userName}</td></tr>
              <tr><th>User ID:</th><td>{data.user.userId}</td></tr>
              { matchingContact && (
                <tr>
                  <th>Podpis:</th>
                  <td>{matchingContact.fullName}</td>
                </tr>
              )}
            </tbody>
          </table>
        </Box>
      </Box>

      {/* Seznam ceníků */}
      <Box sx={{ backgroundColor: '#fff', p: 2, mt: 2, borderRadius: 1, boxShadow: 1 }}>
        <Typography variant="h6">Seznam ceníků (filtrováno podle: {data.client.customerGroup})</Typography>
        {data.priceLists.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px' }}>
            <thead>
              <tr>
                <th style={{ padding: '8px', border: '1px solid #ddd' }}>Vybrat</th>
                <th style={{ padding: '8px', border: '1px solid #ddd' }}>ID</th>
                <th style={{ padding: '8px', border: '1px solid #ddd' }}>Kód</th>
                <th style={{ padding: '8px', border: '1px solid #ddd' }}>Název</th>
                <th style={{ padding: '8px', border: '1px solid #ddd' }}>Platnost od</th>
                <th style={{ padding: '8px', border: '1px solid #ddd' }}>Platnost do</th>
              </tr>
            </thead>
            <tbody>
              {data.priceLists.map((price) => (
                <tr key={price.id}>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    <Checkbox
                      checked={selectedCeniky.includes(price.id)}
                      onChange={() => handleCenikCheckbox(price.id)}
                    />
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{price.id}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{price.code}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{price.name || "Neuvedeno"}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{price.validFrom || "Neuvedeno"}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{price.validTill || "Neomezená"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Typography variant="body1" sx={{ color: '#999' }}>Ceníky nenalezeny.</Typography>
        )}

        {/* Tlačítka */}
        <Box sx={{ mt: 2 }}>
          <Button
            variant="contained"
            sx={{ mr: 1, backgroundColor: '#00a3b1' }}
            onClick={handleNextStep}
            disabled={selectedCeniky.length === 0}
          >
            Pokračovat
          </Button>

          {/* Upravené tlačítko pro generování náhledu DOCX */}
          <Button
            variant="outlined"
            sx={{ backgroundColor: '#fff', color: '#007b8a' }}
            onClick={handlePreviewDocx}
            disabled={selectedCeniky.length === 0}
          >
            Generovat náhled ceníku
          </Button>
        </Box>
      </Box>

      {/* Dialog pro nastavení e‑mailu (zatím simulační – e‑maily se neodesílají) */}
      <Dialog open={showDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Odeslání ceníku</DialogTitle>
        <DialogContent dividers>
          <Typography gutterBottom>
            Zvolte šablonu, napište text e‑mailu a vyberte příjemce.
          </Typography>
          <Typography variant="subtitle1" sx={{ mt: 1 }}>Příjemci e‑mailu</Typography>
          <Autocomplete
            multiple
            options={emailOptions}
            getOptionLabel={(option) => option.label}
            value={recipients}
            onChange={(event, newValue) => setRecipients(newValue)}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip variant="outlined" label={option.label} {...getTagProps({ index })} key={option.id} />
              ))
            }
            renderInput={(params) => (
              <TextField {...params} label="Vyberte příjemce" placeholder="E-mail" margin="normal" />
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
          >
            {templateOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
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
            <Box sx={{ border: '1px solid #ddd', borderRadius: 1, p: 1, mt: 2, backgroundColor: '#fafafa' }}>
              <Typography variant="subtitle1">Podpis nalezené osoby</Typography>
              <Typography variant="body2">
                {matchingContact.fullName}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Zrušit</Button>
          <Button variant="contained" onClick={handleSendCeniky}>Odeslat ceníky</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default RaynetClientInfo;
