import React from 'react';

function DownloadPriceList() {
  const handleDownload = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/generate-price-list-docx');
      if (!response.ok) {
        throw new Error('Chyba při generování dokumentu');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'cenik.docx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert('Chyba při stahování ceníku');
    }
  };

  return (
    <div>
      <button onClick={handleDownload}>Stáhnout ceník</button>
    </div>
  );
}

export default DownloadPriceList;
