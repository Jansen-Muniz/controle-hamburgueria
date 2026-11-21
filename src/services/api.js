const API_URL =
  "https://script.google.com/macros/s/AKfycbzZB1Xqp-I5HOGkD5LOVQcKD2kdsEuSDQ-4l0p0IzDxqR-_yzRdJcDOgX8y7-gbcW8cDg/exec"

export async function registrarVenda(dados) {
  const resposta = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(dados),
  })

  const resultado = await resposta.json()

  if (resultado.status !== "sucesso") {
    throw new Error("Não foi possível registrar a venda.")
  }

  return resultado
}

export async function registrarSaida(dados) {
  const resposta = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      tipo: "saida",
      ...dados,
    }),
  })

  const resultado = await resposta.json()

  if (resultado.status !== "sucesso") {
    throw new Error("Não foi possível registrar a despesa.")
  }

  return resultado
}

export async function buscarMovimentacoes() {
  const resposta = await fetch(API_URL)

  const resultado = await resposta.json()

  if (resultado.status !== "sucesso") {
    throw new Error("Não foi possível consultar as movimentações.")
  }

  return resultado.movimentacoes
}
