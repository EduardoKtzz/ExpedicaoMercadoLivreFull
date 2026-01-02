const form = document.getElementById('cadastroForm')
const statusDiv = document.getElementById('status')

form.addEventListener('submit', async (e) => {
  e.preventDefault()

  const nome = document.getElementById('nome').value
  const email = document.getElementById('email').value
  const password = document.getElementById('password').value
  const confirmPassword = document.getElementById('confirmPassword').value

  if (password !== confirmPassword) {
    statusDiv.textContent = 'As senhas não coincidem'
    statusDiv.style.color = 'red'
    return
  }

  try {
    const response = await fetch('http://localhost:3000/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, password })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error)
    }

    statusDiv.textContent = 'Cadastro realizado com sucesso!'
    statusDiv.style.color = 'green'

    setTimeout(() => {
      window.location.href = '/index.html'
    }, 1500)

  } catch (err) {
    statusDiv.textContent = err.message
    statusDiv.style.color = 'red'
  }
})
