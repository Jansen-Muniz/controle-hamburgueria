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
  const [historicoExpandido, setHistoricoExpandido] = useState(false)
  const [mostrarBotaoTopo, setMostrarBotaoTopo] = useState(false)
  const [historicoSemanalExpandido, setHistoricoSemanalExpandido] =
    useState(false)
  const [mesesEntradasAnualExpandidos, setMesesEntradasAnualExpandidos] =
    useState([])
  const [mesesSaidasAnualExpandidos, setMesesSaidasAnualExpandidos] = useState(
    [],
  )
  const [dataRelatorioSemanal, setDataRelatorioSemanal] = useState(
    new Date().toLocaleDateString("en-CA"),
  )
  const [mesRelatorio, setMesRelatorio] = useState(
    String(new Date().getMonth() + 1).padStart(2, "0"),
  )
  const [anoRelatorio, setAnoRelatorio] = useState(
    String(new Date().getFullYear()),
  )

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
        console.log("Movimentações recebidas:", dados)
      } catch (erro) {
        console.error(erro)
        setErroMovimentacoes("Não foi possível carregar as movimentações.")
      } finally {
        setCarregando(false)
      }
    }

    carregarMovimentacoes()
  }, [tela])

  useEffect(() => {
    const verificarRolagem = () => {
      setMostrarBotaoTopo(window.scrollY > 300)
    }

    window.addEventListener("scroll", verificarRolagem)

    return () => {
      window.removeEventListener("scroll", verificarRolagem)
    }
  }, [])

  const formatarMoeda = (valor) => {
    const numeros = String(valor ?? "").replace(/\D/g, "")
    const numero = (Number(numeros) / 100).toFixed(2)

    return (
      "R$ " + numero.replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    )
  }

  const formatarValor = (valor) => {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
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

  const dataReferencia = new Date(`${dataRelatorioSemanal}T00:00:00`)

  const inicioSemana = new Date(dataReferencia)
  const diaSemana = inicioSemana.getDay()

  inicioSemana.setDate(
    inicioSemana.getDate() - (diaSemana === 0 ? 6 : diaSemana - 1),
  )

  const fimSemana = new Date(inicioSemana)
  fimSemana.setDate(inicioSemana.getDate() + 6)

  const formatarDataISO = (data) => {
    const ano = data.getFullYear()
    const mes = String(data.getMonth() + 1).padStart(2, "0")
    const dia = String(data.getDate()).padStart(2, "0")

    return `${ano}-${mes}-${dia}`
  }

  const inicioSemanaISO = formatarDataISO(inicioSemana)
  const fimSemanaISO = formatarDataISO(fimSemana)

  const movimentacoesDaSemana = movimentacoes.filter(
    (item) => item.data >= inicioSemanaISO && item.data <= fimSemanaISO,
  )

  const entradasSemana = movimentacoesDaSemana.filter(
    (item) => item.tipo === "entrada",
  )

  const saidasSemana = movimentacoesDaSemana.filter(
    (item) => item.tipo === "saida",
  )

  const totalEntradasSemana = entradasSemana.reduce(
    (total, item) => total + Number(item.valor || 0),
    0,
  )

  const totalSaidasSemana = saidasSemana.reduce(
    (total, item) => total + Number(item.valor || 0),
    0,
  )

  const totalPixSemana = entradasSemana.reduce(
    (total, item) => total + Number(item.pix || 0),
    0,
  )

  const totalEspecieSemana = entradasSemana.reduce(
    (total, item) => total + Number(item.especie || 0),
    0,
  )

  const totalCartaoSemana = entradasSemana.reduce(
    (total, item) => total + Number(item.cartao || 0),
    0,
  )

  const despesasPorCategoriaSemana = saidasSemana.reduce((grupos, item) => {
    const categoria = item.categoria || "Outros"

    grupos[categoria] = (grupos[categoria] || 0) + Number(item.valor || 0)

    return grupos
  }, {})

  const saldoSemana = totalEntradasSemana - totalSaidasSemana

  const anoMesRelatorio = `${anoRelatorio}-${mesRelatorio}`

  const movimentacoesDoAno = movimentacoes.filter(
    (item) => item.data?.slice(0, 4) === anoRelatorio,
  )

  const entradasAno = movimentacoesDoAno.filter(
    (item) => item.tipo === "entrada",
  )

  const saidasAno = movimentacoesDoAno.filter((item) => item.tipo === "saida")

  const totalEntradasAno = entradasAno.reduce(
    (total, item) => total + Number(item.valor || 0),
    0,
  )

  const totalPixAno = entradasAno.reduce(
    (total, item) => total + Number(item.pix || 0),
    0,
  )

  const totalEspecieAno = entradasAno.reduce(
    (total, item) => total + Number(item.especie || 0),
    0,
  )

  const totalCartaoAno = entradasAno.reduce(
    (total, item) => total + Number(item.cartao || 0),
    0,
  )

  const despesasPorCategoriaAno = saidasAno.reduce((grupos, item) => {
    const categoria = item.categoria || "Outros"

    grupos[categoria] = (grupos[categoria] || 0) + Number(item.valor || 0)

    return grupos
  }, {})

  const totalSaidasAno = saidasAno.reduce(
    (total, item) => total + Number(item.valor || 0),
    0,
  )

  const saldoAno = totalEntradasAno - totalSaidasAno

  const movimentacoesDoRelatorio = movimentacoes.filter(
    (item) => item.data?.slice(0, 7) === anoMesRelatorio,
  )

  const entradasRelatorio = movimentacoesDoRelatorio.filter(
    (item) => item.tipo === "entrada",
  )

  const saidasRelatorio = movimentacoesDoRelatorio.filter(
    (item) => item.tipo === "saida",
  )

  const totalEntradasRelatorio = entradasRelatorio.reduce(
    (total, item) => total + Number(item.valor || 0),
    0,
  )

  const totalPixRelatorio = entradasRelatorio.reduce(
    (total, item) => total + Number(item.pix || 0),
    0,
  )

  const totalEspecieRelatorio = entradasRelatorio.reduce(
    (total, item) => total + Number(item.especie || 0),
    0,
  )

  const totalCartaoRelatorio = entradasRelatorio.reduce(
    (total, item) => total + Number(item.cartao || 0),
    0,
  )

  const totalSaidasRelatorio = saidasRelatorio.reduce(
    (total, item) => total + Number(item.valor || 0),
    0,
  )

  const despesasPorCategoria = saidasRelatorio.reduce((grupos, item) => {
    const categoria = item.categoria || "Outros"

    grupos[categoria] = (grupos[categoria] || 0) + Number(item.valor || 0)

    return grupos
  }, {})

  const saldoRelatorio = totalEntradasRelatorio - totalSaidasRelatorio

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

              <button
                className="card-menu relatorios"
                onClick={() => setTela("relatorios")}
              >
                <span className="icone">📊</span>
                <strong>Relatórios</strong>
                <small>Consultar resultados financeiros</small>
              </button>
            </div>
          </>
        ) : (
          <div className="area-tela">
            <button className="botao-voltar" onClick={() => setTela("inicio")}>
              ← Voltar ao início
            </button>

            <>
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
                      onChange={(e) =>
                        atualizarValor("especie", e.target.value)
                      }
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
            </>

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

            {tela === "relatorios" && (
              <>
                <h2>Relatórios financeiros</h2>
                <p>Consulte os resultados financeiros da hamburgueria.</p>

                <div className="menu-relatorios">
                  <button onClick={() => setTela("relatorio-semanal")}>
                    Relatório semanal
                  </button>

                  <button onClick={() => setTela("relatorio-mensal")}>
                    Relatório mensal
                  </button>

                  <button onClick={() => setTela("relatorio-anual")}>
                    Relatório anual
                  </button>
                </div>
              </>
            )}

            {tela === "relatorio-mensal" && (
              <>
                <h2>Relatório mensal</h2>
                <p>Consulte os resultados financeiros por mês.</p>

                <div className="filtros-relatorio">
                  <div>
                    <label htmlFor="mes-relatorio">Mês</label>
                    <select
                      id="mes-relatorio"
                      value={mesRelatorio}
                      onChange={(e) => setMesRelatorio(e.target.value)}
                    >
                      <option value="01">Janeiro</option>
                      <option value="02">Fevereiro</option>
                      <option value="03">Março</option>
                      <option value="04">Abril</option>
                      <option value="05">Maio</option>
                      <option value="06">Junho</option>
                      <option value="07">Julho</option>
                      <option value="08">Agosto</option>
                      <option value="09">Setembro</option>
                      <option value="10">Outubro</option>
                      <option value="11">Novembro</option>
                      <option value="12">Dezembro</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="ano-relatorio">Ano</label>
                    <select
                      id="ano-relatorio"
                      value={anoRelatorio}
                      onChange={(e) => setAnoRelatorio(e.target.value)}
                    >
                      {Array.from(
                        { length: 5 },
                        (_, i) => new Date().getFullYear() - i,
                      ).map((ano) => (
                        <option key={ano} value={String(ano)}>
                          {ano}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="resumo-financeiro">
                  <div className="card-resumo">
                    <h3>Total de entradas</h3>
                    <p className="valor-entrada">
                      {formatarValor(totalEntradasRelatorio)}
                    </p>
                  </div>

                  <div className="card-resumo">
                    <h3>Total de saídas</h3>
                    <p className="valor-saida">
                      {formatarValor(totalSaidasRelatorio)}
                    </p>
                  </div>

                  <div className="card-resumo">
                    <h3>Saldo do mês</h3>
                    <p>{formatarValor(saldoRelatorio)}</p>
                  </div>
                </div>

                <div className="resumo-financeiro">
                  <div className="card-resumo">
                    <h3>Vendas por PIX</h3>
                    <p>{formatarValor(totalPixRelatorio)}</p>
                  </div>

                  <div className="card-resumo">
                    <h3>Vendas em dinheiro</h3>
                    <p>{formatarValor(totalEspecieRelatorio)}</p>
                  </div>

                  <div className="card-resumo">
                    <h3>Vendas no cartão</h3>
                    <p>{formatarValor(totalCartaoRelatorio)}</p>
                  </div>
                </div>

                <div className="secao-despesas">
                  <h3>Despesas por categoria</h3>

                  {Object.keys(despesasPorCategoria).length === 0 ? (
                    <p>Nenhuma despesa registrada neste mês.</p>
                  ) : (
                    <div className="lista-despesas-categoria">
                      {Object.entries(despesasPorCategoria).map(
                        ([categoria, valor]) => (
                          <div
                            className="item-despesa-categoria"
                            key={categoria}
                          >
                            <strong>{categoria}</strong>
                            <span>{formatarValor(valor)}</span>
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </div>

                <div className="secao-historico">
                  <div className="cabecalho-historico">
                    <h3>Histórico de movimentações</h3>

                    <button
                      type="button"
                      className="botao-toggle-historico"
                      onClick={() => setHistoricoExpandido(!historicoExpandido)}
                    >
                      {historicoExpandido ? "Recolher" : "Ver movimentações"}
                      {historicoExpandido ? " ▲" : " ▼"}
                    </button>
                  </div>

                  {movimentacoesDoRelatorio.length === 0 ? (
                    <p>Nenhuma movimentação registrada neste mês.</p>
                  ) : (
                    historicoExpandido && (
                      <>
                        <h3 className="titulo-grupo-historico">Entradas</h3>

                        <div className="lista-historico-relatorio">
                          {movimentacoesDoRelatorio
                            .filter((item) => item.tipo === "entrada")
                            .sort((a, b) => b.data.localeCompare(a.data))
                            .map((item, indice) => (
                              <div
                                className="item-historico-relatorio"
                                key={`entrada-${item.data}-${indice}`}
                              >
                                <div>
                                  <strong>Venda</strong>
                                  <span>
                                    {new Date(
                                      `${item.data}T00:00:00`,
                                    ).toLocaleDateString("pt-BR")}
                                  </span>
                                </div>

                                <strong className="valor-entrada">
                                  {formatarValor(item.valor)}
                                </strong>
                              </div>
                            ))}
                        </div>

                        <h3 className="titulo-grupo-historico">Saídas</h3>

                        <div className="lista-historico-relatorio">
                          {movimentacoesDoRelatorio
                            .filter((item) => item.tipo === "saida")
                            .sort((a, b) => b.data.localeCompare(a.data))
                            .map((item, indice) => (
                              <div
                                className="item-historico-relatorio"
                                key={`saida-${item.data}-${indice}`}
                              >
                                <div>
                                  <strong>
                                    {item.descricao ||
                                      item.categoria ||
                                      "Despesa"}
                                  </strong>
                                  <span>
                                    {new Date(
                                      `${item.data}T00:00:00`,
                                    ).toLocaleDateString("pt-BR")}
                                  </span>
                                </div>

                                <strong className="valor-saida">
                                  {formatarValor(item.valor)}
                                </strong>
                              </div>
                            ))}
                        </div>
                      </>
                    )
                  )}
                </div>

                <button
                  className="botao-voltar-relatorios"
                  onClick={() => setTela("relatorios")}
                >
                  ← Voltar aos relatórios
                </button>

                {mostrarBotaoTopo && (
                  <button
                    type="button"
                    className="botao-voltar-topo"
                    onClick={() =>
                      window.scrollTo({
                        top: 0,
                        behavior: "smooth",
                      })
                    }
                    aria-label="Voltar ao topo"
                  >
                    ↑
                  </button>
                )}
              </>
            )}

            {tela === "relatorio-semanal" && (
              <>
                <h2>Relatório semanal</h2>
                <p>Consulte os resultados financeiros por semana.</p>

                <div className="filtros-relatorio">
                  <div>
                    <label htmlFor="data-relatorio-semanal">
                      Escolha uma data
                    </label>

                    <input
                      type="date"
                      id="data-relatorio-semanal"
                      value={dataRelatorioSemanal}
                      onChange={(e) => setDataRelatorioSemanal(e.target.value)}
                    />
                  </div>
                </div>

                <p>
                  <strong>Período:</strong>{" "}
                  {inicioSemana.toLocaleDateString("pt-BR")} até{" "}
                  {fimSemana.toLocaleDateString("pt-BR")}
                </p>

                <div className="resumo-financeiro">
                  <div className="card-resumo">
                    <h3>Total de entradas</h3>
                    <p className="valor-entrada">
                      {formatarValor(totalEntradasSemana)}
                    </p>
                  </div>

                  <div className="card-resumo">
                    <h3>Total de saídas</h3>
                    <p className="valor-saida">
                      {formatarValor(totalSaidasSemana)}
                    </p>
                  </div>

                  <div className="card-resumo">
                    <h3>Saldo da semana</h3>
                    <p>{formatarValor(saldoSemana)}</p>
                  </div>
                </div>

                <div className="resumo-financeiro">
                  <div className="card-resumo">
                    <h3>Vendas por PIX</h3>
                    <p>{formatarValor(totalPixSemana)}</p>
                  </div>

                  <div className="card-resumo">
                    <h3>Vendas em dinheiro</h3>
                    <p>{formatarValor(totalEspecieSemana)}</p>
                  </div>

                  <div className="card-resumo">
                    <h3>Vendas no cartão</h3>
                    <p>{formatarValor(totalCartaoSemana)}</p>
                  </div>
                </div>

                <div className="secao-despesas">
                  <h3>Despesas por categoria</h3>

                  {Object.keys(despesasPorCategoriaSemana).length === 0 ? (
                    <p>Nenhuma despesa registrada nesta semana.</p>
                  ) : (
                    <div className="lista-despesas-categoria">
                      {Object.entries(despesasPorCategoriaSemana).map(
                        ([categoria, valor]) => (
                          <div
                            className="item-despesa-categoria"
                            key={categoria}
                          >
                            <strong>{categoria}</strong>
                            <span>{formatarValor(valor)}</span>
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </div>

                <div className="secao-historico">
                  <div className="cabecalho-historico">
                    <h3>Histórico de movimentações</h3>

                    <button
                      type="button"
                      className="botao-toggle-historico"
                      onClick={() =>
                        setHistoricoSemanalExpandido(!historicoSemanalExpandido)
                      }
                    >
                      {historicoSemanalExpandido
                        ? "Recolher"
                        : "Ver movimentações"}
                      {historicoSemanalExpandido ? " ▲" : " ▼"}
                    </button>
                  </div>

                  {movimentacoesDaSemana.length === 0 ? (
                    <p>Nenhuma movimentação registrada nesta semana.</p>
                  ) : (
                    historicoSemanalExpandido && (
                      <>
                        <h3 className="titulo-grupo-historico">Entradas</h3>

                        <div className="lista-historico-relatorio">
                          {movimentacoesDaSemana
                            .filter((item) => item.tipo === "entrada")
                            .sort((a, b) => b.data.localeCompare(a.data))
                            .map((item, indice) => (
                              <div
                                className="item-historico-relatorio"
                                key={`entrada-${item.data}-${indice}`}
                              >
                                <div>
                                  <strong>Venda</strong>
                                  <span>
                                    {new Date(
                                      `${item.data}T00:00:00`,
                                    ).toLocaleDateString("pt-BR")}
                                  </span>
                                </div>

                                <strong className="valor-entrada">
                                  {formatarValor(item.valor)}
                                </strong>
                              </div>
                            ))}
                        </div>

                        <h3 className="titulo-grupo-historico">Saídas</h3>

                        <div className="lista-historico-relatorio">
                          {movimentacoesDaSemana
                            .filter((item) => item.tipo === "saida")
                            .sort((a, b) => b.data.localeCompare(a.data))
                            .map((item, indice) => (
                              <div
                                className="item-historico-relatorio"
                                key={`saida-${item.data}-${indice}`}
                              >
                                <div>
                                  <strong>
                                    {item.descricao ||
                                      item.categoria ||
                                      "Despesa"}
                                  </strong>
                                  <span>
                                    {new Date(
                                      `${item.data}T00:00:00`,
                                    ).toLocaleDateString("pt-BR")}
                                  </span>
                                </div>

                                <strong className="valor-saida">
                                  {formatarValor(item.valor)}
                                </strong>
                              </div>
                            ))}
                        </div>
                      </>
                    )
                  )}
                </div>

                <button
                  className="botao-voltar-relatorios"
                  onClick={() => setTela("relatorios")}
                >
                  ← Voltar aos relatórios
                </button>
              </>
            )}

            {tela === "relatorio-anual" && (
              <>
                <h2>Relatório anual</h2>
                <p>Consulte os resultados financeiros por ano.</p>

                <div className="filtros-relatorio">
                  <div>
                    <label htmlFor="ano-relatorio-anual">Ano</label>

                    <select
                      id="ano-relatorio-anual"
                      value={anoRelatorio}
                      onChange={(e) => setAnoRelatorio(e.target.value)}
                    >
                      {Array.from(
                        { length: 5 },
                        (_, i) => new Date().getFullYear() - i,
                      ).map((ano) => (
                        <option key={ano} value={String(ano)}>
                          {ano}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="resumo-financeiro">
                  <div className="card-resumo">
                    <h3>Total de entradas</h3>
                    <p className="valor-entrada">
                      {formatarValor(totalEntradasAno)}
                    </p>
                  </div>

                  <div className="card-resumo">
                    <h3>Total de saídas</h3>
                    <p className="valor-saida">
                      {formatarValor(totalSaidasAno)}
                    </p>
                  </div>

                  <div className="card-resumo">
                    <h3>Saldo do ano</h3>
                    <p>{formatarValor(saldoAno)}</p>
                  </div>
                </div>

                <div className="resumo-financeiro">
                  <div className="card-resumo">
                    <h3>Vendas por PIX</h3>
                    <p>{formatarValor(totalPixAno)}</p>
                  </div>

                  <div className="card-resumo">
                    <h3>Vendas em dinheiro</h3>
                    <p>{formatarValor(totalEspecieAno)}</p>
                  </div>

                  <div className="card-resumo">
                    <h3>Vendas no cartão</h3>
                    <p>{formatarValor(totalCartaoAno)}</p>
                  </div>
                </div>

                <div className="secao-despesas">
                  <h3>Despesas por categoria</h3>

                  {Object.keys(despesasPorCategoriaAno).length === 0 ? (
                    <p>Nenhuma despesa registrada neste ano.</p>
                  ) : (
                    <div className="lista-despesas-categoria">
                      {Object.entries(despesasPorCategoriaAno).map(
                        ([categoria, valor]) => (
                          <div
                            className="item-despesa-categoria"
                            key={categoria}
                          >
                            <strong>{categoria}</strong>
                            <span>{formatarValor(valor)}</span>
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </div>

                <div className="secao-historico">
                  <h3>Histórico de movimentações</h3>

                  {movimentacoesDoAno.length === 0 ? (
                    <p>Nenhuma movimentação registrada neste ano.</p>
                  ) : (
                    <>
                      {/* ENTRADAS */}
                      <h3 className="titulo-grupo-historico">Entradas</h3>

                      {Array.from({ length: 12 }, (_, indice) => {
                        const numeroMes = String(indice + 1).padStart(2, "0")

                        const movimentacoesMes = movimentacoesDoAno
                          .filter(
                            (item) =>
                              item.tipo === "entrada" &&
                              item.data?.slice(5, 7) === numeroMes,
                          )
                          .sort((a, b) => b.data.localeCompare(a.data))

                        if (movimentacoesMes.length === 0) return null

                        const expandido =
                          mesesEntradasAnualExpandidos.includes(numeroMes)

                        return (
                          <div key={`entradas-${numeroMes}`}>
                            <div className="cabecalho-historico">
                              <h3>
                                {new Date(
                                  Number(anoRelatorio),
                                  indice,
                                  1,
                                ).toLocaleDateString("pt-BR", {
                                  month: "long",
                                })}
                              </h3>

                              <button
                                type="button"
                                className="botao-toggle-historico"
                                onClick={() =>
                                  setMesesEntradasAnualExpandidos((atuais) =>
                                    expandido
                                      ? atuais.filter(
                                          (mes) => mes !== numeroMes,
                                        )
                                      : [...atuais, numeroMes],
                                  )
                                }
                              >
                                {expandido ? "Recolher" : "Ver entradas"}
                                {expandido ? " ▲" : " ▼"}
                              </button>
                            </div>

                            {expandido && (
                              <div className="lista-historico-relatorio">
                                {movimentacoesMes.map((item, indice) => (
                                  <div
                                    className="item-historico-relatorio"
                                    key={`entrada-${item.data}-${indice}`}
                                  >
                                    <div>
                                      <strong>Venda</strong>
                                      <span>
                                        {new Date(
                                          `${item.data}T00:00:00`,
                                        ).toLocaleDateString("pt-BR")}
                                      </span>
                                    </div>

                                    <strong className="valor-entrada">
                                      {formatarValor(item.valor)}
                                    </strong>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}

                      {/* SAÍDAS */}
                      <h3 className="titulo-grupo-historico">Saídas</h3>

                      {Array.from({ length: 12 }, (_, indice) => {
                        const numeroMes = String(indice + 1).padStart(2, "0")

                        const movimentacoesMes = movimentacoesDoAno
                          .filter(
                            (item) =>
                              item.tipo === "saida" &&
                              item.data?.slice(5, 7) === numeroMes,
                          )
                          .sort((a, b) => b.data.localeCompare(a.data))

                        if (movimentacoesMes.length === 0) return null

                        const expandido =
                          mesesSaidasAnualExpandidos.includes(numeroMes)

                        return (
                          <div key={`saidas-${numeroMes}`}>
                            <div className="cabecalho-historico">
                              <h3>
                                {new Date(
                                  Number(anoRelatorio),
                                  indice,
                                  1,
                                ).toLocaleDateString("pt-BR", {
                                  month: "long",
                                })}
                              </h3>

                              <button
                                type="button"
                                className="botao-toggle-historico"
                                onClick={() =>
                                  setMesesSaidasAnualExpandidos((atuais) =>
                                    expandido
                                      ? atuais.filter(
                                          (mes) => mes !== numeroMes,
                                        )
                                      : [...atuais, numeroMes],
                                  )
                                }
                              >
                                {expandido ? "Recolher" : "Ver saídas"}
                                {expandido ? " ▲" : " ▼"}
                              </button>
                            </div>

                            {expandido && (
                              <div className="lista-historico-relatorio">
                                {movimentacoesMes.map((item, indice) => (
                                  <div
                                    className="item-historico-relatorio"
                                    key={`saida-${item.data}-${indice}`}
                                  >
                                    <div>
                                      <strong>
                                        {item.descricao ||
                                          item.categoria ||
                                          "Despesa"}
                                      </strong>
                                      <span>
                                        {new Date(
                                          `${item.data}T00:00:00`,
                                        ).toLocaleDateString("pt-BR")}
                                      </span>
                                    </div>

                                    <strong className="valor-saida">
                                      {formatarValor(item.valor)}
                                    </strong>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </>
                  )}
                </div>

                <button
                  className="botao-voltar-relatorios"
                  onClick={() => setTela("relatorios")}
                >
                  ← Voltar aos relatórios
                </button>

                {mostrarBotaoTopo && (
                  <button
                    type="button"
                    className="botao-voltar-topo"
                    onClick={() =>
                      window.scrollTo({
                        top: 0,
                        behavior: "smooth",
                      })
                    }
                    aria-label="Voltar ao topo"
                  >
                    ↑
                  </button>
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
