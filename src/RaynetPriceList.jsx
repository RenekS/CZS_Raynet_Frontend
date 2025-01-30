import React, { useState, useEffect } from 'react';

function RaynetPriceList() {
  const [raynetData, setRaynetData] = useState(null);
  const [offerData, setOfferData] = useState(null);
  const [error, setError] = useState(null);
  const [offerError, setOfferError] = useState(null);

  // Parsování URL parametrů
  const queryParams = new URLSearchParams(window.location.search);
  const entityId = queryParams.get('entityId');
  const entityName = queryParams.get('entityName');

  // Funkce pro stažení PDF
  const downloadPDF = async (offerId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/raynet-offer-pdf/${offerId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `offer_${offerId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      alert(`Chyba při stahování PDF: ${err.message}`);
    }
  };

  // Funkce pro načtení nabídky
  const fetchOfferData = async (offerId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/raynet-offer/${offerId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const jsonData = await response.json();
      setOfferData(jsonData.data);
      setOfferError(null);
    } catch (err) {
      setOfferError(err.message);
      setOfferData(null);
    }
  };

  // Funkce pro načtení Raynet dat
  const fetchRaynetData = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/raynet-data?entityId=926');
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const jsonData = await response.json();
      setRaynetData(jsonData.data);
      setError(null);
    } catch (err) {
      setError(err.message);
      setRaynetData(null);
    }
  };

  // Načtení dat nabídky při změně parametrů
  useEffect(() => {
    if (entityName === 'Offer' && entityId) {
      fetchOfferData(entityId);
    }
  }, [entityName, entityId]);

  return (
    <div style={{ margin: '20px' }}>
      <h1>Ukázka Raynet ceníků (React + Node)</h1>
      
      {/* Zobrazení podle typu entity */}
      {entityName === 'Offer' && entityId ? (
        <div>
          {offerError && (
            <div style={{ color: 'red', marginTop: '10px' }}>
              Chyba: {offerError}
            </div>
          )}
          {offerData ? (
            <div>
              <h2>Informace o nabídce</h2>
              <table>
                <tbody>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Název nabídky</th>
                    <td>{offerData.name}</td>
                  </tr>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Kód</th>
                    <td>{offerData.code}</td>
                  </tr>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Společnost</th>
                    <td>{offerData.company.name}</td>
                  </tr>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Vlastník</th>
                    <td>{offerData.owner.fullName}</td>
                  </tr>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Platnost od</th>
                    <td>{offerData.validFrom || 'Neuvedeno'}</td>
                  </tr>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Platnost do</th>
                    <td>{offerData.validTill || 'Neomezená'}</td>
                  </tr>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Celková částka</th>
                    <td>{offerData.totalAmount} {offerData.currency.value}</td>
                  </tr>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Status nabídky</th>
                    <td>{offerData.offerStatus.value}</td>
                  </tr>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Popis</th>
                    <td>{offerData.description || 'Bez popisu'}</td>
                  </tr>
                </tbody>
              </table>

              <h2>Seznam produktů</h2>
              <table border="1" cellPadding="6" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Název produktu</th>
                    <th>Popis</th>
                    <th>Cena</th>
                    <th>Daň</th>
                    <th>Jednotka</th>
                    <th>Počet</th>
                    <th>Diskont (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {offerData.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.name}</td>
                      <td>{item.description || 'Bez popisu'}</td>
                      <td>{item.price}</td>
                      <td>{item.taxRateName}</td>
                      <td>{item.unit}</td>
                      <td>{item.count}</td>
                      <td>{item.discountPercent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button 
                onClick={() => downloadPDF(offerData.id)} 
                style={{ marginTop: '20px' }}
              >
                Stáhnout nabídku jako PDF
              </button>
            </div>
          ) : (
            <button onClick={() => fetchOfferData(entityId)}>
              Zobrazit nabídku z Raynetu
            </button>
          )}
        </div>
      ) : (
        <div>
          <button onClick={fetchRaynetData}>
            Zobrazit data z Raynetu
          </button>
          {error && (
            <div style={{ color: 'red', marginTop: '10px' }}>
              Chyba: {error}
            </div>
          )}
          {raynetData && (
            <div style={{ marginTop: '20px' }}>
              <h2>Informace o klientovi</h2>
              <table>
                <tbody>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Název společnosti</th>
                    <td>{raynetData.companyName}</td>
                  </tr>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Email</th>
                    <td>{raynetData.companyEmail}</td>
                  </tr>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Telefon</th>
                    <td>{raynetData.companyPhone}</td>
                  </tr>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Zákaznická skupina</th>
                    <td>{raynetData.customerGroup}</td>
                  </tr>
                </tbody>
              </table>

              <h2>Seznam ceníků</h2>
              <table border="1" cellPadding="6" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>ID ceníku</th>
                    <th>Kód</th>
                    <th>Název</th>
                    <th>Platnost od</th>
                    <th>Platnost do</th>
                  </tr>
                </thead>
                <tbody>
                  {raynetData.priceLists.map((priceList) => (
                    <tr key={priceList.id}>
                      <td>{priceList.id}</td>
                      <td>{priceList.code}</td>
                      <td>{priceList.name || 'Neuvedeno'}</td>
                      <td>{priceList.validFrom || 'Neuvedeno'}</td>
                      <td>{priceList.validTill || 'Neomezená'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default RaynetPriceList;
