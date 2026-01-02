document.addEventListener('DOMContentLoaded', () => {
    // Referências aos elementos (mantendo os IDs originais)
    const pedidoInput = document.getElementById('pedido');
    const fileInput = document.getElementById('pedidoFile');
    const fileNameSpan = document.getElementById('fileName');
    const fileIconSpan = document.getElementById('fileIcon');
    const uploadBtn = document.getElementById('uploadBtn');
    const statusDiv = document.getElementById('status');
  
    // 1. Atualizar visual quando um arquivo é selecionado
    fileInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      
      if (file) {
        fileIconSpan.textContent = '📎'; // Ícone de clipe
        fileNameSpan.textContent = file.name;
        fileNameSpan.style.color = '#1f2937'; // Cor mais escura para destaque
        statusDiv.textContent = ''; // Limpa status anterior
      } else {
        fileIconSpan.textContent = '';
        fileNameSpan.textContent = '';
      }
    });
  
    // 2. Lógica do Botão de Enviar
    uploadBtn.addEventListener('click', async() => {
      const numeroPedido = pedidoInput.value.trim();
      const arquivoSelecionado = fileInput.files[0];
  
      // Limpa classes de status
      statusDiv.className = 'status';
  
      // Validação Simples
      if (!numeroPedido) {
        mostrarStatus('Por favor, digite o número do pedido.', 'error');
        pedidoInput.focus();
        return;
      }
  
      if (!arquivoSelecionado) {
        mostrarStatus('Por favor, selecione um arquivo .txt.', 'error');
        return;
      }
  
      // Se passou na validação (aqui entraria sua lógica de fetch/axios para o backend)
      console.log('Enviando dados...');
      console.log('Pedido:', numeroPedido);
      console.log('Arquivo:', arquivoSelecionado.name);
  
      uploadBtn.disabled = true;
      uploadBtn.textContent = 'Enviando...';

      const formData = new FormData();
      formData.append('pedido', arquivoSelecionado);
      formData.append('numeroPedido', numeroPedido);

      try {
        const res = await fetch('/order/upload', {
          method: 'POST',
          body: formData
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Erro ao enviar arquivo');
        }

        // salva o pedido para a próxima tela
        const pedidoLimpo = numeroPedido.replace(/[^0-9]/g, '');
        sessionStorage.setItem('pedidoNumero', pedidoLimpo);

        mostrarStatus('Arquivo enviado com sucesso!', 'success');

        // redireciona após sucesso
        setTimeout(() => {
          window.location.href = '/separaçãoDePedidos.html';
        }, 1500);

      } catch (err) {
        mostrarStatus(err.message, 'error');
        uploadBtn.disabled = false;
        uploadBtn.textContent = 'Enviar';
}

});

    // Função auxiliar para mensagens
    function mostrarStatus(mensagem, tipo) {
      statusDiv.textContent = mensagem;
      statusDiv.classList.add(tipo);
    }
});