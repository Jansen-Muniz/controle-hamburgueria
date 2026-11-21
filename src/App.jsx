import { useState, useEffect } from "react"
import logo from "./assets/logo-hamburgueria.jpg"
import {
  registrarVenda,
  registrarSaida,
  buscarMovimentacoes,
} from "./services/api"

const App = () => {
  const [tela, setTela] = useState("inicio")
  const [mensagem, setMensagem] = useState("")

  const [venda, setVenda] = useState({
    pix: "",
    especie: "",
    cartao: "",
    data: new Date().toLocaleDateString("en-CA"),
  })

  const [despesa, setDespesa] = useState({
    descricao: "",
    categoria: "",
    valor: "",
    data: new Date().toLocaleDateString("en-CA"),
  })

  const [movimentacoes, setMovimentacoes] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [erroMovimentacoes, setErroMovimentacoes] = useState("")
  const [periodo, setPeriodo] = useState("todas")
  const [tipoFiltro, setTipoFiltro] = useState("todos")
  const [categoriaFiltro, setCategoriaFiltro] = useState("todas")
  const [busca, setBusca] = useState("")
  const [formaPagamento, setFormaPagamento] = useState("todas")

  useEffect(() => {
    if (!mensagem) return

    const tempo = mensagem.includes("sucesso") ? 3000 : 5000

    const temporizador = setTimeout(() => {
      setMensagem("")
    }, tempo)

    return () => clearTimeout(temporizador)
  }, [mensagem])

  useEffect(() => {
    if (tela !== "historico" && tela !== "inicio") return

    const carregarMovimentacoes = async () => {
      try {
        setCarregando(true)
        setErroMovimentacoes("")

        const dados = await buscarMovimentacoes()

        setMovimentacoes(dados)
      } catch (erro) {
        console.error(erro)
        setErroMovimentacoes("Não foi possível carregar as movimentações.")
      } finally {
        setCarregando(false)
      }
    }

    carregarMovimentacoes()
  }, [tela])

  const formatarMoeda = (valor) => {
    const numeros = valor.replace(/\D/g, "")
    const numero = (Number(numeros) / 100).toFixed(2)

    return (
      "R$ " + numero.replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    )
  }

  const atualizarValor = (campo, valor) => {
    setVenda({
      ...venda,
      [campo]: formatarMoeda(valor),
    })
  }

  const salvarVenda = async () => {
    try {
      const dados = {
        pix: venda.pix.replace("R$ ", "").replace(/\./g, "").replace(",", "."),
        especie: venda.especie
          .replace("R$ ", "")
          .replace(/\./g, "")
          .replace(",", "."),
        cartao: venda.cartao
          .replace("R$ ", "")
          .replace(/\./g, "")
          .replace(",", "."),
        data: venda.data,
      }

      await registrarVenda(dados)

      setMensagem("Venda registrada com sucesso!")

      setVenda({
        pix: "",
        especie: "",
        cartao: "",
        data: new Date().toLocaleDateString("en-CA"),
      })
    } catch (erro) {
      console.error(erro)
      setMensagem("Erro ao registrar a venda. Tente novamente.")
    }
  }

  const salvarSaida = async () => {
    try {
      if (!despesa.descricao.trim() || !despesa.categoria || !despesa.valor) {
        setMensagem("Preencha todos os campos da despesa.")
        return
      }

      const dados = {
        descricao: despesa.descricao.trim(),
        categoria: despesa.categoria,
        valor: despesa.valor
          .replace("R$ ", "")
          .replace(/\./g, "")
          .replace(",", "."),
        data: despesa.data,
      }

      await registrarSaida(dados)

      setMensagem("Despesa registrada com sucesso!")

      setDespesa({
        descricao: "",
        categoria: "",
        valor: "",
        data: new Date().toLocaleDateString("en-CA"),
      })
    } catch (erro) {
      console.error(erro)
      setMensagem("Erro ao registrar a despesa. Tente novamente.")
    }
  }

  const hoje = new Date()

  const anoMesAtual = `${hoje.getFullYear()}-${String(
    hoje.getMonth() + 1,
  ).padStart(2, "0")}`

  const movimentacoesDoMes = movimentacoes.filter(
    (item) => item.data?.slice(0, 7) === anoMesAtual,
  )

  const totalEntradas = movimentacoesDoMes
    .filter((item) => item.tipo === "entrada")
    .reduce((total, item) => total + Number(item.valor), 0)

  const totalSaidas = movimentacoesDoMes
    .filter((item) => item.tipo === "saida")
    .reduce((total, item) => total + Number(item.valor), 0)

  const saldoMes = totalEntradas - totalSaidas

  hoje.setHours(0, 0, 0, 0)

  const movimentacoesFiltradas = movimentacoes.filter((item) => {
    const dataItem = new Date(`${item.data}T00:00:00`)

    if (tipoFiltro !== "todos" && item.tipo !== tipoFiltro) {
      return false
    }

    if (
      categoriaFiltro !== "todas" &&
      (item.tipo !== "saida" || item.categoria !== categoriaFiltro)
    ) {
      return false
    }

    if (
      busca.trim() &&
      !String(item.descricao || "")
        .toLowerCase()
        .includes(busca.trim().toLowerCase())
    ) {
      return false
    }

    if (formaPagamento !== "todas") {
      if (item.tipo !== "entrada") {
        return false
      }

      if (Number(item[formaPagamento]) <= 0) {
        return false
      }
    }

    if (periodo === "hoje") {
      return dataItem.getTime() === hoje.getTime()
    }

    if (periodo === "ultimos7") {
      const limite = new Date(hoje)
      limite.setDate(hoje.getDate() - 6)

      return dataItem >= limite && dataItem <= hoje
    }

    if (periodo === "mes") {
      return (
        dataItem.getMonth() === hoje.getMonth() &&
        dataItem.getFullYear() === hoje.getFullYear()
      )
    }

    if (periodo === "mesAnterior") {
      const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)

      return (
        dataItem.getMonth() === mesAnterior.getMonth() &&
        dataItem.getFullYear() === mesAnterior.getFullYear()
      )
    }

    return true
  })

  return (
    <div className="app">
      <header className="cabecalho">
        <img src={logo} alt="Hamburgueria Muniz" />
        <div>
          <h1>Controle Hamburgueria</h1>
          <p>Gestão de entradas e saídas</p>
        </div>
      </header>

      <main className="conteudo">
        {tela === "inicio" ? (
          <>
            <div className="resumo-financeiro">
              <div className="card-resumo">
                <span>Entradas do mês</span>
                <strong className="valor-entrada">
                  {totalEntradas.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </strong>
              </div>

              <div className="card-resumo">
                <span>Saídas do mês</span>
                <strong className="valor-saida">
                  {totalSaidas.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </strong>
              </div>

              <div className="card-resumo">
                <span>Saldo do mês</span>
                <strong
                  className={saldoMes >= 0 ? "valor-entrada" : "valor-saida"}
                >
                  {saldoMes.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </strong>
              </div>
            </div>

            <div className="titulo-painel">
              <h2>Bem-vindo!</h2>
              <p>O que deseja fazer hoje?</p>
            </div>

            <div className="menu-principal">
              <button
                className="card-menu entrada"
                onClick={() => setTela("entrada")}
              >
                <span className="icone">＋</span>
                <strong>Registrar entrada</strong>
                <small>Registrar vendas do dia</small>
              </button>

              <button
                className="card-menu saida"
                onClick={() => setTela("saida")}
              >
                <span className="icone">−</span>
                <strong>Registrar saída</strong>
                <small>Registrar despesas</small>
              </button>

              <button
                className="card-menu historico"
                onClick={() => setTela("historico")}
              >
                <span className="icone">☰</span>
                <strong>Movimentações</strong>
                <small>Consultar entradas e saídas</small>
              </button>
            </div>
          </>
        ) : (
          <div className="area-tela">
            <button className="botao-voltar" onClick={() => setTela("inicio")}>
              ← Voltar ao início
            </button>

            {tela === "entrada" && (
              <>
                <h2>Registrar entrada</h2>
                <p>Informe os valores das vendas.</p>

                <form className="formulario-entrada">
                  <label>PIX</label>
                  <input
                    type="text"
                    placeholder="R$ 0,00"
                    value={venda.pix}
                    onChange={(e) => atualizarValor("pix", e.target.value)}
                  />

                  <label>Espécie</label>
                  <input
                    type="text"
                    placeholder="R$ 0,00"
                    value={venda.especie}
                    onChange={(e) => atualizarValor("especie", e.target.value)}
                  />

                  <label>Cartão</label>
                  <input
                    type="text"
                    placeholder="R$ 0,00"
                    value={venda.cartao}
                    onChange={(e) => atualizarValor("cartao", e.target.value)}
                  />

                  <label>Data da venda</label>
                  <input
                    type="date"
                    value={venda.data}
                    onChange={(e) =>
                      setVenda({ ...venda, data: e.target.value })
                    }
                  />

                  {mensagem && (
                    <p
                      className={
                        mensagem.includes("Erro")
                          ? "mensagem-erro"
                          : "mensagem-entrada"
                      }
                    >
                      {mensagem}
                    </p>
                  )}

                  <button
                    type="button"
                    className="botao-salvar"
                    onClick={salvarVenda}
                  >
                    Registrar venda
                  </button>
                </form>
              </>
            )}

            {tela === "saida" && (
              <>
                <h2>Registrar saída</h2>
                <p>Informe os dados da despesa.</p>

                <form className="formulario-entrada">
                  <label>Descrição</label>
                  <input
                    type="text"
                    placeholder="Ex.: Compra de carnes"
                    value={despesa.descricao}
                    onChange={(e) =>
                      setDespesa({ ...despesa, descricao: e.target.value })
                    }
                  />
                  <label>Categoria</label>

                  <select
                    value={despesa.categoria}
                    onChange={(e) =>
                      setDespesa({ ...despesa, categoria: e.target.value })
                    }
                  >
                    <option value="">Selecione uma categoria</option>
                    <option value="Fornecedores">Fornecedores</option>
                    <option value="Alimentação">Alimentação</option>
                    <option value="Funcionários">Funcionários</option>
                    <option value="Energia">Energia</option>
                    <option value="Água">Água</option>
                    <option value="Gás">Gás</option>
                    <option value="Manutenção">Manutenção</option>
                    <option value="Outros">Outros</option>
                  </select>

                  <label>Valor</label>
                  <input
                    type="text"
                    placeholder="R$ 0,00"
                    value={despesa.valor}
                    onChange={(e) =>
                      setDespesa({
                        ...despesa,
                        valor: formatarMoeda(e.target.value),
                      })
                    }
                  />
                  <label>Data da despesa</label>
                  <input
                    type="date"
                    value={despesa.data}
                    onChange={(e) =>
                      setDespesa({ ...despesa, data: e.target.value })
                    }
                  />

                  {mensagem && (
                    <p
                      className={
                        mensagem.includes("Erro")
                          ? "mensagem-erro"
                          : "mensagem-saida"
                      }
                    >
                      {mensagem}
                    </p>
                  )}

                  <button
                    type="button"
                    className="botao-salvar"
                    onClick={salvarSaida}
                  >
                    Registrar despesa
                  </button>
                </form>
              </>
            )}

            {tela === "historico" && (
              <>
                <h2>Movimentações</h2>
                <p>Consulte todas as entradas e saídas da hamburgueria.</p>

                <div className="grade-filtros">
                  <div className="filtros-movimentacoes">
                    <label htmlFor="filtro-periodo">Filtrar por período:</label>

                    <select
                      id="filtro-periodo"
                      value={periodo}
                      onChange={(e) => setPeriodo(e.target.value)}
                    >
                      <option value="todas">Todas as movimentações</option>
                      <option value="hoje">Hoje</option>
                      <option value="ultimos7">Últimos 7 dias</option>
                      <option value="mes">Este mês</option>
                      <option value="mesAnterior">Mês anterior</option>
                    </select>
                  </div>

                  <div className="filtro-tipo">
                    <label htmlFor="filtro-tipo">Tipo de movimentação:</label>

                    <select
                      id="filtro-tipo"
                      value={tipoFiltro}
                      onChange={(e) => setTipoFiltro(e.target.value)}
                    >
                      <option value="todos">Todas</option>
                      <option value="entrada">Somente entradas</option>
                      <option value="saida">Somente saídas</option>
                    </select>
                  </div>

                  <div className="filtro-categoria">
                    <label htmlFor="filtro-categoria">
                      Categoria da despesa:
                    </label>

                    <select
                      id="filtro-categoria"
                      value={categoriaFiltro}
                      onChange={(e) => setCategoriaFiltro(e.target.value)}
                      disabled={tipoFiltro === "entrada"}
                    >
                      <option value="todas">Todas as categorias</option>
                      <option value="Fornecedores">Fornecedores</option>
                      <option value="Alimentação">Alimentação</option>
                      <option value="Funcionários">Funcionários</option>
                      <option value="Energia">Energia</option>
                      <option value="Água">Água</option>
                      <option value="Gás">Gás</option>
                      <option value="Manutenção">Manutenção</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>

                  <div className="filtro-busca">
                    <label htmlFor="busca-movimentacao">
                      Pesquisar movimentação:
                    </label>

                    <input
                      id="busca-movimentacao"
                      type="text"
                      placeholder="Digite uma descrição..."
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                    />
                  </div>

                  <div className="filtro-pagamento">
                    <label htmlFor="filtro-pagamento">
                      Forma de recebimento:
                    </label>

                    <select
                      id="filtro-pagamento"
                      value={formaPagamento}
                      onChange={(e) => setFormaPagamento(e.target.value)}
                      disabled={tipoFiltro === "saida"}
                    >
                      <option value="todas">Todas as formas</option>
                      <option value="pix">PIX</option>
                      <option value="especie">Espécie</option>
                      <option value="cartao">Cartão</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    className="botao-limpar-filtros"
                    onClick={() => {
                      setPeriodo("todas")
                      setTipoFiltro("todos")
                      setCategoriaFiltro("todas")
                      setBusca("")
                      setFormaPagamento("todas")
                    }}
                  >
                    Limpar filtros
                  </button>
                </div>

                {carregando && <p>Carregando movimentações...</p>}

                {erroMovimentacoes && (
                  <p className="mensagem-erro">{erroMovimentacoes}</p>
                )}

                {!carregando && !erroMovimentacoes && (
                  <div className="lista-movimentacoes">
                    {movimentacoesFiltradas.length === 0 ? (
                      <p>Nenhuma movimentação encontrada neste período.</p>
                    ) : (
                      movimentacoesFiltradas.map((item, indice) => (
                        <div
                          className={`item-movimentacao ${item.tipo}`}
                          key={`${item.tipo}-${item.data}-${indice}`}
                        >
                          <div className="movimentacao-cabecalho">
                            <div>
                              <strong>{item.descricao}</strong>
                              <small>
                                {item.data.split("-").reverse().join("/")}
                              </small>
                            </div>

                            <span className={`etiqueta ${item.tipo}`}>
                              {item.tipo === "entrada" ? "Entrada" : "Saída"}
                            </span>
                          </div>

                          <strong className={`valor-movimentacao ${item.tipo}`}>
                            {item.tipo === "entrada" ? "+" : "−"}{" "}
                            {Number(item.valor).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </strong>

                          {item.tipo === "entrada" ? (
                            <div className="detalhes-venda">
                              <span>
                                PIX:{" "}
                                <strong>
                                  {Number(item.pix).toLocaleString("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                  })}
                                </strong>
                              </span>
                              <span>
                                Espécie:{" "}
                                <strong>
                                  {Number(item.especie).toLocaleString(
                                    "pt-BR",
                                    { style: "currency", currency: "BRL" },
                                  )}
                                </strong>
                              </span>
                              <span>
                                Cartão:{" "}
                                <strong>
                                  {Number(item.cartao).toLocaleString("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                  })}
                                </strong>
                              </span>
                            </div>
                          ) : (
                            <small className="categoria-movimentacao">
                              Categoria: {item.categoria}
                            </small>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
      <footer className="rodape">
        Desenvolvido por <strong>Jansen Muniz</strong> ©{" "}
        {new Date().getFullYear()}
      </footer>
    </div>
  )
}

export { App }
