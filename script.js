/* script.js — логика index.html:
 - собирает значения из полей (placeholder используются, но не обязательны)
 - формирует JSON, кодирует base64url(JSON).checksum
 - генерирует QR (qrcodejs) и даёт возможность скачать и скопировать ссылку
*/

(function(){
  // helpers base64url
  function b64EncodeUnicode(str){
    return btoa(unescape(encodeURIComponent(str))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  }
  async function sha256hex(msg){
    const enc = new TextEncoder();
    const data = enc.encode(msg);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('');
  }

  const form = document.getElementById('messageForm');
  const result = document.getElementById('result');
  const qrcodeEl = document.getElementById('qrcode');
  const downloadBtn = document.getElementById('downloadBtn');
  const copyBtn = document.getElementById('copyBtn');
  const openLink = document.getElementById('openLink');

  function getBaseCardURL(){
    const origin = window.location.origin;
    const path = window.location.pathname.replace(/\/?index\.html$/,'/');
    return `${origin}${path}card.html`;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const recipient = document.getElementById('recipient').value.trim();
    const sender = document.getElementById('sender').value.trim();
    const message = document.getElementById('message').value.trim();
    const flowers = document.getElementById('flowers').value.trim();

    const payload = {
      recipient: recipient || '',
      sender: sender || '',
      message: message || '',
      flowers: flowers || '',
      date: Date.now()
    };
    const json = JSON.stringify(payload);
    const b64 = b64EncodeUnicode(json);
    const hex = await sha256hex(json);
    const checksum = hex.slice(0,12);
    const p = `${b64}.${checksum}`;
    const link = `${getBaseCardURL()}?p=${encodeURIComponent(p)}`;

    // показать QR
    qrcodeEl.innerHTML = '';
    new QRCode(qrcodeEl, { text: link, width: 220, height: 220, correctLevel: QRCode.CorrectLevel.H });

    result.classList.remove('hidden');
    openLink.href = link;

    // скачать QR (canvas -> png)
    downloadBtn.onclick = () => {
      const canvas = qrcodeEl.querySelector('canvas');
      if(!canvas) return;
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'card_qr.png';
      a.click();
    };

    // копировать ссылку
    copyBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(link);
        copyBtn.textContent = 'Скопировано!';
        setTimeout(()=> copyBtn.textContent = 'Копировать ссылку', 1400);
      } catch (err) {
        alert('Копирование не удалось — скопируй ссылку вручную: ' + link);
      }
    };
  });
})();
