// tratamento de erro para produtos não encontrados com o EAN
export class ProdutoNaoEncontradoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProdutoNaoEncontradoError";
  }
}

// tratamento de erro para produtos finalizados
export class ProdutoFinalizadoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProdutoFinalizadoError";
  }
}
