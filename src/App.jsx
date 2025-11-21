import { useState, useEffect, useRef } from "react";
import "./App.css";

function App() {
  // Estados de configuración
  const [numJugadores, setNumJugadores] = useState(0);
  const [tiempoContador, setTiempoContador] = useState(30);
  const [tiempoInput, setTiempoInput] = useState("30");
  const [palabrasJugadores, setPalabrasJugadores] = useState([]);

  // Estados del juego
  const [rondaActual, setRondaActual] = useState(1);
  const [equipoActual, setEquipoActual] = useState(1); // 1 o 2
  const [palabrasRonda, setPalabrasRonda] = useState([]);
  const [palabraActual, setPalabraActual] = useState(null);
  const [indicePalabra, setIndicePalabra] = useState(0);
  const [tiempoRestante, setTiempoRestante] = useState(0);
  const [juegoIniciado, setJuegoIniciado] = useState(false);
  const [pausado, setPausado] = useState(false);
  const rondaTerminadaRef = useRef(false);

  // Puntuaciones
  const [puntuacionEquipo1, setPuntuacionEquipo1] = useState(0);
  const [puntuacionEquipo2, setPuntuacionEquipo2] = useState(0);
  const [puntuacionTotalEquipo1, setPuntuacionTotalEquipo1] = useState(0);
  const [puntuacionTotalEquipo2, setPuntuacionTotalEquipo2] = useState(0);

  // Refs para mantener los valores actuales de las puntuaciones
  const puntuacionEquipo1Ref = useRef(0);
  const puntuacionEquipo2Ref = useRef(0);

  // Actualizar los refs cuando cambian las puntuaciones
  useEffect(() => {
    puntuacionEquipo1Ref.current = puntuacionEquipo1;
  }, [puntuacionEquipo1]);

  useEffect(() => {
    puntuacionEquipo2Ref.current = puntuacionEquipo2;
  }, [puntuacionEquipo2]);

  // Estados de pantalla
  const [pantalla, setPantalla] = useState("config"); // config, palabras, juego, resultado-ronda, resultado-final
  const [jugadorActual, setJugadorActual] = useState(0); // Índice del jugador ingresando palabras

  // Timer
  useEffect(() => {
    let intervalo = null;
    if (juegoIniciado && !pausado && tiempoRestante > 0) {
      intervalo = setInterval(() => {
        setTiempoRestante((prev) => {
          if (prev <= 1) {
            // Se acabó el tiempo
            setJuegoIniciado(false);
            setPausado(true);
            // Si es la última palabra, terminar la ronda directamente
            if (indicePalabra >= palabrasRonda.length - 1) {
              terminarRonda();
            } else {
              // Si no es la última, cambiar de equipo para que el otro intente
              setEquipoActual((equipo) => (equipo === 1 ? 2 : 1));
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalo) clearInterval(intervalo);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [juegoIniciado, pausado, indicePalabra, palabrasRonda.length]);

  // Función para mezclar array aleatoriamente (Fisher-Yates)
  const mezclarArray = (array) => {
    const mezclado = [...array];
    for (let i = mezclado.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [mezclado[i], mezclado[j]] = [mezclado[j], mezclado[i]];
    }
    return mezclado;
  };

  // Inicializar palabras para la ronda
  const inicializarRonda = (equipoInicial = null) => {
    const todasLasPalabras = palabrasJugadores.flat();
    const palabrasMezcladas = mezclarArray(todasLasPalabras);
    setPalabrasRonda(palabrasMezcladas);
    setIndicePalabra(0);
    // Si se especifica un equipo inicial, usarlo; si no, alternar con el equipo actual
    if (equipoInicial !== null) {
      setEquipoActual(equipoInicial);
    } else {
      // Alternar: si el equipo actual es 1, empezar con 2, y viceversa
      setEquipoActual((prev) => (prev === 1 ? 2 : 1));
    }
    setPuntuacionEquipo1(0);
    setPuntuacionEquipo2(0);
    setPausado(false);
    setJuegoIniciado(false);
    rondaTerminadaRef.current = false; // Resetear el ref de ronda terminada
    if (palabrasMezcladas.length > 0) {
      setPalabraActual(palabrasMezcladas[0]);
    }
  };

  // Iniciar juego de la ronda
  const iniciarJuego = () => {
    if (palabrasRonda.length === 0) {
      inicializarRonda();
    }
    // Verificar si ya no hay más palabras antes de iniciar
    if (indicePalabra >= palabrasRonda.length) {
      terminarRonda();
      return;
    }
    setJuegoIniciado(true);
    setPausado(false);
    setTiempoRestante(tiempoContador); // Resetear contador para el nuevo turno
    // Asegurar que se muestre la palabra actual (la misma si cambió de equipo, o la siguiente si es el inicio)
    if (!palabraActual && indicePalabra < palabrasRonda.length) {
      setPalabraActual(palabrasRonda[indicePalabra]);
    } else if (palabraActual && indicePalabra < palabrasRonda.length) {
      // Mantener la palabra actual cuando cambia de equipo
      setPalabraActual(palabrasRonda[indicePalabra]);
    }
  };

  // Manejar respuesta correcta
  const handleCorrecto = () => {
    const esUltimaPalabra = indicePalabra >= palabrasRonda.length - 1;

    if (equipoActual === 1) {
      const nuevoValor = puntuacionEquipo1Ref.current + 1;
      puntuacionEquipo1Ref.current = nuevoValor; // Actualizar ref inmediatamente
      setPuntuacionEquipo1(nuevoValor);

      // Si es la última palabra, terminar la ronda pasando el valor directamente
      if (esUltimaPalabra) {
        terminarRonda(nuevoValor, puntuacionEquipo2Ref.current);
        return;
      }
    } else {
      const nuevoValor = puntuacionEquipo2Ref.current + 1;
      puntuacionEquipo2Ref.current = nuevoValor; // Actualizar ref inmediatamente
      setPuntuacionEquipo2(nuevoValor);

      // Si es la última palabra, terminar la ronda pasando el valor directamente
      if (esUltimaPalabra) {
        terminarRonda(puntuacionEquipo1Ref.current, nuevoValor);
        return;
      }
    }

    // Solo avanzar a la siguiente palabra si NO es la última
    siguientePalabra();
  };

  // Manejar respuesta incorrecta
  const handleIncorrecto = () => {
    setJuegoIniciado(false);
    setPausado(true);
    // No avanzamos la palabra, el otro equipo intentará la misma
    cambiarEquipo();
  };

  // Cambiar de equipo
  const cambiarEquipo = () => {
    if (equipoActual === 1) {
      setEquipoActual(2);
    } else {
      setEquipoActual(1);
    }
  };

  // Siguiente palabra
  const siguientePalabra = () => {
    const nuevoIndice = indicePalabra + 1;
    if (nuevoIndice < palabrasRonda.length) {
      setIndicePalabra(nuevoIndice);
      setPalabraActual(palabrasRonda[nuevoIndice]);
      // NO se resetea el tiempo, continúa desde donde estaba
    } else {
      // Se terminaron las palabras de la ronda
      terminarRonda();
    }
  };

  // Terminar ronda
  const terminarRonda = (p1Override = null, p2Override = null) => {
    // Evitar que se llame múltiples veces usando ref para verificación síncrona
    if (rondaTerminadaRef.current) return;
    rondaTerminadaRef.current = true;
    setJuegoIniciado(false);
    setPausado(true);
    // Usar los valores pasados como parámetros si están disponibles, sino usar los refs
    const p1 = p1Override !== null ? p1Override : puntuacionEquipo1Ref.current;
    const p2 = p2Override !== null ? p2Override : puntuacionEquipo2Ref.current;
    setPuntuacionTotalEquipo1((prev) => prev + p1);
    setPuntuacionTotalEquipo2((prev) => prev + p2);
    setPantalla("resultado-ronda");
  };

  // Continuar a siguiente ronda o finalizar
  const continuarSiguienteRonda = () => {
    if (rondaActual < 3) {
      setRondaActual((prev) => prev + 1);
      // El equipo que empieza la siguiente ronda es el opuesto al que terminó la anterior
      const equipoSiguiente = equipoActual === 1 ? 2 : 1;
      inicializarRonda(equipoSiguiente);
      setPantalla("juego");
    } else {
      setPantalla("resultado-final");
    }
  };

  // Reiniciar juego
  const reiniciarJuego = () => {
    setNumJugadores(0);
    setTiempoContador(30);
    setTiempoInput("30");
    setPalabrasJugadores([]);
    setJugadorActual(0);
    setRondaActual(1);
    setEquipoActual(1);
    setPalabrasRonda([]);
    setPalabraActual(null);
    setIndicePalabra(0);
    setTiempoRestante(0);
    setJuegoIniciado(false);
    setPausado(false);
    setPuntuacionEquipo1(0);
    setPuntuacionEquipo2(0);
    setPuntuacionTotalEquipo1(0);
    setPuntuacionTotalEquipo2(0);
    setPantalla("config");
  };

  // Configuración inicial
  if (pantalla === "config") {
    return (
      <div className="app">
        <div className="container">
          <h1>Juego de Palabras</h1>
          <div className="form-group">
            <label htmlFor="numJugadores">Cantidad de Jugadores:</label>
            <input
              type="number"
              id="numJugadores"
              min="2"
              value={numJugadores || ""}
              onChange={(e) => setNumJugadores(parseInt(e.target.value) || 0)}
              placeholder="Mínimo 2"
            />
          </div>
          <div className="form-group">
            <label htmlFor="tiempo">Tiempo por turno (segundos):</label>
            <input
              type="number"
              id="tiempo"
              min="5"
              max="120"
              value={tiempoInput}
              onChange={(e) => {
                const valor = e.target.value;
                setTiempoInput(valor);
                const numValor = parseInt(valor);
                if (valor === "" || (numValor >= 5 && numValor <= 120)) {
                  setTiempoContador(valor === "" ? 30 : numValor);
                }
              }}
              onBlur={(e) => {
                const numValor = parseInt(e.target.value);
                if (e.target.value === "" || numValor < 5) {
                  setTiempoInput("30");
                  setTiempoContador(30);
                } else if (numValor > 120) {
                  setTiempoInput("120");
                  setTiempoContador(120);
                }
              }}
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={() => {
              if (numJugadores >= 2) {
                setPalabrasJugadores(
                  Array(numJugadores)
                    .fill(null)
                    .map(() => ["", ""])
                );
                setJugadorActual(0);
                setPantalla("palabras");
              } else {
                alert("Debe haber al menos 2 jugadores");
              }
            }}
            disabled={numJugadores < 2}
          >
            Continuar
          </button>
        </div>
      </div>
    );
  }

  // Ingreso de palabras
  if (pantalla === "palabras") {
    const palabrasJugadorActual = palabrasJugadores[jugadorActual];
    const esUltimoJugador = jugadorActual === numJugadores - 1;
    const palabrasCompletas =
      palabrasJugadorActual &&
      palabrasJugadorActual[0].trim() &&
      palabrasJugadorActual[1].trim();

    const siguienteJugador = () => {
      if (palabrasCompletas) {
        if (esUltimoJugador) {
          // Verificar que todos tengan sus palabras completas
          const todasCompletas = palabrasJugadores.every(
            (palabras) => palabras[0].trim() && palabras[1].trim()
          );
          if (todasCompletas) {
            inicializarRonda();
            setPantalla("juego");
          }
        } else {
          setJugadorActual((prev) => prev + 1);
        }
      } else {
        alert("Debes ingresar ambas palabras antes de continuar");
      }
    };

    return (
      <div className="app">
        <div className="container">
          <h2>Ingresar Palabras</h2>
          <p className="info-text">
            Jugador {jugadorActual + 1} de {numJugadores}
          </p>
          <p className="info-text">Ingresa tus 2 palabras</p>
          <div className="jugador-form">
            <h3>Jugador {jugadorActual + 1}</h3>
            <div className="palabras-inputs">
              <input
                type="text"
                placeholder="Palabra 1"
                value={palabrasJugadorActual ? palabrasJugadorActual[0] : ""}
                onChange={(e) => {
                  const nuevasPalabras = [...palabrasJugadores];
                  nuevasPalabras[jugadorActual][0] = e.target.value;
                  setPalabrasJugadores(nuevasPalabras);
                }}
                autoFocus
              />
              <input
                type="text"
                placeholder="Palabra 2"
                value={palabrasJugadorActual ? palabrasJugadorActual[1] : ""}
                onChange={(e) => {
                  const nuevasPalabras = [...palabrasJugadores];
                  nuevasPalabras[jugadorActual][1] = e.target.value;
                  setPalabrasJugadores(nuevasPalabras);
                }}
              />
            </div>
          </div>
          <button className="btn btn-primary" onClick={siguienteJugador}>
            {esUltimoJugador ? "Iniciar Juego" : "Siguiente"}
          </button>
        </div>
      </div>
    );
  }

  // Pantalla de juego
  if (pantalla === "juego") {
    const palabrasRestantes = palabrasRonda.length - indicePalabra;

    return (
      <div className="app">
        <div className="container juego-container">
          <div className="ronda-info">
            <h2>Ronda {rondaActual} de 3</h2>
            <div className="equipos-info">
              <div className={`equipo ${equipoActual === 1 ? "activo" : ""}`}>
                <span>Equipo 1</span>
                <span className="puntuacion">{puntuacionEquipo1}</span>
              </div>
              <div className={`equipo ${equipoActual === 2 ? "activo" : ""}`}>
                <span>Equipo 2</span>
                <span className="puntuacion">{puntuacionEquipo2}</span>
              </div>
            </div>
            <p className="palabras-restantes">
              Palabras restantes: {palabrasRestantes}
            </p>
          </div>

          {!juegoIniciado && (
            <div className="inicio-ronda">
              <p className="equipo-turno">Turno del Equipo {equipoActual}</p>
              <button
                className="btn btn-primary btn-grande"
                onClick={iniciarJuego}
              >
                {pausado ? "Continuar" : "Iniciar"}
              </button>
            </div>
          )}

          {juegoIniciado && palabraActual && (
            <div className="juego-activo">
              <div className="contador-tiempo">
                <div
                  className={`tiempo ${tiempoRestante <= 5 ? "urgente" : ""}`}
                >
                  {tiempoRestante}s
                </div>
              </div>
              <div className="palabra-actual">
                <h1>{palabraActual}</h1>
              </div>
              <div className="botones-respuesta">
                <button className="btn btn-correcto" onClick={handleCorrecto}>
                  ✓ Correcto
                </button>
                <button
                  className="btn btn-incorrecto"
                  onClick={handleIncorrecto}
                >
                  ✗ Incorrecto
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Resultado de ronda
  if (pantalla === "resultado-ronda") {
    return (
      <div className="app">
        <div className="container">
          <h2>Ronda {rondaActual} Finalizada</h2>
          <div className="resultados-ronda">
            <div className="resultado-equipo">
              <h3>Equipo 1</h3>
              <div className="puntuacion-grande">{puntuacionEquipo1}</div>
              <p className="puntuacion-total">
                Total acumulado: {puntuacionTotalEquipo1}
              </p>
            </div>
            <div className="resultado-equipo">
              <h3>Equipo 2</h3>
              <div className="puntuacion-grande">{puntuacionEquipo2}</div>
              <p className="puntuacion-total">
                Total acumulado: {puntuacionTotalEquipo2}
              </p>
            </div>
          </div>
          <button
            className="btn btn-primary btn-grande"
            onClick={continuarSiguienteRonda}
          >
            {rondaActual < 3 ? "Siguiente Ronda" : "Ver Resultado Final"}
          </button>
        </div>
      </div>
    );
  }

  // Resultado final
  if (pantalla === "resultado-final") {
    const ganador =
      puntuacionTotalEquipo1 > puntuacionTotalEquipo2
        ? 1
        : puntuacionTotalEquipo2 > puntuacionTotalEquipo1
        ? 2
        : 0;

    return (
      <div className="app">
        <div className="container">
          <h1>¡Juego Finalizado!</h1>
          <div className="resultados-finales">
            <div
              className={`resultado-equipo-final ${
                ganador === 1 ? "ganador" : ""
              }`}
            >
              <h2>Equipo 1</h2>
              <div className="puntuacion-final">{puntuacionTotalEquipo1}</div>
              {ganador === 1 && <p className="texto-ganador">🏆 ¡Ganador!</p>}
            </div>
            <div
              className={`resultado-equipo-final ${
                ganador === 2 ? "ganador" : ""
              }`}
            >
              <h2>Equipo 2</h2>
              <div className="puntuacion-final">{puntuacionTotalEquipo2}</div>
              {ganador === 2 && <p className="texto-ganador">🏆 ¡Ganador!</p>}
            </div>
            {ganador === 0 && <p className="texto-empate">¡Empate!</p>}
          </div>
          <button
            className="btn btn-primary btn-grande"
            onClick={reiniciarJuego}
          >
            Jugar de Nuevo
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default App;
