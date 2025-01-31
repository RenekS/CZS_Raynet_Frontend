import React, { useState } from 'react';

function RaynetPriceList() {
  const [raynetData, setRaynetData] = useState(null);
  const [error, setError] = useState(null);

  const fetchRaynetData = async () => {
    try {
      // Pokud backend běží na localhost:3001, použijeme tuto URL
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

  return (
    <div style={{ margin: '20px' }}>
      <h1>Ukázka Raynet ceníků (React + Node)</h1>
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
  );
}

export default RaynetPriceList;
