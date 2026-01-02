    async function imprimirZPL(zpl) {
    try {
    // 1. Conecta ao QZ Tray
    if (!qz.websocket.isActive()) {
    await qz.websocket.connect()
}

    // 2. Define a impressora
    const printer = await qz.printers.getDefault()

    const config = qz.configs.create(printer, {
    forceRaw: true, // MUITO IMPORTANTE pra ZPL
    jobName: 'Etiqueta ZPL - Pedido'
})

    // 3. Envia o ZPL como RAW
    const data = [{
    type: 'raw',
    format: 'command',
    data: zpl
}]

    await qz.print(config, data)

    console.log('✅ ZPL enviado para impressão')

} catch (err) {
    console.error('❌ Erro ao imprimir ZPL:', err)
}
}

// Torna a função global
window.imprimirZPL = imprimirZPL;