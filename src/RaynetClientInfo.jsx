import React, { useEffect, useState } from 'react';

function RaynetClientInfo() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [data, setData]       = useState(null);

  // 1) Při načtení komponenty přečteme z URL parametry entityId, userName...
  //   Např. "?entityId=926&entityName=company&userName=XYZ&userId=3"
  //   Ty si získáme z window.location.search
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Získáme query parametry
        const searchParams = new URLSearchParams(window.location.search);
        const entityId     = searchParams.get('entityId') || 926;
        const entityName   = searchParams.get('entityName') || 'company';
        const userName     = searchParams.get('userName') || 'Neuvedeno';
        const userId       = searchParams.get('userId') || 0;

        // 2) Zavoláme náš backend
        //    Mějte na paměti, že URL je adresa nasazeného Node backendu (Render, Vercel, ...).
        //    Např. "https://moje-aplikace-backend.onrender.com/api/data"
        //    Zde pro ukázku: localhost:3001
        const response = await fetch(
          `http://localhost:3001/api/data?entityId=${entityId}&entityName=${entityName}&userName=${userName}&userId=${userId}`
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // 3) Vykreslení
  if (loading) {
    return <div>Načítám data...</div>;
  }
  if (error) {
    return <div style={{ color: 'red' }}>Chyba: {error}</div>;
  }
  if (!data) {
    return <div>Žádná data</div>;
  }

  // data.client, data.user, data.priceLists

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', backgroundColor: '#f5f5f5' }}>
      <h1>Správa ceníků</h1>

      {/* Informace o klientovi */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <div style={{ background: '#fff', padding: '16px', borderRadius: '6px', border: '1px solid #ccc', flex: 1 }}>
          <h2>Informace o klientovi</h2>
          <table>
            <tbody>
              <tr><th>Název společnosti</th><td>{data.client.name}</td></tr>
              <tr><th>Email</th><td>{data.client.email}</td></tr>
              <tr><th>Telefon</th><td>{data.client.phone}</td></tr>
              <tr><th>Zákaznická skupina</th><td>{data.client.customerGroup}</td></tr>
            </tbody>
          </table>
        </div>

        <div style={{ background: '#fff', padding: '16px', borderRadius: '6px', border: '1px solid #ccc', flex: 1 }}>
          <h2>Informace o uživateli</h2>
          <table>
            <tbody>
              <tr><th>User Name</th><td>{data.user.userName}</td></tr>
              <tr><th>User ID</th><td>{data.user.userId}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Seznam ceníků */}
      <div style={{ background: '#fff', padding: '16px', borderRadius: '6px', border: '1px solid #ccc' }}>
        <h2>Seznam ceníků (filtrováno podle: {data.client.customerGroup})</h2>
        {data.priceLists.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#00a3b1', color: '#fff' }}>
                <th style={{ textAlign: 'left', padding: '8px', border: '1px solid #ccc' }}>ID</th>
                <th style={{ textAlign: 'left', padding: '8px', border: '1px solid #ccc' }}>Kód</th>
                <th style={{ textAlign: 'left', padding: '8px', border: '1px solid #ccc' }}>Název</th>
                <th style={{ textAlign: 'left', padding: '8px', border: '1px solid #ccc' }}>Platnost od</th>
                <th style={{ textAlign: 'left', padding: '8px', border: '1px solid #ccc' }}>Platnost do</th>
              </tr>
            </thead>
            <tbody>
              {data.priceLists.map((item) => {
                return (
                  <tr key={item.id} style={{ border: '1px solid #ccc' }}>
                    <td style={{ padding: '8px' }}>{item.id}</td>
                    <td style={{ padding: '8px' }}>{item.code}</td>
                    <td style={{ padding: '8px' }}>{item.name || 'Neuvedeno'}</td>
                    <td style={{ padding: '8px' }}>{item.validFrom || 'Neuvedeno'}</td>
                    <td style={{ padding: '8px' }}>{item.validTill || 'Neomezená'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p style={{ color: '#999' }}>Ceníky nenalezeny.</p>
        )}
      </div>
    </div>
  );
}

export default RaynetClientInfo;
