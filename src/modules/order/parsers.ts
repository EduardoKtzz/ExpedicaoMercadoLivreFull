// é um módulo nativo do Node.js. Permite ler, escrever, criar, deletar e manipular arquivos.
import fs from 'fs'

// função para ler o arquivo txt com os ZPL
export function lerArquivoZPL(Path: string): string {
  return fs.readFileSync(Path, 'utf-8')
}

// função para decodificar os caracteres estranhos no nome do produto
function decodificarCaracteres(text: string): string {

  // cria um array vazio de numeros
  const bytes: number[] = [];
  let i = 0;

  // inicia um loop para percorrer essas caracteres e caso encontre um caractere diferente do padrão, ele muda para a letra equivalente
  while (i < text.length) {
    if (text[i] === '_' && /^[0-9A-F]{2}$/i.test(text.substr(i + 1, 2))) {
      bytes.push(parseInt(text.substr(i + 1, 2), 16));
      i += 3;
    } else {
      bytes.push(text.charCodeAt(i));
      i++;
    }
  }

  // retorno da função
  return Buffer.from(bytes).toString('utf-8');
}

function decodificarGS(text: string): string {
  const bytes: number[] = [];
  let i = 0;

  while (i < text.length) {
    // se encontrar _XX válido, decodifica
    if (text[i] === '_' && /^[0-9A-F]{2}$/i.test(text.substr(i + 1, 2))) {
      bytes.push(parseInt(text.substr(i + 1, 2), 16));
      i += 3;
    } else {
      const code = text.charCodeAt(i);
      // ignora caracteres inválidos (fora da faixa ASCII básica)
      if (code >= 32 && code <= 126) {
        bytes.push(code);
      }
      i++;
    }
  }

  return Buffer.from(bytes).toString('utf-8');
}

// definir onde começa e acaba cada etiqueta
// filter = remove espaços em branco do começo e do fim
// !== '' = mantém apenas elementos que não são strings vazias
function separarEtiquetas(zplText: string): string[] {
  return zplText
    .split(/\^XA/) // pega o início
    .filter(e => e.trim() !== '')
    .map(e => '^XA' + e.trim() + '^XZ'); // adiciona o ^XA e ^XZ  de volta
}

// função para extrair dados das etiquetas, e realizar a separação em array
// função principal
export function coletaDadosEtiqueta(zplText: string) {
  
  // chamando função para separação de etiquetas
  const etiquetas = separarEtiquetas(zplText)

  return etiquetas.map(etiqueta => {

    // extrair os dados com regex = match

    // Extrair código interno Mercado Livre
    // Captura qualquer ^FD...^FS que esteja depois de ^BCN
    const codigoMLMatch = etiqueta.match(/\^BCN[^\^]*\^FD([A-Z0-9]+)\^FS/)
    const codInternoML = codigoMLMatch ? codigoMLMatch[1] : null;

    // SKU = procura literalmente a string SKU
    // \s* = permite 0 ou mais espaços após SKU
    // ([A-Z0-9_-]+) = captura letras maiúsculas, números, _ ou - 
    // i = case-insensitive, não diferencia maiúsculas/minúsculas

    // se encontrar, skuMatch[1] é o valor do SKU. / se não encontrar, sku = null.
    const skuMatch = etiqueta.match(/SKU:\s*([A-Z0-9_-]+)/i)
    const GS = skuMatch ? decodificarGS (skuMatch[1]) : null

    // extrair nome do produto

    //matchAll = pega todas as ocorrências de ^FD...^FS
    //.filter = remove linhas que sejam apenas códigos
    //[nomeMatch.length - 1] = pega o último texto válido, que é o nome do produto
    const nomeMatch = etiqueta.match(/\^FO214,185.*\^FD([^\^]+)\^FS/)
    const nomeProduto = nomeMatch ? decodificarCaracteres(nomeMatch[1].trim()) : null;

    // extrair a quantidade

    // ^PQ = procura a linha que define a quantidade
    // (\d+) = captura um ou mais dígitos
    // parseInt(..., 10) = converte de string para número

    const quantidadeMatch = etiqueta.match(/\^PQ(\d+)/)
    const quantidadeTotal = quantidadeMatch ? parseInt(quantidadeMatch[1], 10) : 1;

    return {codInternoML ,nomeProduto, GS, quantidadeTotal, ZPLfull: etiqueta};

  })

  }



