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

function RaynetClientInfo() {
  // Stavy pro načítání dat, chyby, data, kontakty a nalezeného uživatele
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [data, setData]       = useState(null);
  const [contacts, setContacts] = useState([]);
  const [matchingContact, setMatchingContact] = useState(null);

  // Stavy pro výběr ceníků a zobrazení dialogu
  const [selectedCeniky, setSelectedCeniky] = useState([]);
  const [showDialog, setShowDialog] = useState(false);

  // Stavy pro e‑mailové údaje
  const [template, setTemplate]   = useState("Formální nabídka 1");
  const [emailBody, setEmailBody] = useState("Dobrý den,<br><br>v příloze najdete ceník.");
  const [recipients, setRecipients] = useState([]); // počátečně prázdné

  // Předdefinované šablony
  const templateOptions = [
    "Formální nabídka 1",
    "Formální nabídka 2",
    "Formální nabídka 3"
  ];

  // Získání parametrů z URL
  const searchParams = new URLSearchParams(window.location.search);
  const entityId   = searchParams.get('entityId') || 926;
  const entityName = searchParams.get('entityName') || 'Company';
  const userName   = searchParams.get('userName') || 'brno_sklad@czstyle.cz';
  const userId     = searchParams.get('userId') || 3;

  // Základní URL pro API získáme z proměnné prostředí (Create React App musí mít REACT_APP_ prefix)
  const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

  // Načtení hlavních dat: klient, ceníky a kontakty
  useEffect(() => {
    async function fetchMainData() {
      try {
        setLoading(true);
        // Načíst data o klientovi a cenících
        const resp1 = await fetch(
          `${baseUrl}/api/data?entityId=${entityId}&entityName=${entityName}&userName=${userName}&userId=${userId}`
        );
        if (!resp1.ok) throw new Error(`Chyba /api/data: ${resp1.status}`);
        const jsonData = await resp1.json();
        setData(jsonData);

        // Načíst kontaktní osoby
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

  // Hledání kontaktní osoby podle userName (case-insensitive porovnání s oběma poli email a email2)
  useEffect(() => {
    if (contacts.length > 0) {
      const match = contacts.find(c =>
        (c.email && c.email.toLowerCase() === userName.toLowerCase()) ||
        (c.email2 && c.email2.toLowerCase() === userName.toLowerCase())
      );
      setMatchingContact(match || null);
    }
  }, [contacts, userName]);

  // Pro zobrazení možností v Autocomplete – rozšířený popis (FullName, e-mail, případně další údaje)
  const emailOptions = contacts.map(c => ({
    id: c.id,
    label: `${c.fullName} - ${c.email || c.email2 || ''}` // Lze rozšířit o další údaje (funkci, příjmení apod.)
  }));

  // Pokud načtená data nejsou dostupná
  if (loading) return <div>Načítám data...</div>;
  if (error) return <div style={{ color: 'red' }}>Chyba: {error}</div>;
  if (!data) return <div>Žádná data</div>;

  // Výběr ceníků
  const handleCenikCheckbox = (id) => {
    setSelectedCeniky(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Přechod do dialogu pro další krok
  const handleNextStep = () => {
    setRecipients([]); // počátečně prázdná pole pro ruční výběr
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
  };

  const handleSendCeniky = () => {
    // Simulujeme odeslání – zde zavoláte svůj API endpoint, který vygeneruje PDF/odešle e-mail
    console.log("Vybrané ceníky:", selectedCeniky);
    console.log("Zvolená šablona:", template);
    console.log("Text e-mailu:", emailBody);
    console.log("Příjemci:", recipients);
    alert("Ceníky odeslány (simulace)");
    setShowDialog(false);
  };

  return (
    <Box sx={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f5f5f5', p: 2 }}>
      {/* Horní pruh */}
      <Box sx={{ backgroundColor: '#007b8a', color: '#fff', p: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h6">Správa ceníků</Typography>
        <Button variant="contained" sx={{ backgroundColor: '#00a3b1' }}>+ Přidat záznam</Button>
      </Box>

      {/* Informace o klientovi a uživateli */}
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
                <>
                  <tr>
                    <th>Podpis nalezené osoby:</th>
                    <td>{matchingContact.fullName}</td>
                  </tr>
                  {/* Další informace (například telefon, funkci apod.) lze přidat zde, pokud budou k dispozici */}
                </>
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
                <th style={{ padding: '8px', border: '1px solid #ddd' }}>ID ceníku</th>
                <th style={{ padding: '8px', border: '1px solid #ddd' }}>Kód ceníku</th>
                <th style={{ padding: '8px', border: '1px solid #ddd' }}>Název ceníku</th>
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

        <Button
          variant="contained"
          sx={{ mt: 2, backgroundColor: '#00a3b1' }}
          onClick={handleNextStep}
          disabled={selectedCeniky.length === 0}
        >
          Pokračovat
        </Button>
      </Box>

      {/* Dialog pro výběr šablony, textu e‑mailu a příjemců */}
      <Dialog open={showDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Odeslání ceníku</DialogTitle>
        <DialogContent dividers>
          <Typography gutterBottom>
            Zvolte šablonu, napište text e‑mailu a vyberte příjemce.
          </Typography>
          {/* Box pro výběr příjemců */}
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
            label="Text e-mailu (HTML)"
            fullWidth
            multiline
            rows={4}
            margin="normal"
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
          />

          {/* Patička – Podpis nalezené osoby */}
          {matchingContact && (
            <Box sx={{ border: '1px solid #ddd', borderRadius: 1, p: 1, mt: 2, backgroundColor: '#fafafa' }}>
              <Typography variant="subtitle1">Podpis nalezené osoby</Typography>
              <Typography variant="body2">
                {matchingContact.fullName}
              </Typography>
              {/* Případně můžete přidat telefon, funkci apod., pokud data budou k dispozici */}
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
