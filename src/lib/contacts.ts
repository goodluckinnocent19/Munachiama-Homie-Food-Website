/**
 * Utility for generating vCard contact file and Google Contacts integration
 */

export function generateVCard(): string {
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    'FN:Munachiama | Chiama21 Hommie Foods',
    'ORG:Munachiama | Chiama21 Hommie Foods',
    'TEL;TYPE=CELL,VOICE,whatsapp:+2348065124134',
    'EMAIL:chiama21hommiefoods@gmail.com',
    'ADR;TYPE=WORK:;;Ada-George Road, Mgbuoba;Port Harcourt;Rivers State;;Nigeria',
    'URL:https://wa.me/2348065124134',
    'NOTE:Munachiama | Chiama21 Hommie Foods - Premium natural drinks, cold-pressed juices, gourmet small chops, parfaits & luxury gift hampers.',
    'END:VCARD'
  ].join('\r\n');
}

export function downloadVCard() {
  const vcardData = generateVCard();
  const blob = new Blob([vcardData], { type: 'text/vcard;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'Munachiama_Chiama21_Hommie_Foods.vcf');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
