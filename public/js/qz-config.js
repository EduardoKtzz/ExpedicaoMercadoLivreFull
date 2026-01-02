// CARREGAR CERTIFICADO PÚBLICO
qz.security.setCertificatePromise((resolve, reject) => {
  fetch("http://192.168.1.128:3000/certs/digital-certificate.txt", { cache: "no-store" })
    .then(r => r.text())
    .then(resolve)
    .catch(reject);
});

qz.security.setSignatureAlgorithm("SHA512");

// CONFIGURAR ASSINATURA
qz.security.setSignaturePromise((toSign) => (resolve, reject) => {
  fetch("http://192.168.1.128:3000/sign?request=" + encodeURIComponent(toSign), { cache: "no-store" })
    .then(r => r.text())
    .then(resolve)
    .catch(reject);
});
